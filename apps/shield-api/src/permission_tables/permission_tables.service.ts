import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { Collection, Db, ObjectId, WithId } from "mongodb";
import { TrinoService } from "src/trino/trino.service";
import { UserRowFilterValue } from "src/user/user.classes";
import { RowFilterFlatTreeValueDto, RowFilterTreeValueDto } from "./permission_table.dto";
import { PermissionTable, RowFilter } from "./permission_tables.classes";
import { PermissionTableDictionary, RowFilterValuesByDimensionsTable } from "./permissions_tables.interfaces";
import { IORedis } from "src/redis/ioredis";
import { REDIS_KEYS } from "src/redis/ioredis.keys";
import { DB_CONNECTION_PROVIDER } from "src/utils/constants";
import { InjectModel } from "@nestjs/mongoose";
import { HydratedDocument, Model } from "mongoose";
import { PermissionTable as MongoosePermissionTable } from "@port/shield-models";

@Injectable()
export class PermissionTablesService {
  private readonly logger = new Logger(PermissionTablesService.name);
  /**@deprecated */
  private readonly permissionTablesCollection: Collection<PermissionTable>;

  constructor(
    @Inject(DB_CONNECTION_PROVIDER) private db: Db,
    private readonly trinoService: TrinoService,
    private readonly ioredis: IORedis,
    @InjectModel(MongoosePermissionTable.name) private readonly permissionTableModel: Model<MongoosePermissionTable>,
  ) {
    this.permissionTablesCollection = this.db.collection<PermissionTable>("permission_tables");
  }

  async getPermissionTables(): Promise<WithId<MongoosePermissionTable>[]> {
    return await this.permissionTableModel.find();
  }

  async getPermissionTableById(id: ObjectId): Promise<WithId<PermissionTable> | null> {
    return await this.permissionTablesCollection.findOne({ _id: id });
  }

  async getPermissionTablesByIds(
    ids: ObjectId[],
    options: { throwIfNotAllFound: boolean },
  ): Promise<HydratedDocument<MongoosePermissionTable>[]> {
    const permissionTables = await this.permissionTableModel
      .find({
        _id: { $in: ids },
      })
      .exec();

    if (options.throwIfNotAllFound && permissionTables.length !== ids.length) {
      throw new InternalServerErrorException("Not all permission tables found for given ids");
    }

    return permissionTables;
  }

  private createTreeData(data: RowFilterFlatTreeValueDto[]): RowFilterTreeValueDto[] {
    const hashTable = data.reduce<Record<string, RowFilterTreeValueDto>>((acc, value) => {
      acc[value.value] = { ...value, children: [] };

      return acc;
    }, {});

    const dataTree: RowFilterTreeValueDto[] = [];

    data.forEach((value) => {
      const hashTableValue = hashTable[value.value];

      if (!hashTableValue) {
        this.logger.error(`Value with id ${value.value} not found in hashTable`);
        return [];
      }

      if (value.parent) {
        const hashTableParent = hashTable[value.parent];

        if (!hashTableParent) {
          this.logger.error(`Parent with id ${value.parent} not found for value with id ${value.value}`);
          return [];
        }
        hashTableParent.children.push(hashTableValue);
      } else {
        dataTree.push(hashTableValue);
      }
    });

    return dataTree;
  }

  async getRowFilterValueOptions(
    permission_table_id: ObjectId,
    row_filter_kod: string,
    treeOptions: { unflatten: boolean },
  ): Promise<UserRowFilterValue[] | RowFilterFlatTreeValueDto[] | RowFilterTreeValueDto[]> {
    try {
      const [permissionTable] = await this.permissionTablesCollection
        .aggregate<{ row_filter: RowFilter[] }>([
          {
            $match: {
              _id: permission_table_id,
            },
          },
          {
            $project: {
              row_filter: {
                $filter: {
                  input: "$row_filters",
                  as: "rowFilter",
                  cond: {
                    $eq: ["$$rowFilter.kod", row_filter_kod],
                  },
                },
              },
            },
          },
        ])
        .toArray();

      if (!permissionTable || permissionTable.row_filter.length === 0) {
        throw new NotFoundException(
          `Could not find row filter with kod ${row_filter_kod} in permission table with id ${permission_table_id}`,
        );
      }

      const row_filter = permissionTable.row_filter[0]!;

      const redisKey = REDIS_KEYS.TRINO_DIMENSIONS_TABLE_VALUES(row_filter.dimensions_table);
      const redisValue = await this.ioredis.get(redisKey);

      if (row_filter.query_builder_type === "tree") {
        let flatTreeValues: RowFilterFlatTreeValueDto[] = [];

        if (redisValue) {
          flatTreeValues = JSON.parse(redisValue);
        } else {
          const query = `SELECT id AS value,
                         name AS display_name,
                         parent_id AS parent
                        FROM ${row_filter.dimensions_table}
                        `;

          flatTreeValues = await this.trinoService.query<RowFilterFlatTreeValueDto>(query);
          this.ioredis.set(redisKey, JSON.stringify(flatTreeValues), "EX", 60 * 60);
        }

        if (treeOptions.unflatten) {
          const treeValues = this.createTreeData(flatTreeValues);
          return treeValues;
        } else {
          return flatTreeValues;
        }
      } else {
        let rowFilterValues: UserRowFilterValue[] = [];

        if (redisValue) {
          rowFilterValues = JSON.parse(redisValue);
        } else {
          const query = `SELECT id AS value, name AS display_name FROM ${row_filter.dimensions_table}`;
          rowFilterValues = await this.trinoService.query<UserRowFilterValue>(query);
          this.ioredis.set(redisKey, JSON.stringify(rowFilterValues), "EX", 60 * 60);
        }

        rowFilterValues.sort((firstRowFilterValue, secondRowFilterValue) =>
          firstRowFilterValue.display_name.toString().localeCompare(secondRowFilterValue.display_name, "he"),
        );

        return rowFilterValues;
      }
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
  async getRowFilterValuesByDimensionsTable(
    permissionTables: Pick<PermissionTable, "row_filters">[],
  ): Promise<RowFilterValuesByDimensionsTable> {
    const dimensionsTablesByType = permissionTables
      .flatMap((permissionTable) => permissionTable.row_filters)
      .reduce<Record<RowFilter["type"], { tree: Set<RowFilter["dimensions_table"]>; normal: Set<RowFilter["dimensions_table"]> }>>(
        (acc, rowFilter) => {
          const isTree = rowFilter.query_builder_type === "tree";
          acc[rowFilter.type][isTree ? "tree" : "normal"].add(rowFilter.dimensions_table);

          return acc;
        },
        {
          string: { tree: new Set(), normal: new Set() },
          boolean: { tree: new Set(), normal: new Set() },
          integer: { tree: new Set(), normal: new Set() },
        },
      );

    const uniqueDimensionsTables = Object.values(dimensionsTablesByType).flatMap(({ tree, normal }) => [...tree, ...normal]);

    const cachedRowFilterValues = await Promise.all(
      uniqueDimensionsTables.map(async (dimensionsTable) => ({
        dimensionsTable,
        value: await this.ioredis.get(REDIS_KEYS.TRINO_DIMENSIONS_TABLE_VALUES(dimensionsTable)),
      })),
    );

    const formattedCachedRowFilterValues = cachedRowFilterValues.reduce<RowFilterValuesByDimensionsTable>((acc, cachedRowFilter) => {
      if (cachedRowFilter.value) {
        const parsedValue: RowFilterValuesByDimensionsTable[RowFilter["dimensions_table"]] = JSON.parse(cachedRowFilter.value);
        acc[cachedRowFilter.dimensionsTable] = parsedValue;
      }

      return acc;
    }, {});

    const freshRowFilterValues = (
      await Promise.all(
        Object.values(dimensionsTablesByType).map(async (dimensionsTables) => {
          const normalQuery = [...dimensionsTables.normal]
            .filter((dimensionsTable) => !formattedCachedRowFilterValues[dimensionsTable])
            .map(
              (dimensionsTable) =>
                `SELECT '${dimensionsTable}' AS dimensions_table, id AS value, name AS display_name
                   FROM ${dimensionsTable}`,
            )
            .join("\nUNION ALL\n");
          const treeQuery = [...dimensionsTables.tree]
            .filter((dimensionsTable) => !formattedCachedRowFilterValues[dimensionsTable])
            .map(
              (dimensionsTable) =>
                `SELECT '${dimensionsTable}' AS dimensions_table, id AS value, name AS display_name, parent_id AS parent
                   FROM ${dimensionsTable}`,
            )
            .join("\nUNION ALL\n");

          const rowFilterValues = (
            await Promise.all([
              this.trinoService.query<{ dimensions_table: RowFilter["dimensions_table"] } & UserRowFilterValue>(normalQuery),
              this.trinoService.query<{ dimensions_table: RowFilter["dimensions_table"] } & RowFilterFlatTreeValueDto>(treeQuery),
            ])
          ).flat();

          return rowFilterValues;
        }),
      )
    ).flat();

    const formattedFreshRowFilterValues = uniqueDimensionsTables.reduce<RowFilterValuesByDimensionsTable>((acc, dimensionsTable) => {
      if (!formattedCachedRowFilterValues[dimensionsTable] && !acc[dimensionsTable]) acc[dimensionsTable] = [];

      return acc;
    }, {});

    freshRowFilterValues.forEach((rowFilterValue) => {
      formattedFreshRowFilterValues[rowFilterValue.dimensions_table]?.push({
        value: rowFilterValue.value,
        display_name: rowFilterValue.display_name,
        parent: "parent" in rowFilterValue ? rowFilterValue.parent : undefined,
      });
    });

    Object.entries(formattedFreshRowFilterValues).forEach(([dimensionsTable, values]) => {
      this.ioredis.set(REDIS_KEYS.TRINO_DIMENSIONS_TABLE_VALUES(dimensionsTable), JSON.stringify(values), "EX", 60 * 60);
    });

    return {
      ...formattedCachedRowFilterValues,
      ...formattedFreshRowFilterValues,
    };
  }

  async getPermissionTableDictionary(): Promise<PermissionTableDictionary> {
    const permissionTables = await this.permissionTableModel.find();

    return permissionTables.reduce(
      (acc, table) => ({
        ...acc,
        [table.name]: {
          permission_keys: table.permission_keys.reduce((acc, { name, trino_type }) => ({ ...acc, [name]: trino_type }), {}),
        },
      }),
      {} as PermissionTableDictionary,
    );
  }
}

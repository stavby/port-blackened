import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClassificationStateEvent, UserID } from "@port/common-schemas";
import { KeycloakAdmin } from "@port/keycloak-admin";
import { lensHandlerApi } from "@port/lens-handler-requests";
import {
  ClientBatchCheckItem,
  FGADomainRelationConstants,
  FGADomain_classificationRelationConstants,
  FGASchemaRelationConstants,
  FGATupleKey,
  formatFGAObjectId,
} from "@port/openfga-client";
import {
  Column,
  ColumnDictDiff,
  MaskType,
  Table as MongooseTable,
  Task as MongooseTask,
  OP,
  Resource,
  SapTables,
  TableFullVerificationDiff,
  TableVerificationStageDiff,
} from "@port/shield-models";
import { VerificationStage } from "@port/shield-schemas";
import { TEST_SCHEMA_NAME, stringify } from "@port/utils";
import { Collection, Db, ObjectId, WithId } from "mongodb";
import mongoose, { AnyBulkWriteOperation, Document, FlattenMaps, Model } from "mongoose";
import AuditingService from "src/auditing/auditing.service";
import { AUDITING_UNKNOWN, InsertTableAudit } from "src/auditing/auditing.types";
import { LoggedUser } from "src/auth/auth.interface";
import { Classification } from "src/classifications/classifications.classes";
import { ClassificationsService } from "src/classifications/classifications.service";
import { Domain } from "src/domains/domains.dto";
import { DomainsService } from "src/domains/domains.service";
import { ExcelService } from "src/excel/excel.service";
import { KafkaProducerTopics, KafkaService } from "src/kafka/kafka.service";
import { OpenFgaService } from "src/openfga/openfga.service";
import { PermissionTablesService } from "src/permission_tables/permission_tables.service";
import { TaskOperationKind } from "src/tasks/tasks.interface";
import { TasksService } from "src/tasks/tasks.service";
import { TrinoService } from "src/trino/trino.service";
import { KEYCLOAK_ADMIN_PROVIDE } from "src/user-info/keycloak-admin.provider";
import { GetUserInfoDto } from "src/user-info/user-info.interface";
import { DB_CONNECTION_PROVIDER, INTERNAL_RESOURCE_ID } from "src/utils/constants";
import { customDiff, formatRawStandardTable, parseRawTable, ShieldStandardTable } from "src/utils/utils";
import {
  ColumnsDict,
  EditableColumnAttrs,
  EditableColumnsDict,
  SchemasDictionary,
  Table,
  TableWithSapIndication,
  TablesDictionary,
} from "./table.classes";
import { ClassificationState, DEFAULT_MASK, dbTypeMapping } from "./table.constants";
import {
  DeprecateTablesDto,
  GetTableByIdDto,
  GetTableDto,
  GetTablesDto,
  UpsertExternalTablesDto,
  UpsertTableResponseDto,
} from "./table.dto";
import { UpsertTable, UpsertTableWithOwner } from "./table.interface";
import { getColumnsDictDiff, getFullVerificationDiff, getTablesDiff, getVerificationDiff, upsertTableToSpyglassEvent } from "./table.utils";

const TABLES_WITH_DOMAIN_NAME_PIPELINE = [
  {
    $lookup: {
      from: "domains",
      localField: "attributes.domain_id",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            display_name: 1,
          },
        },
      ],
      as: "domain",
    },
  },
  {
    $project: {
      connection_display_name: { $ifNull: ["$connection.display_name", ""] },
      table_name: 1,
      table_display_name: 1,
      table_desc: 1,
      columns_dict: 1,
      source_type: 1,
      domain_display_name: {
        $arrayElemAt: ["$domain.display_name", 0],
      },
      domain_id: {
        $arrayElemAt: ["$domain._id", 0],
      },
      is_sap: 1,
      verification_stages: 1,
      last_verification_time: 1,
    },
  },
];

export const TABLES_IS_SAP_PIPELINE = [
  {
    $addFields: {
      full_table_name: { $concat: ["$schema_name", ".", "$table_name"] },
    },
  },
  {
    $lookup: {
      from: "sap_tables",
      let: { full_table_name: "$full_table_name" },
      pipeline: [
        { $addFields: { full_table_name: { $concat: ["$schema_name", ".", "$table_name"] } } },
        { $match: { $expr: { $eq: ["$full_table_name", "$$full_table_name"] } } },
      ],
      as: "sap_table",
    },
  },
  {
    $addFields: {
      is_sap: { $gt: [{ $size: "$sap_table" }, 0] },
    },
  },
  { $project: { sap_table: false } },
];

@Injectable()
export class TableService {
  private readonly logger = new Logger(TableService.name);
  /**@deprecated */
  private readonly tablesCollection: Collection<Table>;

  constructor(
    /**@deprecated */
    @Inject(DB_CONNECTION_PROVIDER)
    private readonly db: Db,
    private readonly auditingService: AuditingService,
    private readonly kafkaService: KafkaService,
    private readonly excelService: ExcelService,
    private readonly openFgaService: OpenFgaService,

    private readonly trinoService: TrinoService,
    private readonly tasksService: TasksService,
    private readonly domainsService: DomainsService,
    private readonly classificationsService: ClassificationsService,
    private readonly permissionTableService: PermissionTablesService,
    @Inject(KEYCLOAK_ADMIN_PROVIDE) private readonly keycloakAdmin: KeycloakAdmin,
    @InjectModel(SapTables.name) private readonly sapTablesModel: Model<SapTables>,
    @InjectModel(MongooseTable.name) private readonly tableModel: Model<MongooseTable>,
    @InjectModel(MongooseTask.name) private readonly taskModel: Model<MongooseTask>,
  ) {
    this.tablesCollection = db.collection<Table>("tables");
  }

  private calcColumnsDictClassificationState(columns_dict: Record<string, Column>) {
    let fullClassified = true;
    let partiallyClassified = false;
    let internalClassification = false;
    let classificationState = ClassificationState.UNCLASSIFIED;

    Object.values(columns_dict).forEach((column) => {
      const classifiction = column.attributes.classification;

      if (classifiction) {
        if (classifiction.equals(INTERNAL_RESOURCE_ID)) {
          internalClassification = true;
        } else {
          partiallyClassified = true;
        }
      } else {
        fullClassified = false;
      }
    });

    if (internalClassification) {
      classificationState = ClassificationState.INTERNALLY_CLASSIFIED;
    } else if (fullClassified) {
      classificationState = ClassificationState.CLASSIFIED;
    } else if (partiallyClassified) {
      classificationState = ClassificationState.PARTIALLY_CLASSIFIED;
    }

    return classificationState;
  }

  async getTables({ userId }: LoggedUser): Promise<GetTablesDto[]> {
    const domainsIds = await this.openFgaService.getUserDomainIdsByRelation(userId, FGADomainRelationConstants.can_classify_tables);

    if (domainsIds.length === 0) return [];

    const pipeline = [
      { $match: { "attributes.domain_id": { $in: domainsIds } } },
      ...TABLES_IS_SAP_PIPELINE,
      ...TABLES_WITH_DOMAIN_NAME_PIPELINE,
    ];
    const tables = await this.tableModel.aggregate<GetTablesDto & Pick<Table, "columns_dict">>(pipeline).exec();

    const formattedTables: GetTablesDto[] = tables.map((table) => {
      const classificationState = this.calcColumnsDictClassificationState(table.columns_dict);
      const { columns_dict: _, ...rest } = table;

      return { ...rest, classificationState };
    });

    return formattedTables;
  }

  async getTableById<P extends keyof WithId<TableWithSapIndication>>(
    tableId: ObjectId,
    properties?: P[],
  ): Promise<Pick<WithId<TableWithSapIndication>, P>> {
    const projection = properties?.reduce<Record<string, boolean>>((acc, property) => {
      acc[property] = true;

      return acc;
    }, {});
    const table = await this.tableModel.aggregate<Pick<WithId<TableWithSapIndication>, P>>([
      { $match: { _id: tableId } },
      { $addFields: { connection_display_name: { $ifNull: ["$connection.display_name", ""] } } },
      ...TABLES_IS_SAP_PIPELINE,
      ...(projection ? [{ $project: projection }] : []),
    ]);

    if (!table?.[0]) {
      throw new NotFoundException(`לא נמצאה טבלה עם מזהה ${tableId}`);
    }

    return table?.[0];
  }

  async getTablesByTableFullNames<P extends keyof WithId<MongooseTable>>(
    tableNames: string[] | Set<string>,
    properties?: P[],
  ): Promise<Pick<WithId<FlattenMaps<MongooseTable>>, P>[]> {
    const projection = properties?.reduce<Record<string, boolean>>((acc, property) => {
      acc[property] = true;

      return acc;
    }, {});

    const tables = await this.tableModel
      .find({
        $expr: { $in: [{ $concat: ["$schema_name", ".", "$table_name"] }, [...tableNames]] },
      })
      .select(projection ?? {})
      .lean();

    return tables;
  }

  async getColumnClassificationSuggestions(tableId: ObjectId, loggedUserId: LoggedUser["userId"]): Promise<{ [column: string]: string }> {
    try {
      const table = (
        await this.tablesCollection
          .aggregate<WithId<Pick<Table, "table_name" | "schema_name"> & { domain: WithId<Pick<Domain, "classifications">> }>>([
            { $match: { _id: tableId } },
            {
              $lookup: {
                from: "domains",
                localField: "attributes.domain_id",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: true,
                      classifications: true,
                    },
                  },
                ],
                as: "domain",
              },
            },
            {
              $project: {
                _id: true,
                table_name: true,
                schema_name: true,
                domain: { $arrayElemAt: ["$domain", 0] },
              },
            },
          ])
          .toArray()
      )[0];
      if (!table) throw new NotFoundException(`לא נמצאה טבלה עם מזהה ${tableId}`);

      const { allowed } = await this.openFgaService.check({
        user: formatFGAObjectId({ type: "user", id: loggedUserId }),
        relation: FGADomainRelationConstants.can_classify_tables,
        object: formatFGAObjectId({ type: "domain", id: table.domain._id.toString() }),
      });

      if (!allowed) {
        throw new ForbiddenException(`No permissions found for domain with id ${table.domain._id}`);
      }

      const lineage = await lensHandlerApi.getDatasetLineage({ tableSchema: table.schema_name, tableName: table.table_name });

      if (lineage.upstreams.length === 0) return {};

      const upstreamTables = await this.tableModel.find(
        {
          $or: lineage.upstreams.reduce<ShieldStandardTable[]>((acc, up) => {
            const table = parseRawTable(up.tableName);
            if (table) acc.push(table);
            return acc;
          }, []),
        },
        { _id: true, table_name: true, schema_name: true, columns_dict: true },
      );

      const suggestions = lineage.fineGrainedLineages.reduce<{ [column_name: string]: string }>((acc, fgl) => {
        if (fgl.upstreams.length === 1) {
          const upstreamColumn = fgl.upstreams[0];
          if (upstreamColumn) {
            const classification = upstreamTables
              .find((up) => formatRawStandardTable(up) === upstreamColumn.tableName)
              ?.columns_dict.get(upstreamColumn.column)?.attributes.classification;

            if (classification && table.domain.classifications.some((value) => value && value.equals(classification))) {
              acc[fgl.downstream.column] = classification.toString();
            }
          }
        }
        return acc;
      }, {});

      const classificationChecks = await this.openFgaService
        .batchCheck({
          checks: [...new Set(Object.values(suggestions))].map((classification) => ({
            user: formatFGAObjectId({ type: "user", id: loggedUserId }),
            relation: FGADomain_classificationRelationConstants.can_assign_to_table,
            object: formatFGAObjectId({
              type: "domain_classification",
              id: OpenFgaService.formatDomainClassification(table.domain._id, classification),
            }),
          })),
        })
        .then(
          ({ result }) =>
            new Map(
              result.reduce<[string, boolean][]>((acc, { allowed, request }) => {
                const classification = OpenFgaService.extractDomainClassification(request.object)?.classification;

                if (classification) {
                  acc.push([classification, allowed]);
                }
                return acc;
              }, []),
            ),
        );

      return Object.fromEntries(Object.entries(suggestions).filter(([_, classification]) => classificationChecks.get(classification)));
    } catch (error) {
      throw new InternalServerErrorException("הייתה בעיה בהשגת הצעות לסיווגי עמודות בטבלה", { cause: error });
    }
  }

  async getTableDtoById(tableId: ObjectId, loggedUserId: LoggedUser["userId"]): Promise<GetTableByIdDto> {
    const table = await this.getTableById(tableId, [
      "_id",
      "table_name",
      "columns_dict",
      "attributes",
      "permission_keys",
      "source_type",
      "verification_stages",
      "connection_display_name",
      "last_verification_time",
      "is_sap",
    ]);

    const { allowed } = await this.openFgaService.check({
      user: formatFGAObjectId({ type: "user", id: loggedUserId }),
      relation: FGADomainRelationConstants.can_classify_tables,
      object: formatFGAObjectId({ type: "domain", id: table.attributes.domain_id.toString() }),
    });

    if (!allowed) {
      throw new ForbiddenException(`No permissions found for domain with id ${table.attributes.domain_id}`);
    }

    const tableDto = this.toDtoTable(table);
    const internalClassificationId = new ObjectId(INTERNAL_RESOURCE_ID);
    const hasInternalClassification = Object.values(table.columns_dict).some(
      ({ attributes: { classification } }) => classification && classification.equals(internalClassificationId),
    );

    const pipeline = [
      { $match: { _id: tableDto.attributes.domain_id } },
      // fetching internal classification to display to the user that the table might have internal classification
      // domain might not have internal classifications
      ...(hasInternalClassification
        ? [{ $set: { classifications: { $concatArrays: ["$classifications", [new ObjectId(INTERNAL_RESOURCE_ID)]] } } }]
        : []),
      {
        $lookup: {
          from: "classifications",
          localField: "classifications",
          foreignField: "_id",
          as: "classifications",
        },
      },
      { $project: { _id: false, classifications: true } },
    ];

    const result = await this.db.collection<Domain>("domains").aggregate<{ classifications: WithId<Classification>[] }>(pipeline).toArray();

    const domainWithClassifications = result[0];
    if (!domainWithClassifications) {
      throw new NotFoundException(`Domain with id ${tableDto.attributes.domain_id} not found`);
    }

    const classifications: GetTableByIdDto["classifications"] = {
      all: [],
      user: [],
    };

    const { objects: domains_classifications } = await this.openFgaService.listObjects({
      user: formatFGAObjectId({ type: "user", id: loggedUserId }),
      relation: "can_assign_to_table",
      type: "domain_classification",
    });

    const classificationsByDomainId = this.openFgaService.getClassificationsByDomainID(domains_classifications);
    const classificationsHasPermission = classificationsByDomainId[table.attributes.domain_id.toString()] ?? [];

    if (domainWithClassifications) {
      classifications.all = domainWithClassifications.classifications;
      classifications.user = classifications.all.filter((classification) =>
        classificationsHasPermission.some((curr) => curr.equals(classification._id)),
      );
    }

    return {
      table: tableDto,
      classifications,
    };
  }

  private toDtoTable(
    table: Pick<
      WithId<TableWithSapIndication>,
      "_id" | "columns_dict" | "attributes" | "source_type" | "table_name" | "verification_stages" | "last_verification_time" | "is_sap"
    >,
  ): GetTableDto {
    const transformedColumnsDict = Object.values(table.columns_dict).reduce<GetTableDto["columns_dict"]>(
      (transformedColumnsDict, currColumn) => {
        const data_type = currColumn.attributes.data_type?.split("(")?.[0]?.toUpperCase() ?? "unknown";

        transformedColumnsDict[currColumn.column_name] = {
          ...currColumn,
          attributes: {
            ...currColumn.attributes,
            data_type_hebrew: data_type in dbTypeMapping ? dbTypeMapping[data_type as keyof typeof dbTypeMapping] : data_type,
          },
        };

        return transformedColumnsDict;
      },
      {},
    );

    return {
      ...table,
      columns_dict: transformedColumnsDict,
    };
  }

  async getTablesDictionary(): Promise<TablesDictionary> {
    const tables = await this.tableModel.aggregate<{ full_table_name: string; table_data: TablesDictionary[string] }>([
      {
        $lookup: {
          from: "permission_tables",
          localField: "permission_table",
          foreignField: "_id",
          as: "permission_table",
        },
      },
      {
        $unwind: {
          path: "$permission_table",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          permission_table_name: "$permission_table.name",
        },
      },
      { $unset: ["permission_table", "__v"] },
      {
        $project: {
          full_table_name: {
            $concat: ["$catalog_name", ".", "$schema_name", ".", "$table_name"],
          },
          table_data: {
            $unsetField: {
              field: "_id",
              input: "$$ROOT",
            },
          },
        },
      },
    ]);

    if (tables.length < 1) throw new NotFoundException("No tables found");
    return tables.reduce<TablesDictionary>((acc, table) => {
      acc[table.full_table_name] = table.table_data;
      return acc;
    }, {});
  }

  async getSchemasDictionary(): Promise<SchemasDictionary> {
    const tables = await this.tablesCollection
      .aggregate([
        {
          $group: {
            _id: { catalog_name: "$catalog_name", schema_name: "$schema_name" },
            tables: {
              $push: {
                $concat: ["$catalog_name", ".", "$schema_name", ".", "$table_name"],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            key: { $concat: ["$_id.catalog_name", ".", "$_id.schema_name"] },
            value: "$tables",
          },
        },
        {
          $group: { _id: null, result: { $push: { k: "$key", v: "$value" } } },
        },
        { $replaceRoot: { newRoot: { $arrayToObject: "$result" } } },
      ])
      .toArray();

    const schemasDict = tables[0];

    if (!schemasDict) throw new NotFoundException("No schemas found");

    return schemasDict;
  }

  /**
   * @audits
   */
  private async updateTable(
    tableId: ObjectId,
    table: Table,
    columnDict: EditableColumnsDict,
    userId: UserID,
    tableDiff: (ColumnDictDiff | TableVerificationStageDiff | TableFullVerificationDiff)[],
    verification_stages: VerificationStage[] | undefined,
  ) {
    const wasVerified = !!tableDiff.find((diff) => diff.kind === "full_verification" && diff.newValue);
    const wasUnverified = !!tableDiff.find((diff) => diff.kind === "full_verification" && !diff.newValue);
    const mergedColumnsDict = Object.values(table.columns_dict).reduce<ColumnsDict>((mergedColumnsDict, currColumn) => {
      const newColumn = columnDict[currColumn.column_name];

      if (newColumn) {
        mergedColumnsDict[currColumn.column_name] = {
          ...currColumn,
          attributes: {
            data_type: currColumn.attributes.data_type,
            column_display_name: currColumn.attributes.column_display_name,
            column_desc: currColumn.attributes.column_desc,
            ...newColumn.attributes,
          },
        };
      } else {
        mergedColumnsDict[currColumn.column_name] = currColumn;
      }

      return mergedColumnsDict;
    }, {});

    let resourceToModify: Resource = Resource.Table;
    try {
      await this.tableModel.updateOne(
        { _id: tableId },
        {
          $set: {
            columns_dict: mergedColumnsDict,
            ...(verification_stages ? { verification_stages } : {}),
            ...(wasVerified ? { last_verification_time: new Date() } : {}),
          },
        },
      );

      const classificationState = this.calcColumnsDictClassificationState(mergedColumnsDict);

      const fullyQualifiedTableName = formatRawStandardTable(table);
      this.emitClassificationStateEvent(fullyQualifiedTableName, table.columns_dict, mergedColumnsDict);

      if (wasVerified || wasUnverified) {
        this.emitAdditionalTagEvent(fullyQualifiedTableName, "verified", wasVerified);
      }

      this.auditingService.insertTableAudits({
        user_id: userId,
        table_id: tableId,
        tableDiff,
        operation: OP.Update,
      });

      if (classificationState === ClassificationState.CLASSIFIED) {
        resourceToModify = Resource.Task;
        const fullyClassifiedUpdateData = {
          done: true,
          approval_id: userId,
          approval_date: new Date(),
        };

        const updatedTasks = await this.db.collection("tasks").updateOne(
          { tableId, done: false },
          {
            $set: fullyClassifiedUpdateData,
          },
        );

        if (updatedTasks.modifiedCount > 0) {
          this.auditingService.insertLegacyAudit({
            user_id: userId,
            operation: OP.Update,
            resource: Resource.Task,
            status: "success",
            resource_info: {
              id: tableId.toString(),
              name: table.table_name,
            },
            message: "Edited Task",
            difference: customDiff({ done: false }, fullyClassifiedUpdateData, false),
          });
        }
      }
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: userId,
        operation: OP.Update,
        resource: resourceToModify,
        status: "error",
        resource_info: {
          id: tableId.toString(),
          name: table.table_name,
        },
        message: stringify(error),
        response_error_message: AUDITING_UNKNOWN,
      });
      throw error;
    }
  }

  async editTableById(
    tableId: ObjectId,
    editColumnsDict: EditableColumnsDict,
    verification_stages: VerificationStage[] | undefined,
    loggedUser: LoggedUser,
  ): Promise<void> {
    const table = await this.getTableById(tableId);
    const domainId = table.attributes.domain_id.toString();

    const { allowed } = await this.openFgaService.check({
      user: formatFGAObjectId({ type: "user", id: loggedUser.userId }),
      relation: FGADomainRelationConstants.can_classify_tables,
      object: formatFGAObjectId({ type: "domain", id: domainId }),
    });

    if (!allowed) {
      throw new ForbiddenException(`No permissions found for domain ${domainId}`);
    }

    const columnsDictDiff = getColumnsDictDiff(table.columns_dict, editColumnsDict);
    const checks: ClientBatchCheckItem[] = [];

    columnsDictDiff.forEach((diff) => {
      if (diff.kind === "classification") {
        if (diff.newValue) {
          checks.push({
            user: formatFGAObjectId({ type: "user", id: loggedUser.userId }),
            relation: FGADomain_classificationRelationConstants.can_assign_to_table,
            object: formatFGAObjectId({
              type: "domain_classification",
              id: OpenFgaService.formatDomainClassification(domainId, diff.newValue),
            }),
          });
        }
        if (diff.oldValue) {
          checks.push({
            user: formatFGAObjectId({ type: "user", id: loggedUser.userId }),
            relation: FGADomain_classificationRelationConstants.can_assign_to_table,
            object: formatFGAObjectId({
              type: "domain_classification",
              id: OpenFgaService.formatDomainClassification(domainId, diff.oldValue),
            }),
          });
        }
      }
    });

    const verificationDiff = getVerificationDiff(table.verification_stages, verification_stages);
    const fullVerificationDiff = getFullVerificationDiff(table.verification_stages ?? [], verification_stages ?? []);

    const { result } = await this.openFgaService.batchCheck({ checks });
    result.forEach((result) => {
      if (!result.allowed) throw new ForbiddenException(`No permissions found for ${result.request.object}`);
    });

    await this.updateTable(
      tableId,
      table,
      editColumnsDict,
      loggedUser.userId,
      [...columnsDictDiff, ...verificationDiff, ...fullVerificationDiff],
      verification_stages,
    );
  }

  async getTablesExcel(loggedUser: LoggedUser): Promise<unknown> {
    const classificationStateHeb = {
      [ClassificationState.CLASSIFIED]: "מסווג",
      [ClassificationState.UNCLASSIFIED]: "לא מסווג",
      [ClassificationState.PARTIALLY_CLASSIFIED]: "מסווג חלקית",
      [ClassificationState.INTERNALLY_CLASSIFIED]: "מסווג פנימית",
    } as const satisfies { [key in ClassificationState]: string };

    const tables = await this.getTables(loggedUser);
    const isContainsSap = tables.some(({ is_sap }) => is_sap);

    const tablesExcel = tables.map((row) => ({
      classificationState: classificationStateHeb[row.classificationState],
      domain: row.domain_display_name,
      source: row.connection_display_name || row.source_type,
      name: row.table_name,
      display_name: row.table_display_name,
      description: row.table_desc,
      ...(isContainsSap ? { is_sap: row.is_sap ? "כן" : "" } : {}),
    }));

    type Row = typeof tablesExcel extends (infer T)[] ? T : typeof tablesExcel;

    const tablesExcelFile = this.excelService.convertToExcel(tablesExcel, [
      { name: "classificationState", displayName: "מצב סיווג", options: { wch: 10 } },
      { name: "domain", displayName: "עולם תוכן", options: { wch: 16 } },
      { name: "source", displayName: "מערכת מקור", options: { wch: 16 } },
      { name: "name", displayName: "שם טבלה", options: { wch: 52 } },
      { name: "display_name", displayName: "שם ידידותי לטבלה", options: { wch: 52 } },
      { name: "description", displayName: "תיאור טבלה", options: { wch: 72 } },
      ...(isContainsSap ? [{ name: "is_sap" as keyof Row, displayName: "אובייקט הרשאת SAP HR", options: { wch: 20 } }] : []),
    ]);

    return tablesExcelFile;
  }

  async getTablesPermissionKeysStatus(rawTableNames: string[]): Promise<Record<string, boolean>> {
    if (rawTableNames.length === 0) {
      throw new HttpException("No table names provided", HttpStatus.BAD_REQUEST);
    }

    const matchingTables = await this.tablesCollection
      .aggregate<Table>([{ $match: { $or: rawTableNames.map(parseRawTable).filter((table) => table !== null) } }])
      .toArray();

    return matchingTables.reduce(
      (acc, table) => ({ ...acc, [formatRawStandardTable(table)]: Object.keys(table.permission_keys).length > 0 }),
      {} as Record<string, boolean>,
    );
  }

  async getSapTables() {
    return await this.sapTablesModel.find({}, { schema_name: true, table_name: true });
  }

  private getFullTableName(schema_name: string, table_name: string) {
    return `${schema_name}.${table_name}`;
  }

  async refreshSapTables() {
    const currentTablesInMongo = await this.getSapTables();
    const currentTablesInMongoMap: Record<string, boolean> = {};
    currentTablesInMongo.forEach(({ schema_name, table_name }) => {
      currentTablesInMongoMap[this.getFullTableName(schema_name, table_name)] = true;
    });

    // BLACKEND - table name
    const query = `
    SELECT DISTINCT LOWER(dl_schema) AS schema_name, LOWER(dl_table) AS table_name
    FROM mock_sap_tables 
  `;
    const tablesInTrino = await this.trinoService.query<{ schema_name: string; table_name: string }>(query);
    const tablesInTrinoMap: Record<string, boolean> = {};
    tablesInTrino.forEach(({ schema_name, table_name }) => {
      tablesInTrinoMap[this.getFullTableName(schema_name, table_name)] = true;
    });

    const tablesToRemove = currentTablesInMongo
      .filter(({ table_name, schema_name }) => !tablesInTrinoMap[this.getFullTableName(schema_name, table_name)])
      .map(({ table_name, schema_name }) => ({ schema_name, table_name }));
    const tablesToAdd = tablesInTrino
      .filter(({ schema_name, table_name }) => !currentTablesInMongoMap[this.getFullTableName(schema_name, table_name)])
      .map(({ schema_name, table_name }) => ({ schema_name, table_name }));

    await Promise.all(
      [tablesToRemove.length && this.removeSapTables(tablesToRemove), tablesToAdd.length && this.addSapTables(tablesToAdd)].filter(
        (promise) => !!promise,
      ),
    );

    return { added: tablesToAdd.length, removed: tablesToRemove.length };
  }

  private async addSapTables(tables: Pick<SapTables, "schema_name" | "table_name">[]) {
    await this.sapTablesModel.create(tables);
  }

  private async removeSapTables(tables: Pick<SapTables, "schema_name" | "table_name">[]) {
    await this.sapTablesModel.deleteMany({ $or: tables });
  }

  private upsertSchemaToColumnsDict(
    upsertSchema: UpsertTable["schema"],
    overrideAttributes?: EditableColumnAttrs,
  ): MongooseTable["columns_dict"] {
    return upsertSchema.reduce<MongooseTable["columns_dict"]>(
      (acc, { column_name, data_type, column_display_name, column_desc, is_key }) => {
        return acc.set(column_name, {
          column_name: column_name,
          attributes: {
            data_type,
            column_display_name,
            column_desc: column_desc || "",
            is_key,
            ...(overrideAttributes || {}),
          },
        });
      },
      new Map(),
    );
  }

  private createInternalColumnDict(upsertSchema: UpsertTable["schema"]): MongooseTable["columns_dict"] {
    return this.upsertSchemaToColumnsDict(upsertSchema, { mask: DEFAULT_MASK, classification: new ObjectId(INTERNAL_RESOURCE_ID) });
  }

  private createDefaultColumnDict(upsertSchema: UpsertTable["schema"]): MongooseTable["columns_dict"] {
    return this.upsertSchemaToColumnsDict(upsertSchema, { mask: DEFAULT_MASK });
  }

  getMaskingTag(mask: MaskType): string | null {
    return mask === "none" ? null : "נתון מותמם";
  }

  getClassificationTag(classificationName: string) {
    return `סיווג: ${classificationName}`;
  }

  async generateColumnsTagDiff(
    prevColumnDict: Record<string, Column>,
    nextColumnDict: Record<string, Column>,
  ): Promise<ClassificationStateEvent["columns_tag_diff"]> {
    const classifications = await this.classificationsService.getClassificationsByIds(
      Array.from(
        Object.values(prevColumnDict)
          .concat(Object.values(nextColumnDict))
          .reduce(
            (acc, column) => (column.attributes.classification ? acc.add(column.attributes.classification.toString()) : acc),
            new Set<string>(),
          ),
      ).map((id) => new ObjectId(id)),
    );

    const classificationsByIds = classifications.reduce((acc, classification) => {
      return acc.set(classification._id.toString(), classification);
    }, new Map<string, Classification>());

    return Object.values(nextColumnDict).reduce<ClassificationStateEvent["columns_tag_diff"]>((acc, column) => {
      const diff: ClassificationStateEvent["columns_tag_diff"][string] = { add: [], remove: [] };

      const previousClassificationId = prevColumnDict[column.column_name]?.attributes.classification?.toString();
      const previousClassification = previousClassificationId ? classificationsByIds.get(previousClassificationId) : undefined;

      const previousMask = prevColumnDict[column.column_name]?.attributes.mask;

      const currentClassification = column.attributes.classification
        ? classificationsByIds.get(column.attributes.classification.toString())
        : undefined;

      const nextMask = column.attributes.mask;

      if (previousClassification !== currentClassification) {
        if (previousClassification) {
          diff.remove.push(this.getClassificationTag(previousClassification.name));
        }

        if (currentClassification) {
          diff.add.push(this.getClassificationTag(currentClassification.name));
        }
      }

      if (previousMask !== nextMask) {
        if (previousMask) {
          const tag = this.getMaskingTag(previousMask);

          if (tag) diff.remove.push(tag);
        }

        if (nextMask) {
          const tag = this.getMaskingTag(nextMask);

          if (tag) diff.add.push(tag);
        }
      }

      return { ...acc, [column.column_name]: diff };
    }, {});
  }

  async emitClassificationStateEvent(
    fullyQualifiedTableName: string,
    prevColumnDict: Record<string, Column>,
    nextColumnDict: Record<string, Column>,
  ) {
    try {
      const columnsTagDiff = await this.generateColumnsTagDiff(prevColumnDict, nextColumnDict);

      await this.kafkaService.sendMessage(
        "classification-state",
        {
          event_type: "classification_state",
          fully_qualified_table_name: fullyQualifiedTableName,
          classification_state: this.calcColumnsDictClassificationState(nextColumnDict),
          columns_tag_diff: columnsTagDiff,
        },
        KafkaProducerTopics.Lens,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async emitAdditionalTagEvent(fullyQualifiedTableName: string, tagName: string, tagValue: boolean) {
    try {
      await this.kafkaService.sendMessage(
        `${tagName}-tag-dataset`,
        {
          event_type: "special_tag_dataset",
          fully_qualified_table_name: fullyQualifiedTableName,
          tag_name: tagName,
          is_append: tagValue,
        },
        KafkaProducerTopics.Lens,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * @description This function accepts only external tables and runs authz validation on them
   * @important This Endpoint is used by customers
   */
  async upsertTablesCustomers(tables: UpsertExternalTablesDto, user: LoggedUser): Promise<UpsertTableResponseDto> {
    if (tables.length === 0) return [];
    const domain_ids = new Set<string>();
    const schema_names = new Set<string>();

    tables.forEach(({ domain_id, schema_name }) => {
      domain_ids.add(domain_id);
      schema_names.add(schema_name);
    });

    const fgaUser = formatFGAObjectId({ type: "user", id: user.userId });
    const checks = await this.openFgaService.batchCheck({
      checks: [
        ...Array.from(domain_ids).map(
          (domain_id) =>
            ({
              user: fgaUser,
              relation: FGADomainRelationConstants.can_update_datalake,
              object: formatFGAObjectId({ type: "domain", id: domain_id }),
            }) satisfies ClientBatchCheckItem,
        ),
        ...Array.from(schema_names).map(
          (schema_name) =>
            ({
              user: fgaUser,
              relation: FGASchemaRelationConstants.can_write,
              object: formatFGAObjectId({ type: "schema", id: schema_name }),
            }) satisfies ClientBatchCheckItem,
        ),
      ],
    });
    checks.result.forEach((res) => {
      if (!res.allowed) {
        throw new ForbiddenException(`You do not have the necessary permissions to update the datalake (${res.request.object}).`);
      }
    });
    return this.upsertTables(tables.map((table) => ({ ...table, owner: { id: user.userId, name: user.displayName } })));
  }

  /** @important This Endpoint is used by customers */
  async upsertTables(tables: UpsertTableWithOwner[]): Promise<UpsertTableResponseDto> {
    if (tables.length === 0) return [];
    const [tableRecords, domainsById, permissionTablesById, keycloakOwners] = await Promise.all([
      this.tableModel.find({
        $or: tables.map(({ table_name, schema_name }) => ({ catalog_name: process.env.TRINO_CATALOG, schema_name, table_name })),
      }),
      this.domainsService
        .getByIds(tables.map(({ domain_id }) => new ObjectId(domain_id)))
        .then((domainRecords) =>
          domainRecords.reduce((acc, domain) => ({ ...acc, [domain.id]: domain }), {} as Record<string, (typeof domainRecords)[number]>),
        ),
      this.permissionTableService
        .getPermissionTablesByIds(
          tables.reduce<ObjectId[]>((acc, { permission_table_id }) => {
            if (permission_table_id) acc.push(new ObjectId(permission_table_id));
            return acc;
          }, []),
          { throwIfNotAllFound: false },
        )
        .then((permissionTables) =>
          permissionTables.reduce(
            (acc, table) => ({ ...acc, [table._id.toString()]: table }),
            {} as Record<string, (typeof permissionTables)[number]>,
          ),
        ),
      await Promise.all(
        Array.from(
          new Set([
            ...tables.flatMap((table) => [
              ...("co_owners" in table ? table.co_owners.map(({ id }) => id) : []),
              ...("owner" in table ? [table.owner.id] : []),
            ]),
          ]),
        ).map((userId) => this.keycloakAdmin.getUserByUsername(userId)),
      ),
    ]);

    const keycloakOwnersByUserId = keycloakOwners.reduce(
      (acc, user) => (user ? { ...acc, [user.userId]: user } : acc),
      {} as Record<UserID, GetUserInfoDto>,
    );

    const tablesByName = tableRecords.reduce(
      (acc, table) => ({ ...acc, [formatRawStandardTable(table)]: table }),
      {} as Record<string, (typeof tableRecords)[number]>,
    );

    // all matching by indexes
    const tablesMetadata: {
      table: Document<mongoose.Types.ObjectId, object, MongooseTable> & MongooseTable;
      prevTable: (Document<unknown, object, MongooseTable> & MongooseTable) | null;
      taskOperation: TaskOperationKind | null;
      upsertTableData: UpsertTableWithOwner;
    }[] = [];

    const response: UpsertTableResponseDto = [];

    const existingTasks = await this.taskModel.find({ tableId: { $in: tableRecords.map(({ _id }) => _id) } }).exec();

    for (const upsertTableData of tables) {
      const {
        schema_name,
        table_name,
        table_desc,
        table_display_name,
        permission_key,
        permission_key_column,
        permission_table_id,
        domain_id,
        is_internal,
        schema,
        ...extraTableData
      } = upsertTableData;
      const tableName = formatRawStandardTable({ table_name, schema_name });

      const domain = domainsById[domain_id];
      if (!domain) {
        response.push({
          table_name,
          schema_name,
          status: "error",
          error_message: `Domain with id ${domain_id} not found when upserting table ${tableName}`,
        });
        continue;
      }

      if (permission_table_id) {
        if (!permissionTablesById[permission_table_id]) {
          response.push({
            table_name,
            schema_name,
            status: "error",
            error_message: `Permission table with id ${permission_table_id} not found when upserting table ${tableName}`,
          });
          continue;
        } else if (!permissionTablesById[permission_table_id].permission_keys.some((rf) => rf.name === permission_key)) {
          response.push({
            table_name,
            schema_name,
            status: "error",
            error_message: `Permission key ${permission_key} not found in permission table ${permission_table_id} when upserting table ${tableName}`,
          });
          continue;
        }
      }

      const tableRecord = tablesByName[tableName];
      const prevTable = tableRecord ? new this.tableModel(tableRecord.toObject()) : null;

      const updatedMetadata = {
        application: extraTableData.application,
        owner: extraTableData.owner.id,
        table_desc,
        table_display_name,
        source_type: extraTableData.application === "connect" ? extraTableData.source_type : extraTableData.application,
        connection: extraTableData.application === "connect" ? extraTableData.connection : undefined,
        permission_table: permission_table_id ? new ObjectId(permission_table_id) : undefined,
        permission_keys:
          permission_table_id && permission_key && permission_key_column ? new Map([[permission_key, permission_key_column]]) : new Map(),
        attributes: {
          domain_id: new ObjectId(domain_id),
          domain: domain.name,
          display_name: domain.display_name,
        },
        schedule_type: extraTableData.application === "connect" ? "cron" : extraTableData.schedule_type,
        schedule: extraTableData.application === "connect" || extraTableData.schedule_type === "cron" ? extraTableData.schedule : undefined,
        ...("process_type" in extraTableData ? { process_type: extraTableData.process_type } : {}),
        ...("co_owners" in extraTableData ? { co_owners: extraTableData.co_owners } : {}),
        ...(extraTableData.application === "remix" || extraTableData.application === "external"
          ? {
              query: extraTableData.query,
              updating_dependencies: extraTableData.updating_dependencies ?? [],
            }
          : {}),
        is_deprecated: false,
      } satisfies Partial<MongooseTable>;

      if (!tableRecord) {
        tablesMetadata.push({
          prevTable,
          taskOperation: is_internal ? null : "create-by-table",
          table: new this.tableModel({
            catalog_name: process.env.TRINO_CATALOG,
            schema_name,
            table_name,
            ...updatedMetadata,
            columns_dict: is_internal ? this.createInternalColumnDict(schema) : this.createDefaultColumnDict(schema),
          }),
          upsertTableData,
        });
      } else {
        const previousDomainId = tableRecord.attributes.domain_id.toString();

        tableRecord.set(updatedMetadata);

        if (is_internal) {
          tableRecord.set("columns_dict", this.createInternalColumnDict(schema));
          tablesMetadata.push({ prevTable, taskOperation: "delete-by-table", table: tableRecord, upsertTableData });
        } else {
          let didAddColumn = false;
          const wasInternal = Array.from(tableRecord.columns_dict.values()).some(
            (col) => col.attributes.classification?.toString() === INTERNAL_RESOURCE_ID,
          );

          const didChangeDomain = domain_id !== previousDomainId;
          const wasTaskDeleted = !existingTasks.find(({ tableId }) => tableId.equals(tableRecord._id));

          const nextColumnDict =
            wasInternal || didChangeDomain
              ? this.createDefaultColumnDict(schema)
              : schema.reduce<MongooseTable["columns_dict"]>(
                  (acc, { column_name, data_type, column_display_name, column_desc, is_key }) => {
                    const previousColumn = tableRecord.columns_dict.get(column_name);

                    const baseAttr = {
                      data_type,
                      column_display_name,
                      column_desc: column_desc ?? "",
                      is_key,
                    };

                    if (previousColumn) {
                      acc.set(column_name, {
                        column_name: previousColumn.column_name,
                        attributes: {
                          ...baseAttr,
                          classification: previousColumn.attributes.classification,
                          mask: previousColumn.attributes.mask,
                        },
                      });
                    } else {
                      didAddColumn = true;
                      acc.set(column_name, { column_name, attributes: { ...baseAttr, mask: DEFAULT_MASK } });
                    }

                    return acc;
                  },
                  new Map(),
                );
          const classificationState = this.calcColumnsDictClassificationState(Object.fromEntries(nextColumnDict.entries()));

          tableRecord.set("columns_dict", nextColumnDict);
          tablesMetadata.push({
            prevTable,
            taskOperation: this.getTaskOperation(wasInternal, didAddColumn, didChangeDomain, wasTaskDeleted, classificationState),
            table: tableRecord,
            upsertTableData,
          });
        }
      }
    }

    const tableResults = await this.tableModel.bulkSave(tablesMetadata.map(({ table }) => table));
    const tasksToWrite: AnyBulkWriteOperation<Document<mongoose.Types.ObjectId, object, MongooseTask>>[] = [];

    const insertAuditData = tablesMetadata.reduce<InsertTableAudit[]>((acc, { table, prevTable }, index) => {
      const tableDiff = getTablesDiff({ currTable: prevTable, newTable: table });

      if (tableDiff.length > 0) {
        const table_id: ObjectId = tableResults.insertedIds[index] || tableResults.upsertedIds[index] || table._id;

        if (table_id) {
          const isNew = !!tableResults.insertedIds[index];
          acc.push({
            table_id,
            tableDiff,
            user_id: table.owner as UserID, // owner comes from the params which are validated
            operation: isNew ? OP.Create : OP.Update,
          });
        } else {
          this.logger.warn(new Error(`Failed to find generated _id of table ${formatRawStandardTable(table)}`));
        }
      }

      return acc;
    }, []);

    this.auditingService.insertTableAudits(...insertAuditData);

    tablesMetadata.forEach(({ table, taskOperation, prevTable, upsertTableData }, index) => {
      const fullyQualifiedTableName = formatRawStandardTable(table);
      const writeError = tableResults.getWriteErrorAt(index);

      if (writeError) {
        this.logger.error(`Failed to save table ${fullyQualifiedTableName}: ${writeError}`);
        response.push({
          table_name: upsertTableData.table_name,
          schema_name: upsertTableData.schema_name,
          status: "error",
          error_message: `Failed to save table ${fullyQualifiedTableName}`,
        });
      } else {
        const tableId: ObjectId = tableResults.insertedIds[index] || tableResults.upsertedIds[index] || table._id;

        try {
          this.kafkaService
            .sendMessage(
              "upsert-dataset",
              upsertTableToSpyglassEvent({
                ...upsertTableData,
                // checked the existence of the domain in the beginning of the function, so we can assert it exists here
                domain_display_name: domainsById[upsertTableData.domain_id]!.display_name,
                owner: {
                  id: keycloakOwnersByUserId[upsertTableData.owner.id]?.preferred_username ?? upsertTableData.owner.id,
                  name: upsertTableData.owner.name,
                },
                co_owners:
                  "co_owners" in upsertTableData
                    ? upsertTableData.co_owners.map(({ id, name }) => ({ name, id: keycloakOwnersByUserId[id]?.preferred_username ?? id }))
                    : [],
              }),
            )
            .then(async () => {
              // NOTE - Ensure that the classification event runs after the dataset has been written to lens
              await new Promise((resolve) => setTimeout(resolve, 1000));
              await this.emitClassificationStateEvent(
                fullyQualifiedTableName,
                prevTable ? Object.fromEntries(prevTable.columns_dict.entries()) : {},
                Object.fromEntries(table.columns_dict.entries()),
              );

              if (table.schema_name === TEST_SCHEMA_NAME || table.connection?.is_test) {
                await this.emitAdditionalTagEvent(fullyQualifiedTableName, "test", true);
              }
            });
        } catch (error) {
          this.logger.warn(`Failed to send message to Kafka for table ${fullyQualifiedTableName}: ${error}`);
        }

        if (taskOperation) {
          if (!tableId) {
            this.logger.warn(`Couldn't perform ${taskOperation} for table ${fullyQualifiedTableName} as no id was returned`);
          } else {
            tasksToWrite.push(
              this.tasksService.getTaskDbOperation({
                kind: taskOperation,
                tableId,
              }),
            );
          }
        }

        response.push({ table_name: upsertTableData.table_name, schema_name: upsertTableData.schema_name, status: "success" });
      }
    });

    const taskResults = await this.taskModel.bulkWrite(tasksToWrite);

    taskResults.getWriteErrors?.().forEach((writeError) => {
      this.logger.error(
        `Failed to make the next task operation: ${JSON.stringify(writeError.getOperation())} with error: ${writeError?.errmsg}\n${writeError?.errInfo}`,
      );
    });

    // Add Unlogged tables to response as error to return data for all sent tables
    if (response.length !== tables.length) {
      const missedTables = tables.filter(
        (table) => !response.some((res) => res.table_name === table.table_name && res.schema_name === table.schema_name),
      );
      response.push(
        ...missedTables.map<(typeof response)[number]>((table) => ({
          table_name: table.table_name,
          schema_name: table.schema_name,
          status: "error",
          error_message: "An unknown error occoured.",
        })),
      );
    }

    this.logger.log(`UpsertTables: ${response}`);

    return response;
  }

  async deprecateTables(
    standardTables: DeprecateTablesDto,
    user: { user_type: "customer"; user_id: UserID } | { user_type: "internal" },
  ): Promise<string[]> {
    if (standardTables.length === 0) return [];

    const tableDocs = await this.tableModel.find({ $or: standardTables }, { table_name: 1, schema_name: 1, attributes: 1 });

    if (!tableDocs.length) throw new NotFoundException("No tables found");

    if (user.user_type === "customer") {
      const domainIds = new Set(tableDocs.map(({ attributes: { domain_id } }) => domain_id.toString()));
      const schema_names = new Set(standardTables.map(({ schema_name }) => schema_name));

      const checks = await this.openFgaService.batchCheck({
        checks: [
          ...[...domainIds].map<ClientBatchCheckItem & FGATupleKey>((domainId) => ({
            user: formatFGAObjectId({ type: "user", id: user.user_id }),
            relation: "can_update_datalake",
            object: formatFGAObjectId({ type: "domain", id: domainId }),
          })),
          ...[...schema_names].map<ClientBatchCheckItem & FGATupleKey>((schema_name) => ({
            user: formatFGAObjectId({ type: "user", id: user.user_id }),
            relation: "can_write",
            object: formatFGAObjectId({ type: "schema", id: schema_name }),
          })),
        ],
      });
      checks.result.forEach((res) => {
        if (!res.allowed) {
          throw new ForbiddenException(`You do not have the necessary permissions to update the datalake (${res.request.object}).`);
        }
      });
    }

    const tableIds = tableDocs.map(({ _id }) => _id);

    const updateTables = await this.tableModel.updateMany({ _id: { $in: tableIds } }, { $set: { is_deprecated: true } });
    if (updateTables.matchedCount !== tableDocs.length) {
      this.logger.warn(`Failed to deprecate ${standardTables.length - updateTables.matchedCount} tables`);
    }
    try {
      const deleteTasks = await this.taskModel.deleteMany({ tableId: { $in: tableIds } });
      if (deleteTasks.deletedCount) {
        this.logger.log(`Successfully deleted ${deleteTasks.deletedCount} tasks for ${tableIds.length} tables`);
      }
    } catch (error) {
      this.tableModel.updateMany({ _id: { $in: tableIds } }, { $set: { is_deprecated: false } });
      this.logger.error(`Failed to delete tasks for ${tableIds.length} tables %O`, error);
      return [];
    }

    const deprecatedTables = tableDocs.map(formatRawStandardTable);
    deprecatedTables.map((fully_qualified_table_name) =>
      this.kafkaService.sendMessage("deprecate_dataset", { event_type: "delete_dataset", fully_qualified_table_name }).catch((error) => {
        this.logger.warn(`Error sending Deprecation Spyglass Event for ${fully_qualified_table_name}:`, error);
      }),
    );
    this.logger.log(`Deprecated: ${deprecatedTables}`);
    return deprecatedTables;
  }

  private getTaskOperation(
    wasInternal: boolean,
    didAddColumn: boolean,
    didChangeDomain: boolean,
    wasTaskDeleted: boolean,
    classificationState: ClassificationState,
  ) {
    if (wasInternal || (wasTaskDeleted && classificationState !== ClassificationState.CLASSIFIED)) {
      return "create-by-table";
    } else if (didAddColumn || didChangeDomain) {
      return "update-by-table";
    } else {
      return null;
    }
  }
}

import { Controller, Inject, Logger, Post, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ApiTags } from "@nestjs/swagger";
import { PermissionTable, Table, Task } from "@port/shield-models";
import { chunk } from "lodash";
import { Db, ObjectId, WithId } from "mongodb";
import { Model } from "mongoose";
import { TableService } from "src/tables/table.service";
import { DB_CONNECTION_PROVIDER, INTERNAL_RESOURCE_ID } from "src/utils/constants";
import { AdminGuard } from "src/utils/guards/admin.guard";
import { formatRawStandardTable } from "src/utils/utils";
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Controller("migrations")
@ApiTags("Migrations")
class MigrationsController {
  private readonly logger = new Logger(MigrationsController.name);
  constructor(
    private readonly tableService: TableService,
    @InjectModel(Table.name) private readonly tableModel: Model<Table>,
    @InjectModel(PermissionTable.name) private readonly permissionTableModel: Model<PermissionTable>,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @Inject(DB_CONNECTION_PROVIDER)
    private readonly db: Db,
  ) {}

  @UseGuards(AdminGuard)
  @Post("backfill-column-classification-tags")
  async backfillColumnClassificationTags() {
    const tables = await this.tableModel.find().exec();
    const chunks = chunk(tables, 100);

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((table) =>
          this.tableService.emitClassificationStateEvent(
            formatRawStandardTable(table),
            {},
            Object.fromEntries(table.toObject().columns_dict.entries()),
          ),
        ),
      );

      await sleep(333);
    }

    this.logger.log("Backfilled column classification tags successfully");
  }

  @UseGuards(AdminGuard)
  @Post("add-permission-key-to-permission-table")
  async addPermissionKeyToPermissionTable() {
    await this.permissionTableModel.aggregate([
      {
        $lookup: {
          from: "domains",
          localField: "_id",
          foreignField: "permission_table_id",
          as: "domains",
        },
      },
      // convert array of permission keys map to an array of permission keys
      {
        $set: {
          domains: {
            $map: {
              input: "$domains",
              as: "domain",
              in: {
                $objectToArray: "$$domain.permission_keys",
              },
            },
          },
        },
      },
      // flatten permission keys into a single array
      {
        $addFields: {
          permission_keys: {
            $reduce: {
              input: "$domains",
              initialValue: [],
              in: {
                $concatArrays: ["$$value", "$$this"],
              },
            },
          },
        },
      },
      // remove duplicates from permission keys
      {
        $set: {
          permission_keys: {
            $reduce: {
              input: "$permission_keys",
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $cond: [
                      {
                        $in: ["$$this.k", "$$value.k"],
                      },
                      [],
                      ["$$this"],
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      // give proper names to permission keys fields
      {
        $set: {
          permission_keys: {
            $map: {
              input: "$permission_keys",
              as: "permission_key",
              in: {
                name: "$$permission_key.k",
                trino_type: "$$permission_key.v",
              },
            },
          },
        },
      },
      // remove leftover feilds
      {
        $unset: "domains",
      },
      { $merge: { into: "permission_tables", whenNotMatched: "discard" } },
    ]);
  }

  @UseGuards(AdminGuard)
  @Post("delete-internal-table-tasks")
  async deleteInternalTableTasks() {
    const taskIds = await this.taskModel.aggregate<WithId<object>>([
      {
        $lookup: {
          from: "tables",
          localField: "tableId",
          foreignField: "_id",
          as: "tables",
        },
      },
      {
        $set: {
          columns: {
            $reduce: {
              input: "$tables",
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $objectToArray: "$$this.columns_dict",
                  },
                ],
              },
            },
          },
        },
      },
      {
        $match: {
          "columns.v.attributes.classification": new ObjectId(INTERNAL_RESOURCE_ID),
        },
      },
      {
        $project: {
          _id: true,
        },
      },
    ]);

    const deleteResult = await this.taskModel.deleteMany({ _id: { $in: taskIds.map(({ _id }) => _id) } });
    const deleteCount = deleteResult.acknowledged ? deleteResult.deletedCount : 0;

    return `Deleted ${deleteCount} of ${taskIds.length} tasks for internal tables.`;
  }

  @UseGuards(AdminGuard)
  @Post("/migration-shield-openfga")
  async migrationShieldOpenfga(): Promise<unknown> {
    const result = await Promise.all([
      this.db.collection("roles").updateMany({}, { $unset: { assignable_roles: 1, has_all_domains: 1, draft_approver_type: 1 } }),
      this.db.collection("roles").updateOne({ name: "mercaz" }, { $set: { name: "support_center" } }),
      this.db.collection("roles").updateOne({ name: "admin" }, { $set: { name: "rav_amlach", display_name: 'רב אמל"ח' } }),
      this.db.collection("roles").updateOne({ name: "system" }, { $set: { name: "admin", display_name: "אדמין" } }),
      this.db.collection("roles").updateOne({ name: "api" }, { $set: { name: "api_user", display_name: "API USER" } }),
      this.db.collection("roles").deleteOne({ name: "inspector" }),
    ]);

    return result;
  }

  @UseGuards(AdminGuard)
  @Post("lowercase-table-data")
  async lowerCaseTableData() {
    /**
     * MongoDB aggregation pipeline that:
     *   1. lower‑cases `schema_name` & `table_name`
     *   2. converts `columns_dict` (a BSON object) → array → lower‑case keys →
     *      lower‑case `column_name` inside each value → back to object.
     */
    const pipeline = [
      // lower‑case top‑level fields
      {
        $set: {
          schema_name: { $toLower: "$schema_name" },
          table_name: { $toLower: "$table_name" },
        },
      },

      {
        $set: {
          columns_dict: {
            $arrayToObject: {
              $map: {
                input: { $objectToArray: "$columns_dict" },
                as: "kv",
                in: {
                  // lower‑case the map key
                  k: { $toLower: "$$kv.k" },

                  // lower‑case column_name inside the column value,
                  // while keeping every other field untouched
                  v: {
                    $mergeObjects: [
                      "$$kv.v",
                      {
                        column_name: {
                          $toLower: "$$kv.v.column_name",
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    ];

    // The aggregation is executed as an updateMany with the pipeline.
    return await this.tableModel.updateMany({}, pipeline).exec();
  }
}
export default MigrationsController;

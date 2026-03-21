import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FGADomainRelationConstants, formatFGAObjectId } from "@port/openfga-client";
import { Task as MongooseTask, OP, Resource } from "@port/shield-models";
import { stringify } from "@port/utils";
import { Collection, Db, ObjectId } from "mongodb";
import mongoose, { AnyBulkWriteOperation, Document, Model } from "mongoose";
import AuditingService from "src/auditing/auditing.service";
import { AUDITING_UNKNOWN } from "src/auditing/auditing.types";
import { LoggedUser } from "src/auth/auth.interface";
import { DomainsService } from "src/domains/domains.service";
import { OpenFgaService } from "src/openfga/openfga.service";
import { DB_CONNECTION_PROVIDER } from "src/utils/constants";
import { customDiff } from "src/utils/utils";
import { ActiveTaskDto } from "./tasks.dto";
import { Task, TaskAction, TaskWithTable } from "./tasks.interface";

export const TABLE_CLASSIFICATION_TASK_TYPE = "TableClassification";

const GET_TASKS_DATA_PIPLINE = [
  {
    $lookup: {
      from: "tables",
      localField: "tableId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            _id: true,
            table_name: true,
            table_display_name: true,
            attributes: true,
            owner: true,
            source_type: true,
          },
        },
      ],
      as: "tableData",
    },
  },
  { $unwind: "$tableData" },
];

@Injectable()
export class TasksService {
  /**@deprecated */
  private readonly tasksCollection: Collection<Task>;
  constructor(
    /**@deprecated */
    @Inject(DB_CONNECTION_PROVIDER) private readonly db: Db,
    private readonly auditingService: AuditingService,
    private readonly domainsService: DomainsService,
    private readonly openFgaService: OpenFgaService,
    @InjectModel(MongooseTask.name) private readonly taskModel: Model<MongooseTask>,
  ) {
    this.tasksCollection = db.collection<Task>("tasks");
  }

  async getActiveTasks({ userId }: LoggedUser): Promise<ActiveTaskDto[]> {
    const domainIds = await this.openFgaService.getUserDomainIdsByRelation(userId, FGADomainRelationConstants.can_classify_tables);
    if (domainIds.length === 0) return [];

    const pipeline = [
      ...GET_TASKS_DATA_PIPLINE,
      {
        $match: {
          "tableData.attributes.domain_id": { $in: domainIds },
          done: false,
        },
      },
      { $project: { done: false } },
    ];

    const tasks = await this.tasksCollection.aggregate<ActiveTaskDto>(pipeline).toArray();

    return tasks;
  }

  /**
   * @audits
   */
  async markTaskAsDone(id: ObjectId, loggedUser: LoggedUser): Promise<void> {
    try {
      const tasks = await this.db
        .collection<Task>("tasks")
        .aggregate<TaskWithTable>([{ $match: { _id: id } }, ...GET_TASKS_DATA_PIPLINE])
        .toArray();

      const task = tasks[0];

      if (!task) {
        throw new NotFoundException(`Could find task with id ${id}`);
      }

      const taskDomainId = task.tableData.attributes.domain_id;

      const { allowed } = await this.openFgaService.check({
        user: formatFGAObjectId({ type: "user", id: loggedUser.userId }),
        relation: FGADomainRelationConstants.can_classify_tables,
        object: formatFGAObjectId({ type: "domain", id: taskDomainId.toString() }),
      });

      if (!allowed) {
        throw new ForbiddenException(`No permissions found for domain with id ${taskDomainId}`);
      }

      const updateTaskData = {
        done: true,
        approval_id: loggedUser.userId,
        approval_date: new Date(),
      };
      await this.tasksCollection.updateOne(
        { _id: id },
        {
          $set: updateTaskData,
        },
      );

      this.auditingService.insertLegacyAudit({
        user_id: loggedUser.userId,
        operation: OP.Update,
        resource: Resource.Task,
        status: "success",
        resource_info: {
          id: id.toString(),
          name: task.tableData.table_name,
        },
        message: "Updated Task",
        difference: customDiff(
          { done: task.done, approval_id: task.approval_id, approval_date: task.approval_date },
          updateTaskData,
          false,
        ),
      });
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: loggedUser.userId,
        operation: OP.Update,
        resource: Resource.Task,
        status: "error",
        resource_info: {
          id: id.toString(),
          name: AUDITING_UNKNOWN,
        },
        message: stringify(error),
        response_error_message: AUDITING_UNKNOWN,
      });

      throw error;
    }
  }

  getTaskDbOperation(taskAction: TaskAction): AnyBulkWriteOperation<Document<mongoose.Types.ObjectId, object, MongooseTask>> {
    switch (taskAction.kind) {
      case "update-by-table": {
        const { tableId } = taskAction;

        return { updateOne: { filter: { tableId }, update: { done: false, modify_date: new Date() } } };
      }
      case "delete-by-table": {
        const { tableId } = taskAction;

        return { deleteOne: { filter: { tableId } } };
      }
      case "create-by-table": {
        const { tableId } = taskAction;

        return {
          insertOne: {
            document: new this.taskModel({
              tableId,
              done: false,
              type: TABLE_CLASSIFICATION_TASK_TYPE,
              create_date: new Date(),
              modify_date: new Date(),
            }),
          },
        };
      }
    }
  }
}

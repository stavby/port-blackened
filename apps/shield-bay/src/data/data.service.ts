import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  ApplicationUser,
  applicationUserIndicationDiffKind,
  Auditing,
  AuditLog,
  Classification,
  Domain,
  PermissionTable,
  Resource,
  Role,
  Table,
  Task,
  User,
} from "@port/shield-models";
import { Model, PipelineStage } from "mongoose";
import { AuditLogDto, auditLogDtoSchema } from "src/dtos/audit_logs.dto";
import { TableClassificationActionDto, tableClassificationActionDtoSchema } from "src/dtos/table_classification_actions.dto";
import { TableMaskActionDto, tableMaskActionDtoSchema } from "src/dtos/table_mask_actions.dto";
import { UserClassificationActionsDto, userClassificationsActionDtoSchema } from "src/dtos/user_classification_actions.dto";
import { UserRowFilterValueActionDto, userRowFilterValueActionDtoSchema } from "src/dtos/user_row_filter_value_actions.dto";
import { ClassificationDto, classificationDtoSchema } from "../dtos/classifications.dto";
import { DomainDto, domainDtoSchema } from "../dtos/domains.dto";
import { PermissionTableDto, permissionTableDtoSchema } from "../dtos/permission_tables.dto";
import { RowFilterDto, rowFilterDtoSchema } from "../dtos/row_filters.dto";
import { indicationTypes, UserIndicationActionDto, userIndicationActionDtoSchema } from "../dtos/user_indication_actions.dto";

import { PaginationResponseDto } from "./pagination.utils";

import { AppUserBooleanAttributeActionDto, appUserBooleanAttributeActionSchema } from "src/dtos/app_user_boolean_attribute_actions";
import { AppUserClassificationActionDto, appUserClassificationActionDtoSchema } from "src/dtos/app_user_classification_actions.dto";
import { AppUserClassificationDto, appUserClassificationDtoSchema } from "src/dtos/app_user_classifications.dto";
import { AppUserRoleActionDto, appUserRoleActionDtoSchema } from "src/dtos/app_user_role_actions.dto";
import { AppUserRoleDto, appUserRoleDtoSchema } from "src/dtos/app_user_roles.dto";
import { AppUserDto, appUserDtoSchema } from "src/dtos/app_users.dto";
import { AuditingLegacyDto, auditingLegacyDtoSchema } from "src/dtos/auditing_legacy.dto";
import { ColumnDto, columnDtoSchema } from "src/dtos/columns.dto";
import { DomainClassificationDto, domainClassificationDtoSchema } from "src/dtos/domain_classifications.dto";
import { TableTaskDto, tableTaskDtoSchema } from "src/dtos/table_tasks.dto";
import { TableDto, tableDtoSchema } from "src/dtos/tables.dto";
import { UserClassificationDto, userClassificationDtoSchema } from "src/dtos/user_classifications.dto";
import { UserIndicationDto, userIndicationDtoSchema } from "src/dtos/user_indications.dto";
import { UserRowFilterDto, userRowFilterDtoSchema } from "src/dtos/user_row_filter.dto";
import { UserUniqueIndicationActionDto, userUniqueIndicationActionDtoSchema } from "src/dtos/user_unique_indication_actions.dto";
import { UserUniqueIndicationDto, userUniqueIndicationsDtoSchema } from "src/dtos/user_unique_indications.dto";
import { UserDto, userDtoSchema } from "src/dtos/users.dto";
import { RoleDto, roleDtoSchema } from "src/dtos/roles.dto";

type MongoPaginationQueryResult<D = unknown> = {
  items: D[];
  metadata: { totalCount: number }[];
};

@Injectable()
export class DataService {
  constructor(
    @InjectModel(Classification.name)
    private readonly classificationModel: Model<Classification>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(ApplicationUser.name) private readonly appUserModel: Model<ApplicationUser>,
    @InjectModel(Table.name) private readonly tableModel: Model<Table>,
    @InjectModel(Domain.name) private readonly domainModel: Model<Domain>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(PermissionTable.name)
    private readonly permissionTableModel: Model<PermissionTable>,
    @InjectModel(Task.name) private readonly tableTaskModel: Model<Task>,
    @InjectModel(Auditing.name) private readonly auditingModel: Model<Auditing>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
  ) {}

  private generatePaginationAggregation(limit: number, skip: number, sortByField: string = "_id"): PipelineStage[] {
    return [
      {
        $sort: {
          [sortByField]: 1,
        },
      },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: limit }],
          metadata: [{ $count: "totalCount" }],
        },
      },
    ];
  }

  async getUsers(page: number, size: number): Promise<PaginationResponseDto<UserDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $lookup: {
          from: "sap_permitted_users",
          localField: "user_id",
          foreignField: "user_id",
          as: "sap_permitted_users",
        },
      },
      {
        $addFields: {
          sap_permissions: {
            $cond: [{ $gt: [{ $size: "$sap_permitted_users" }, 0] }, true, false],
          },
        },
      },
      {
        $addFields: {
          type: "$attributes.type",
        },
      },
      {
        $project: {
          attributes: 0,
        },
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];

    const result = await this.userModel.aggregate<MongoPaginationQueryResult<User>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: userDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getAuditingLegacy(page: number, size: number): Promise<PaginationResponseDto<AuditingLegacyDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $sort: {
          _id: 1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ] as const satisfies PipelineStage[];

    const result = await Promise.all([
      this.auditingModel.aggregate<MongoPaginationQueryResult<Auditing>>(aggregation),
      this.auditingModel.countDocuments(),
    ]);

    const [items, totalCount] = result;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: auditingLegacyDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getTables(page: number, size: number): Promise<PaginationResponseDto<TableDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $addFields: {
          domain_id: "$attributes.domain_id",
        },
      },
      {
        $project: {
          attributes: 0,
        },
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];

    const result = await this.tableModel.aggregate<MongoPaginationQueryResult<Table>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: tableDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getTableTasks(page: number, size: number): Promise<PaginationResponseDto<TableTaskDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      { $match: { type: "TableClassification" } },
      {
        $project: {
          _id: 1,
          done: 1,
          table_id: "$tableId",
          create_date: 1,
          modify_date: 1,
          __v: 1,
          approval_date: 1,
          approval_id: 1,
        },
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];

    const result = await this.tableTaskModel.aggregate<MongoPaginationQueryResult<Task>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: tableTaskDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getColumns(page: number, size: number): Promise<PaginationResponseDto<ColumnDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $project: {
          table_id: "$_id",
          columns: {
            $map: {
              input: { $objectToArray: "$columns_dict" },
              as: "col",
              in: {
                table_id: "$_id",
                permission_key: {
                  $let: {
                    vars: {
                      permissionKeysArray: {
                        $objectToArray: "$permission_keys",
                      },
                    },
                    in: {
                      $cond: [
                        { $in: ["$$col.k", "$$permissionKeysArray.k"] },
                        {
                          $arrayElemAt: [
                            {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$$permissionKeysArray",
                                    as: "pk",
                                    cond: { $eq: ["$$pk.k", "$$col.k"] },
                                  },
                                },
                                as: "item",
                                in: "$$item.v",
                              },
                            },
                            0,
                          ],
                        },
                        null,
                      ],
                    },
                  },
                },
                data_type: "$$col.v.attributes.data_type",
                column_name: "$$col.k",
                column_display_name: "$$col.v.attributes.column_display_name",
                column_desc: "$$col.v.attributes.column_desc",
                classification: "$$col.v.attributes.classification",
                mask: "$$col.v.attributes.mask",
              },
            },
          },
        },
      },
      { $unwind: "$columns" },
      { $replaceRoot: { newRoot: "$columns" } },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];

    const result = await this.tableModel.aggregate<MongoPaginationQueryResult<ColumnDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: columnDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getClassifications(page: number, size: number): Promise<PaginationResponseDto<ClassificationDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = this.generatePaginationAggregation(limit, skip);
    const result = await this.classificationModel.aggregate<MongoPaginationQueryResult<Classification>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: classificationDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getDomains(page: number, size: number): Promise<PaginationResponseDto<DomainDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = this.generatePaginationAggregation(limit, skip);
    const result = await this.domainModel.aggregate<MongoPaginationQueryResult<Domain>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: domainDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getRoles(page: number, size: number): Promise<PaginationResponseDto<RoleDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $project: {
          _id: true,
          name: true,
          display_name: true,
        } satisfies Record<keyof RoleDto, true>,
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];
    const result = await this.roleModel.aggregate<MongoPaginationQueryResult<RoleDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: roleDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getPermissionTables(page: number, size: number): Promise<PaginationResponseDto<PermissionTableDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $project: {
          _id: true,
          name: true,
          display_name: true,
        } satisfies Record<keyof PermissionTableDto, true>,
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];
    const result = await this.permissionTableModel.aggregate<MongoPaginationQueryResult<PermissionTable>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: permissionTableDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getRowFilters(page: number, size: number): Promise<PaginationResponseDto<RowFilterDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      { $unwind: "$row_filters" },
      {
        $project: {
          kod: "$row_filters.kod",
          display_name: "$row_filters.display_name",
          dimensions_table: "$row_filters.dimensions_table",
          permission_table_id: "$_id",
        },
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];

    const result = await this.permissionTableModel.aggregate<MongoPaginationQueryResult<RowFilterDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: rowFilterDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getAuditLogs(page: number, size: number): Promise<PaginationResponseDto<AuditLogDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $match: { version: 1 },
      },
      {
        $project: {
          _id: true,
          user_id: true,
          time: true,
        },
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];

    const result = await this.auditLogModel.aggregate<MongoPaginationQueryResult<AuditLogDto>>(aggregation).exec();

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: auditLogDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getUserUniqueIndications(page: number, size: number): Promise<PaginationResponseDto<UserUniqueIndicationDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const pipeline = [
      {
        $project: {
          user_id: 1,
          indication: "$attributes.unique_population",
        },
      },
      {
        $unwind: {
          path: "$indication",
        },
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];

    const result = await this.userModel.aggregate<MongoPaginationQueryResult<UserUniqueIndicationDto>>(pipeline);

    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: userUniqueIndicationsDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getUserIndications(page: number, size: number): Promise<PaginationResponseDto<UserIndicationDto>> {
    const limit = size;
    const skip = (page - 1) * size;
    const pipeline = [
      {
        $project: {
          user_id: 1,
          attributes: 1,
        },
      },
      {
        $addFields: {
          indicationData: {
            $map: {
              input: {
                $filter: {
                  input: { $objectToArray: "$attributes" },
                  as: "attr",
                  cond: { $in: ["$$attr.k", indicationTypes] },
                },
              },
              as: "attr",
              in: {
                indication_type: "$$attr.k",
                value: {
                  $cond: [{ $eq: [{ $type: "$$attr.v" }, "bool"] }, "$$attr.v", false],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          result: {
            $map: {
              input: "$indicationData",
              as: "item",
              in: {
                user_id: "$user_id",
                indication_type: "$$item.indication_type",
                value: "$$item.value",
              },
            },
          },
        },
      },
      { $unwind: "$result" },
      {
        $project: {
          user_id: "$result.user_id",
          indication_type: "$result.indication_type",
          value: "$result.value",
        },
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];

    const result = await this.userModel.aggregate<MongoPaginationQueryResult<UserIndicationDto>>(pipeline);

    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: userIndicationDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getUserClassifications(page: number, size: number): Promise<PaginationResponseDto<UserClassificationDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $unwind: "$domains",
      },
      {
        $unwind: "$domains.classifications",
      },
      {
        $project: {
          user_id: "$user_id",
          domain_id: "$domains.id",
          classification_id: "$domains.classifications",
        },
      },
      ...this.generatePaginationAggregation(limit, skip),
    ];

    const result = await this.userModel.aggregate<MongoPaginationQueryResult<UserClassificationDto>>(aggregation);

    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: userClassificationDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getDomainClassifications(page: number, size: number): Promise<PaginationResponseDto<DomainClassificationDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $unwind: "$classifications",
      },
      {
        $project: {
          domain_id: "$_id",
          classification_id: "$classifications",
        },
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];

    const result = await this.domainModel.aggregate<MongoPaginationQueryResult<DomainClassificationDto>>(aggregation);

    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: domainClassificationDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getUserRowFilters(page: number, size: number): Promise<PaginationResponseDto<UserRowFilterDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      { $unwind: "$permission_tables" },
      { $unwind: "$permission_tables.row_filters" },
      { $unwind: "$permission_tables.row_filters.values" },
      {
        $project: {
          user_id: 1,
          permission_table_id: "$permission_tables.id",
          kod: "$permission_tables.row_filters.kod",
          display_name: "$permission_tables.row_filters.values.display_name",
          value: { $toString: "$permission_tables.row_filters.values.value" },
        },
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];

    const result = await this.userModel.aggregate<MongoPaginationQueryResult<UserRowFilterDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: userRowFilterDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getUserIndicationActions(page: number, size: number): Promise<PaginationResponseDto<UserIndicationActionDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $match: { resource_type: Resource.User },
      },
      {
        $unwind: "$difference",
      },
      { $match: { "difference.kind": { $in: indicationTypes }, "difference.version": 1 } },
      {
        $project: {
          action_id: "$_id",
          user_object_id: "$resource_id",
          action_type: "$difference.action_type",
          indication_type: "$difference.kind",
        } satisfies Record<keyof UserIndicationActionDto, string>,
      },
      ...this.generatePaginationAggregation(limit, skip, "action_id" satisfies Extract<keyof UserIndicationActionDto, "action_id">),
    ] as const satisfies PipelineStage[];

    const result = await this.auditLogModel.aggregate<MongoPaginationQueryResult<UserIndicationActionDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: userIndicationActionDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getUserUniqueIndicationActions(page: number, size: number): Promise<PaginationResponseDto<UserUniqueIndicationActionDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $match: { resource_type: Resource.User },
      },
      {
        $unwind: "$difference",
      },
      { $match: { "difference.kind": "unique_population", "difference.version": 1 } },
      {
        $project: {
          action_id: "$_id",
          user_object_id: "$resource_id",
          type: "$difference.type",
          value: "$difference.value",
        } satisfies Record<keyof UserUniqueIndicationActionDto, string>,
      },
      ...this.generatePaginationAggregation(limit, skip, "action_id" satisfies Extract<keyof UserUniqueIndicationActionDto, "action_id">),
    ] as const satisfies PipelineStage[];

    const result = await this.auditLogModel.aggregate<MongoPaginationQueryResult<UserUniqueIndicationActionDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: userUniqueIndicationActionDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getTableClassificationActions(page: number, size: number): Promise<PaginationResponseDto<TableClassificationActionDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $match: { resource_type: Resource.Table },
      },
      {
        $unwind: "$difference",
      },
      { $match: { "difference.kind": "classification", "difference.version": 1 } },
      {
        $project: {
          action_id: "$_id",
          table_id: "$resource_id",
          column_name: "$difference.column_name",
          new_value: "$difference.newValue",
          old_value: "$difference.oldValue",
        } satisfies Record<keyof TableClassificationActionDto, string>,
      },
      ...this.generatePaginationAggregation(limit, skip, "action_id" satisfies Extract<keyof TableClassificationActionDto, "action_id">),
    ] as const satisfies PipelineStage[];

    const result = await this.auditLogModel.aggregate<MongoPaginationQueryResult<TableClassificationActionDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: tableClassificationActionDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getTableMaskActions(page: number, size: number): Promise<PaginationResponseDto<TableMaskActionDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $match: { resource_type: Resource.Table },
      },
      {
        $unwind: "$difference",
      },
      { $match: { "difference.kind": "mask", "difference.version": 1 } },
      {
        $project: {
          action_id: "$_id",
          table_id: "$resource_id",
          column_name: "$difference.column_name",
          new_value: "$difference.newValue",
          old_value: "$difference.oldValue",
        } satisfies Record<keyof TableMaskActionDto, string>,
      },
      ...this.generatePaginationAggregation(limit, skip, "action_id" satisfies Extract<keyof TableMaskActionDto, "action_id">),
    ] as const satisfies PipelineStage[];

    const result = await this.auditLogModel.aggregate<MongoPaginationQueryResult<TableMaskActionDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: tableMaskActionDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getUserRowFilterValuesActions(page: number, size: number): Promise<PaginationResponseDto<UserRowFilterValueActionDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $match: { resource_type: Resource.User },
      },
      {
        $unwind: "$difference",
      },
      { $match: { "difference.kind": "row_filter_value", "difference.version": 1 } },
      {
        $project: {
          action_id: "$_id",
          permission_table_id: "$difference.permission_table_id",
          row_filter_kod: "$difference.row_filter_kod",
          row_filter_value: "$difference.row_filter_value",
          type: "$difference.type",
          user_object_id: "$resource_id",
        } satisfies Record<keyof UserRowFilterValueActionDto, string>,
      },
      ...this.generatePaginationAggregation(limit, skip, "action_id" satisfies Extract<keyof UserRowFilterValueActionDto, "action_id">),
    ] as const satisfies PipelineStage[];

    const result = await this.auditLogModel.aggregate<MongoPaginationQueryResult<UserRowFilterValueActionDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: userRowFilterValueActionDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getUserClassificationActions(page: number, size: number): Promise<PaginationResponseDto<UserClassificationActionsDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $match: { resource_type: Resource.User },
      },
      {
        $unwind: "$difference",
      },
      { $match: { "difference.kind": "classification", "difference.version": 1 } },
      {
        $project: {
          action_id: "$_id",
          domain_id: "$difference.domain_id",
          classification: "$difference.classification",
          type: "$difference.type",
          user_object_id: "$resource_id",
        } satisfies Record<keyof UserClassificationActionsDto, string>,
      },
      ...this.generatePaginationAggregation(limit, skip, "action_id" satisfies Extract<keyof UserClassificationActionsDto, "action_id">),
    ] as const satisfies PipelineStage[];

    const result = await this.auditLogModel.aggregate<MongoPaginationQueryResult<UserClassificationActionsDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: userClassificationsActionDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getAppUsers(page: number, size: number): Promise<PaginationResponseDto<AppUserDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $project: {
          _id: true,
          user_id: true,
          first_name: true,
          last_name: true,
          is_admin: true,
          can_create_connections: true,
          can_manage_unique_population_indications: true,
          given_by: true,
          last_changed_by: true,
          last_change: true,
          create_date: true,
        } satisfies Record<keyof AppUserDto, true>,
      },
      ...this.generatePaginationAggregation(limit, skip),
    ] as const satisfies PipelineStage[];

    const result = await this.appUserModel.aggregate<MongoPaginationQueryResult<AppUserDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: appUserDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getAppUserClassifications(page: number, size: number): Promise<PaginationResponseDto<AppUserClassificationDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $unwind: "$domains",
      },
      {
        $unwind: "$domains.classifications",
      },
      {
        $project: {
          user_id: "$user_id",
          domain_id: "$domains.id",
          classification: "$domains.classifications",
        } satisfies Record<keyof AppUserClassificationDto, string>,
      },
      ...this.generatePaginationAggregation(limit, skip),
    ];

    const result = await this.appUserModel.aggregate<MongoPaginationQueryResult<AppUserClassificationDto>>(aggregation);

    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: appUserClassificationDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getAppUserRoles(page: number, size: number): Promise<PaginationResponseDto<AppUserRoleDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $unwind: "$domains",
      },
      {
        $unwind: "$domains.roles",
      },
      {
        $project: {
          user_id: "$user_id",
          domain_id: "$domains.id",
          role_id: "$domains.roles",
        },
      },
      ...this.generatePaginationAggregation(limit, skip),
    ];

    const result = await this.appUserModel.aggregate<MongoPaginationQueryResult<AppUserRoleDto>>(aggregation);

    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: appUserRoleDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getAppUserClassificationActions(page: number, size: number): Promise<PaginationResponseDto<AppUserClassificationActionDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $match: { resource_type: Resource.ApplicationUser },
      },
      {
        $unwind: "$difference",
      },
      { $match: { "difference.kind": "classification", "difference.version": 1 } },
      {
        $project: {
          action_id: "$_id",
          domain_id: "$difference.domain_id",
          classification: "$difference.classification",
          type: "$difference.type",
          user_object_id: "$resource_id",
        } satisfies Record<keyof AppUserClassificationActionDto, string>,
      },
      ...this.generatePaginationAggregation(limit, skip, "action_id" satisfies Extract<keyof AppUserClassificationActionDto, "action_id">),
    ] as const satisfies PipelineStage[];

    const result = await this.auditLogModel.aggregate<MongoPaginationQueryResult<AppUserClassificationActionDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: appUserClassificationActionDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getAppUserRoleActions(page: number, size: number): Promise<PaginationResponseDto<AppUserRoleActionDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $match: { resource_type: Resource.ApplicationUser },
      },
      {
        $unwind: "$difference",
      },
      { $match: { "difference.kind": "role", "difference.version": 1 } },
      {
        $project: {
          action_id: "$_id",
          domain_id: "$difference.domain_id",
          role_id: "$difference.role",
          type: "$difference.type",
          user_object_id: "$resource_id",
        } satisfies Record<keyof AppUserRoleActionDto, string>,
      },
      ...this.generatePaginationAggregation(limit, skip, "action_id" satisfies Extract<keyof AppUserRoleActionDto, "action_id">),
    ] as const satisfies PipelineStage[];

    const result = await this.auditLogModel.aggregate<MongoPaginationQueryResult<AppUserRoleActionDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: appUserRoleActionDtoSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }

  async getAppUserBooleanAttributeActions(page: number, size: number): Promise<PaginationResponseDto<AppUserBooleanAttributeActionDto>> {
    const limit = size;
    const skip = (page - 1) * size;

    const aggregation = [
      {
        $match: { resource_type: Resource.ApplicationUser },
      },
      {
        $unwind: "$difference",
      },
      { $match: { "difference.kind": { $in: applicationUserIndicationDiffKind }, "difference.version": 1 } },
      {
        $project: {
          action_id: "$_id",
          user_object_id: "$resource_id",
          action_type: "$difference.action_type",
          boolean_attribute_type: "$difference.kind",
        } satisfies Record<keyof AppUserBooleanAttributeActionDto, string>,
      },
      ...this.generatePaginationAggregation(
        limit,
        skip,
        "action_id" satisfies Extract<keyof AppUserBooleanAttributeActionDto, "action_id">,
      ),
    ] as const satisfies PipelineStage[];

    const result = await this.auditLogModel.aggregate<MongoPaginationQueryResult<AppUserBooleanAttributeActionDto>>(aggregation);

    // result will always have one item because we're using $facet
    const { items, metadata } = result[0]!;

    const totalCount = metadata[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / size);

    if (totalPages < page) {
      throw new NotFoundException(`Page ${page} is out of range. Total pages are ${totalPages}.`);
    }

    return {
      items: appUserBooleanAttributeActionSchema.array().parse(items),
      page,
      size,
      total: totalCount,
    };
  }
}

import { Controller, Get, Query } from "@nestjs/common";
import { ApiBasicAuth, ApiTags } from "@nestjs/swagger";
import { ClassificationDto } from "../dtos/classifications.dto";
import { ApiPagination, PaginationQueryParams } from "./pagination.utils";
import { DataService } from "./data.service";
import { DomainDto } from "../dtos/domains.dto";
import { PermissionTableDto } from "../dtos/permission_tables.dto";
import { RowFilterDto } from "../dtos/row_filters.dto";
import { UserIndicationActionDto } from "../dtos/user_indication_actions.dto";
import { DATA_API_TAG, TABLES } from "../common/constants";
import { TableClassificationActionDto } from "src/dtos/table_classification_actions.dto";
import { UserRowFilterValueActionDto } from "src/dtos/user_row_filter_value_actions.dto";
import { UserClassificationActionsDto } from "src/dtos/user_classification_actions.dto";
import { TableMaskActionDto } from "src/dtos/table_mask_actions.dto";
import { AuditLogDto } from "src/dtos/audit_logs.dto";
import { UserDto } from "src/dtos/users.dto";
import { AuditingLegacyDto } from "src/dtos/auditing_legacy.dto";
import { TableDto } from "src/dtos/tables.dto";
import { ColumnDto } from "src/dtos/columns.dto";
import { TableTaskDto } from "src/dtos/table_tasks.dto";
import { UserClassificationDto } from "src/dtos/user_classifications.dto";
import { DomainClassificationDto } from "src/dtos/domain_classifications.dto";
import { UserRowFilterDto } from "src/dtos/user_row_filter.dto";
import { UserIndicationDto } from "src/dtos/user_indications.dto";
import { UserUniqueIndicationDto } from "src/dtos/user_unique_indications.dto";
import { UserUniqueIndicationActionDto } from "src/dtos/user_unique_indication_actions.dto";
import { AppUserDto } from "src/dtos/app_users.dto";
import { AppUserClassificationDto } from "src/dtos/app_user_classifications.dto";
import { AppUserRoleDto } from "src/dtos/app_user_roles.dto";
import { AppUserClassificationActionDto } from "src/dtos/app_user_classification_actions.dto";
import { AppUserRoleActionDto } from "src/dtos/app_user_role_actions.dto";
import { AppUserBooleanAttributeActionDto } from "src/dtos/app_user_boolean_attribute_actions";
import { RoleDto } from "src/dtos/roles.dto";

@Controller()
@ApiBasicAuth()
@ApiTags(DATA_API_TAG)
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get(TABLES.enum.users)
  @ApiPagination(UserDto)
  async getUsers(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getUsers(page, size);
  }

  @Get(TABLES.enum.auditing_legacy)
  @ApiPagination(AuditingLegacyDto)
  async getAuditingLegacy(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getAuditingLegacy(page, size);
  }

  @Get(TABLES.enum.tables)
  @ApiPagination(TableDto)
  async getTables(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getTables(page, size);
  }

  @Get(TABLES.enum.table_tasks)
  @ApiPagination(TableTaskDto)
  async getTableTasks(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getTableTasks(page, size);
  }

  @Get(TABLES.enum.columns)
  @ApiPagination(ColumnDto)
  async getColumns(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getColumns(page, size);
  }

  @Get(TABLES.enum.classifications)
  @ApiPagination(ClassificationDto)
  async getClassifications(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getClassifications(page, size);
  }

  @Get(TABLES.enum.domains)
  @ApiPagination(DomainDto)
  async getDomains(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getDomains(page, size);
  }

  @Get(TABLES.enum.roles)
  @ApiPagination(RoleDto)
  async getRoles(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getRoles(page, size);
  }

  @Get(TABLES.enum.permission_tables)
  @ApiPagination(PermissionTableDto)
  async getPermissionTables(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getPermissionTables(page, size);
  }

  @Get(TABLES.enum.row_filters)
  @ApiPagination(RowFilterDto)
  async getRowFilters(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getRowFilters(page, size);
  }

  @Get(TABLES.enum.user_indication_actions)
  @ApiPagination(UserIndicationActionDto)
  async getUserAttributesActions(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getUserIndicationActions(page, size);
  }

  @Get(TABLES.enum.user_unique_indication_actions)
  @ApiPagination(UserUniqueIndicationActionDto)
  async getUserUniqueIndicationActions(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getUserUniqueIndicationActions(page, size);
  }

  @Get(TABLES.enum.audit_logs)
  @ApiPagination(AuditLogDto)
  async getAuditLogs(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getAuditLogs(page, size);
  }

  @Get(TABLES.enum.user_indication_actions)
  @ApiPagination(UserIndicationActionDto)
  async getUserIndicationActions(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getUserIndicationActions(page, size);
  }

  @Get(TABLES.enum.table_classification_actions)
  @ApiPagination(TableClassificationActionDto)
  async getTableClassificationActions(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getTableClassificationActions(page, size);
  }

  @Get(TABLES.enum.table_mask_actions)
  @ApiPagination(TableMaskActionDto)
  async getTableMaskActions(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getTableMaskActions(page, size);
  }

  @Get(TABLES.enum.user_row_filter_value_actions)
  @ApiPagination(UserRowFilterValueActionDto)
  async getUserRowFilterValuesActions(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getUserRowFilterValuesActions(page, size);
  }

  @Get(TABLES.enum.user_classification_actions)
  @ApiPagination(UserClassificationActionsDto)
  async getUserClassificationActions(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getUserClassificationActions(page, size);
  }

  @Get(TABLES.enum.user_indications)
  @ApiPagination(UserIndicationDto)
  async getUserIndications(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getUserIndications(page, size);
  }

  @Get(TABLES.enum.user_classifications)
  @ApiPagination(UserClassificationDto)
  async getUserClassifications(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getUserClassifications(page, size);
  }

  @Get(TABLES.enum.domain_classifications)
  @ApiPagination(DomainClassificationDto)
  async getDomainClassifications(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getDomainClassifications(page, size);
  }

  @Get(TABLES.enum.user_row_filters)
  @ApiPagination(UserRowFilterDto)
  async getUserRowFilters(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getUserRowFilters(page, size);
  }

  @Get(TABLES.enum.user_unique_indications)
  @ApiPagination(UserUniqueIndicationDto)
  async getUserUniqueIndication(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getUserUniqueIndications(page, size);
  }

  @Get(TABLES.enum.application_users)
  @ApiPagination(AppUserDto)
  async getAppUsers(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getAppUsers(page, size);
  }

  @Get(TABLES.enum.application_user_classifications)
  @ApiPagination(AppUserClassificationDto)
  async getAppUserClassifications(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getAppUserClassifications(page, size);
  }

  @Get(TABLES.enum.application_user_roles)
  @ApiPagination(AppUserRoleDto)
  async getAppUserRoles(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getAppUserRoles(page, size);
  }

  @Get(TABLES.enum.application_user_classification_actions)
  @ApiPagination(AppUserClassificationActionDto)
  async getAppUserClassificationActions(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getAppUserClassificationActions(page, size);
  }

  @Get(TABLES.enum.application_user_role_actions)
  @ApiPagination(AppUserRoleActionDto)
  async getAppUserRoleActions(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getAppUserRoleActions(page, size);
  }

  @Get(TABLES.enum.application_user_boolean_attribute_actions)
  @ApiPagination(AppUserBooleanAttributeActionDto)
  async getAppUserBooleanAttributeActions(@Query() { page, size }: PaginationQueryParams) {
    return await this.dataService.getAppUserBooleanAttributeActions(page, size);
  }
}

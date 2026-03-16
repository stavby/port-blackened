import { Injectable, NotFoundException } from "@nestjs/common";
import { TABLES, ZOD_SCHEMAS_BY_TABLE } from "../common/constants";
import { exhaustiveMatchingGuard } from "../common/utils";
import { DataService } from "../data/data.service";
import { TableSchemaDef } from "./metadata.dtos";
import { zodToTableSchemaDef } from "./metadata.utils";

@Injectable()
export class MetadataService {
  constructor(private readonly dataService: DataService) {}

  listTables(): string[] {
    return TABLES.options;
  }

  validateTable(tableName: string): boolean {
    const table = TABLES.safeParse(tableName.toLowerCase());

    return !!table.success;
  }

  getTableSchema(tableName: string): TableSchemaDef[] {
    const table = TABLES.safeParse(tableName.toLowerCase());

    if (!table.success) {
      throw new NotFoundException(`Table ${tableName} not found`);
    }

    return zodToTableSchemaDef(ZOD_SCHEMAS_BY_TABLE[table.data]);
  }

  async getTableSample(tableName: string): Promise<unknown[]> {
    const table = TABLES.safeParse(tableName.toLowerCase());

    if (!table.success) {
      throw new NotFoundException(`Table ${tableName} not found`);
    }

    const paginationRequestArgs: [number, number] = [1, 10];

    switch (table.data) {
      case TABLES.enum.users:
        return (await this.dataService.getUsers(...paginationRequestArgs)).items;
      case TABLES.enum.auditing_legacy:
        return (await this.dataService.getAuditingLegacy(...paginationRequestArgs)).items;
      case TABLES.enum.tables:
        return (await this.dataService.getTables(...paginationRequestArgs)).items;
      case TABLES.enum.columns:
        return (await this.dataService.getColumns(...paginationRequestArgs)).items;
      case TABLES.enum.classifications:
        return (await this.dataService.getClassifications(...paginationRequestArgs)).items;
      case TABLES.enum.domains:
        return (await this.dataService.getDomains(...paginationRequestArgs)).items;
      case TABLES.enum.roles:
        return (await this.dataService.getRoles(...paginationRequestArgs)).items;
      case TABLES.enum.permission_tables:
        return (await this.dataService.getPermissionTables(...paginationRequestArgs)).items;
      case TABLES.enum.row_filters:
        return (await this.dataService.getRowFilters(...paginationRequestArgs)).items;
      case TABLES.enum.user_unique_indications:
        return (await this.dataService.getUserUniqueIndications(...paginationRequestArgs)).items;
      case TABLES.enum.table_tasks:
        return (await this.dataService.getTableTasks(...paginationRequestArgs)).items;
      case TABLES.enum.audit_logs:
        return (await this.dataService.getAuditLogs(...paginationRequestArgs)).items;
      case TABLES.enum.table_classification_actions:
        return (await this.dataService.getTableClassificationActions(...paginationRequestArgs)).items;
      case TABLES.enum.table_mask_actions:
        return (await this.dataService.getTableMaskActions(...paginationRequestArgs)).items;
      case TABLES.enum.user_indication_actions:
        return (await this.dataService.getUserIndicationActions(...paginationRequestArgs)).items;
      case TABLES.enum.user_unique_indication_actions:
        return (await this.dataService.getUserUniqueIndicationActions(...paginationRequestArgs)).items;
      case TABLES.enum.user_row_filter_value_actions:
        return (await this.dataService.getUserRowFilterValuesActions(...paginationRequestArgs)).items;
      case TABLES.enum.user_classification_actions:
        return (await this.dataService.getUserClassificationActions(...paginationRequestArgs)).items;
      case TABLES.enum.user_indications:
        return (await this.dataService.getUserIndications(...paginationRequestArgs)).items;
      case TABLES.enum.user_classifications:
        return (await this.dataService.getUserClassifications(...paginationRequestArgs)).items;
      case TABLES.enum.domain_classifications:
        return (await this.dataService.getDomainClassifications(...paginationRequestArgs)).items;
      case TABLES.enum.user_row_filters:
        return (await this.dataService.getUserRowFilters(...paginationRequestArgs)).items;
      case TABLES.enum.application_users:
        return (await this.dataService.getAppUsers(...paginationRequestArgs)).items;
      case TABLES.enum.application_user_classifications:
        return (await this.dataService.getAppUserClassifications(...paginationRequestArgs)).items;
      case TABLES.enum.application_user_roles:
        return (await this.dataService.getAppUserRoles(...paginationRequestArgs)).items;
      case TABLES.enum.application_user_classification_actions:
        return (await this.dataService.getAppUserClassificationActions(...paginationRequestArgs)).items;
      case TABLES.enum.application_user_role_actions:
        return (await this.dataService.getAppUserRoleActions(...paginationRequestArgs)).items;
      case TABLES.enum.application_user_boolean_attribute_actions:
        return (await this.dataService.getAppUserBooleanAttributeActions(...paginationRequestArgs)).items;
      default:
        return exhaustiveMatchingGuard(table);
    }
  }
}

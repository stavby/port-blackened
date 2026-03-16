import { tableClassificationActionDtoSchema } from "src/dtos/table_classification_actions.dto";
import { userDtoSchema } from "src/dtos/users.dto";
import { classificationDtoSchema } from "../dtos/classifications.dto";
import { domainDtoSchema } from "../dtos/domains.dto";
import { permissionTableDtoSchema } from "../dtos/permission_tables.dto";
import { rowFilterDtoSchema } from "../dtos/row_filters.dto";
import { userIndicationActionDtoSchema } from "../dtos/user_indication_actions.dto";
import { z } from "zod";
import { userRowFilterValueActionDtoSchema } from "src/dtos/user_row_filter_value_actions.dto";
import { userClassificationsActionDtoSchema } from "src/dtos/user_classification_actions.dto";
import { tableMaskActionDtoSchema } from "src/dtos/table_mask_actions.dto";
import { auditLogDtoSchema } from "src/dtos/audit_logs.dto";
import { auditingLegacyDtoSchema } from "src/dtos/auditing_legacy.dto";
import { tableDtoSchema } from "src/dtos/tables.dto";
import { columnDtoSchema } from "src/dtos/columns.dto";
import { tableTaskDtoSchema } from "src/dtos/table_tasks.dto";
import { userIndicationDtoSchema } from "src/dtos/user_indications.dto";
import { userClassificationDtoSchema } from "src/dtos/user_classifications.dto";
import { domainClassificationDtoSchema } from "src/dtos/domain_classifications.dto";
import { userRowFilterDtoSchema } from "src/dtos/user_row_filter.dto";
import { userUniqueIndicationsDtoSchema } from "src/dtos/user_unique_indications.dto";
import { userUniqueIndicationActionDtoSchema } from "src/dtos/user_unique_indication_actions.dto";
import { appUserDtoSchema } from "src/dtos/app_users.dto";
import { appUserClassificationDtoSchema } from "src/dtos/app_user_classifications.dto";
import { appUserRoleDtoSchema } from "src/dtos/app_user_roles.dto";
import { appUserClassificationActionDtoSchema } from "src/dtos/app_user_classification_actions.dto";
import { appUserRoleActionDtoSchema } from "src/dtos/app_user_role_actions.dto";
import { appUserBooleanAttributeActionSchema } from "src/dtos/app_user_boolean_attribute_actions";
import { roleDtoSchema } from "src/dtos/roles.dto";

export const DATA_API_TAG = "Data";

export const TABLES = z.enum([
  "classifications",
  "domains",
  "roles",
  "domain_classifications",
  "permission_tables",
  "row_filters",
  "users",
  "user_indications",
  "user_unique_indications",
  "user_row_filters",
  "user_classifications",
  "tables",
  "columns",
  "table_tasks",
  "auditing_legacy",
  "audit_logs",
  "user_indication_actions",
  "user_unique_indication_actions",
  "table_mask_actions",
  "table_classification_actions",
  "user_row_filter_value_actions",
  "user_classification_actions",
  "application_users",
  "application_user_classifications",
  "application_user_roles",
  "application_user_classification_actions",
  "application_user_role_actions",
  "application_user_boolean_attribute_actions",
] as const satisfies Lowercase<string>[]);

export const ZOD_SCHEMAS_BY_TABLE = {
  classifications: classificationDtoSchema,
  domains: domainDtoSchema,
  roles: roleDtoSchema,
  permission_tables: permissionTableDtoSchema,
  row_filters: rowFilterDtoSchema,
  user_indication_actions: userIndicationActionDtoSchema,
  user_unique_indication_actions: userUniqueIndicationActionDtoSchema,
  table_classification_actions: tableClassificationActionDtoSchema,
  table_mask_actions: tableMaskActionDtoSchema,
  user_row_filter_value_actions: userRowFilterValueActionDtoSchema,
  user_classification_actions: userClassificationsActionDtoSchema,
  audit_logs: auditLogDtoSchema,
  users: userDtoSchema,
  auditing_legacy: auditingLegacyDtoSchema,
  tables: tableDtoSchema,
  columns: columnDtoSchema,
  table_tasks: tableTaskDtoSchema,
  user_indications: userIndicationDtoSchema,
  user_classifications: userClassificationDtoSchema,
  domain_classifications: domainClassificationDtoSchema,
  user_row_filters: userRowFilterDtoSchema,
  user_unique_indications: userUniqueIndicationsDtoSchema,
  application_users: appUserDtoSchema,
  application_user_classifications: appUserClassificationDtoSchema,
  application_user_roles: appUserRoleDtoSchema,
  application_user_classification_actions: appUserClassificationActionDtoSchema,
  application_user_role_actions: appUserRoleActionDtoSchema,
  application_user_boolean_attribute_actions: appUserBooleanAttributeActionSchema,
} as const satisfies Record<z.infer<typeof TABLES>, z.ZodSchema>;

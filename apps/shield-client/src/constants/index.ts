import { ObjectIdBrand } from "@port/shield-schemas";
import { StandardTable } from "@port/utils";
import { PermissionTable, RowFilter } from "@types";

// Note: Only VITE_SOME_KEY will be exposed as import.meta.env.VITE_SOME_KEY to the client source code
export const ENV = import.meta.env.VITE_ENV;
export const MUI_LICENSE_KEY = import.meta.env.VITE_MUI_LICENSE_KEY;
export const BACKEND_ENDPOINT = import.meta.env.VITE_APP_BACKEND;

export const LOGIN_ENDPOINT = (redirectTo: string) => `${BACKEND_ENDPOINT}/auth/login/?redirectTo=${redirectTo}`;
export const USER_INFO_ENDPOINT = `${BACKEND_ENDPOINT}/userInfo`;
export const USER_INFO_DISPLAY_ENDPOINT = `${BACKEND_ENDPOINT}/userInfoDisplay`;

// roles
export const ROLES_ENDPOINT = `${BACKEND_ENDPOINT}/roles`;
export const ASSIGNABLE_ROLES = `${ROLES_ENDPOINT}/assignable-roles`;

// excel
export const EXCEL_ENDPOINT = `${BACKEND_ENDPOINT}/excel`;

// domains
export const DOMAINS_ENDPOINT = `${BACKEND_ENDPOINT}/domains`;
export const GET_ALL_DOMAINS_ENDPOINT = `${DOMAINS_ENDPOINT}/client`;
export const GET_DOMAINS_MANAGE_ENDPOINT = `${DOMAINS_ENDPOINT}/manage-users`;
export const DOMAINS_DICTIONARY_ENDPOINT = `${DOMAINS_ENDPOINT}/dictionary/client`;
export const DOMAIN_BY_ID_ENDPOINT = (id: string) => `${DOMAINS_ENDPOINT}/id/${id}`;
export const DOMAINS_WITH_CLASSIFICATIONS_ENDPOINT = `${DOMAINS_ENDPOINT}/with-classifications`;
export const DOMAIN_BY_ID_WITH_CLASSIFICATIONS_ENDPOINT = (id: string) => `${DOMAINS_ENDPOINT}/id/${id}/with-classifications`;
export const DOMAINS_EXCEL_ENDPOINT = `${DOMAINS_ENDPOINT}/excel`;
export const DOMAIN_CLASSIFICATION_EXPOSURES_ENDPOINT = (id: string) => `${DOMAIN_BY_ID_ENDPOINT(id)}/classification-exposure`;
export const DOMAIN_CLASSIFICATIONS_ENDPOINT = (id: string) => `${DOMAINS_ENDPOINT}/id/${id}/classifications`;

// permission table
export const PERMISSION_TABLE_ENDPOINT = `${BACKEND_ENDPOINT}/permission_tables`;
export const PERMISSION_TABLE_BY_ID_ENDPOINT = (id: string) => `${PERMISSION_TABLE_ENDPOINT}/id/${id}`;
export const ROW_FILTERS_OPTIONS_ENDPOINT = (permissionTableId: PermissionTable["_id"], rowFilterKod: RowFilter["kod"]) =>
  `${PERMISSION_TABLE_ENDPOINT}/id/${permissionTableId}/row-filters/${rowFilterKod}`;

// permissions
export const PERMISSIONS_ENDPOINT = `${BACKEND_ENDPOINT}/classifications`;
export const PERMISSIONS_EXCEL_ENDPOINT = `${PERMISSIONS_ENDPOINT}/excel`;

//permission groups
export const PERMISSION_GROUPS_ENDPOINT = `${BACKEND_ENDPOINT}/permission_groups`;
export const PERMISSION_GROUPS_EXCEL_ENDPOINT = `${PERMISSION_GROUPS_ENDPOINT}/excel`;
export const ADD_PERMISSION_GROUP_TO_USERS = (permissionGroup: string) => `${PERMISSION_GROUPS_ENDPOINT}/${permissionGroup}/users`;
export const GET_USERS_BY_PERMISSION_GROUP = (permissionGroup: string) => `${PERMISSION_GROUPS_ENDPOINT}/${permissionGroup}/users`;
export const DELETE_PERMISSION_GROUP = (permissionGroup: string) => `${PERMISSION_GROUPS_ENDPOINT}/id/${permissionGroup}`;
export const EDIT_PERMISSION_GROUP = (permissionGroup: string) => `${PERMISSION_GROUPS_ENDPOINT}/id/${permissionGroup}`;
export const EDIT_PERMISSION_GROUP_DATA_PERMISSIONS = (permissionGroup: string) =>
  `${PERMISSION_GROUPS_ENDPOINT}/id/${permissionGroup}/data-permissions`;

export const DELETE_PERMISSION_GROUP_TO_USERS = (permissionGroup: string, user_id: string) =>
  `${PERMISSION_GROUPS_ENDPOINT}/${permissionGroup}/users/${user_id}`;
export const GET_LOGGED_USER_GROUP_PERMISSIONS = (permissionGroup: string) =>
  `${PERMISSION_GROUPS_ENDPOINT}/${permissionGroup}/roles/batch`;
export const GET_PERMISSION_GROUP_DATA_PERMISSIONS = (permissionGroupId: ObjectIdBrand) =>
  `${PERMISSION_GROUPS_ENDPOINT}/${permissionGroupId}/data-permissions`;
export const GET_PERMISSION_GROUPS_DATA_PERMISSIONS = `${PERMISSION_GROUPS_ENDPOINT}/data-permissions/batch`;
export const GET_MEMBER_EDITABLE_PERMISSION_GROUPS = `${PERMISSION_GROUPS_ENDPOINT}/member-editable`;

// users
export const USERS_ENDPOINT = `${BACKEND_ENDPOINT}/users`;
export const CLONE_USER_ENDPOINT = (srcUserId: string, dstUserId: string) =>
  `${USERS_ENDPOINT}/cloneUser/srcUserId/${srcUserId}/dstUserId/${dstUserId}`;
export const CHECK_USERS_EXISTENCE_ENDPOINT = `${USERS_ENDPOINT}/existence`;
export const CLONE_USERS_ENDPOINT = `${USERS_ENDPOINT}/clone/batch`;
export const COPY_DOMAIN_TO_USER_ENDPOINT = (srcUserId: string, dstUserId: string, domainId: string) =>
  `${USERS_ENDPOINT}/copy/domain/${domainId}/srcUserId/${srcUserId}/dstUserId/${dstUserId}`;
export const DELETE_USER_BY_ID_ENDPOINT = (id: string) => `${USERS_ENDPOINT}/id/${id}`;
export const DELETE_USER_DOMAIN_ENDPOINT = (id: string, domainId: string) => `${USERS_ENDPOINT}/id/${id}/domain/${domainId}`;
export const USERS_REGULAR_ENDPOINT = `${USERS_ENDPOINT}/regular`;
export const USERS_EXCEL_ENDPOINT = `${USERS_ENDPOINT}/excel`;
export const USER_BY_USER_ID_ENDPOINT = (userId: string) => `${USERS_ENDPOINT}/userId/${userId}`;
export const IS_USER_SAP_PERMITTED_BY_USER_ID_ENDPOINT = (userId: string) => `${USERS_ENDPOINT}/isSapPermitted/${userId}`;
export const DOMAIN_BY_USER_ENDPOINT = (id: string, domainId: string) => `${USERS_ENDPOINT}/id/${id}/domain/${domainId}`;
export const USER_PERMISSION_TABLES_OPTIONS_ENDPOINT = `${USERS_ENDPOINT}/permission_tables/options`;
export const EDIT_USER = (id: string) => `${USERS_ENDPOINT}/${id}`;
export const UNIQUE_POPULATION_OPTIONS = `${USERS_ENDPOINT}/unique-population-options`;
export const HAS_PERMISSIONS_FOR_UNIQUE_POPULATIONS_ENDPOINT = `${USERS_ENDPOINT}/hasPermissionsForUniquePopulations`;
export const HAS_PERMISSIONS_FOR_DECEASED_POPULATIONS_ENDPOINT = `${USERS_ENDPOINT}/hasPermissionsForDeceasedPopulations`;
export const HAS_PERMISSIONS_FOR_MASK_ENDPOINT = `${USERS_ENDPOINT}/hasPermissionsForMask`;
export const GET_LIVE_TABLES_BY_USER_ENDPOINT = (userId: string) => `${USERS_ENDPOINT}/liveTablesByUser/${userId}`;
export const GET_LIVE_COLUMNS_BY_TABLE_ENDPOINT = (userId: string, table: StandardTable) =>
  `${USERS_ENDPOINT}/liveColumnsByTable/${userId}/table/${encodeURIComponent(table.tableSchema)}/${encodeURIComponent(table.tableName)}`;

// user info
export const USERS_INFO_ENDPOINT = `${BACKEND_ENDPOINT}/user-info`;
export const GET_USER_INFO_BY_ID_ENDPOINT = (user_id: string) => `${USERS_INFO_ENDPOINT}/${user_id}`;
export const GET_FULL_USER_INFO_BY_ID_ENDPOINT = (user_id: string) => `${USERS_INFO_ENDPOINT}/${user_id}/full`;
export const SEARCH_USERS_ENDPOINT = (search: string) => `${USERS_INFO_ENDPOINT}/search/${search}`;

// tables
export const TABLES_ENDPOINT = `${BACKEND_ENDPOINT}/tables`;
export const TABLES_EXCEL_ENDPOINT = `${TABLES_ENDPOINT}/excel`;

// tasks
export const TASKS_ENDPOINT = `${BACKEND_ENDPOINT}/tasks`;
export const MARK_TASK_AS_DONE_ENDPOINT = (id: string) => `${TASKS_ENDPOINT}/id/${id}/done`;

// trino
export const TRINO_ENDPOINT = (id: string) => `${BACKEND_ENDPOINT}/trino/${id}`;

//contact
export const GET_CONTACT_TYPES_ENDPOINT = `${BACKEND_ENDPOINT}/contact/types`;
export const CONACT_US_ENDPOINT = `${BACKEND_ENDPOINT}/contact`;

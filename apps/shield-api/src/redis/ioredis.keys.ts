import { RowFilter } from "src/permission_tables/permission_tables.classes";

const REDIS_KEY_PREFIX = "shield";

type RedisKey = `${typeof REDIS_KEY_PREFIX}-${string}`;
type RedisKeysStore = Record<Uppercase<string>, RedisKey | ((...args: any[]) => RedisKey)>;

export const REDIS_KEYS = {
  JIRA_CONTACT_TYPES: `${REDIS_KEY_PREFIX}-contact_types`,
  USERS_DICT: `${REDIS_KEY_PREFIX}-users_dict`,
  UNIQUE_POPULATION_OPTIONS: `${REDIS_KEY_PREFIX}-unique-population-options`,
  KEYCLOAK_USER: <UserId extends string>(user_id: UserId) => `${REDIS_KEY_PREFIX}-keycloak_user_${user_id}` as const,
  KEYCLOAK_SEARCH: <Search extends string>(search: Search) => `${REDIS_KEY_PREFIX}-keycloak_search_${search}` as const,
  TRINO_USER_DATA: <UserId extends string>(user_id: UserId) => `${REDIS_KEY_PREFIX}-trino_user_${user_id}` as const,
  TRINO_DIMENSIONS_TABLE_VALUES: <DimensionsTable extends RowFilter["dimensions_table"]>(dimensions_table: DimensionsTable) =>
    `${REDIS_KEY_PREFIX}-trino_dimensions_table_values_${dimensions_table}` as const,
} as const satisfies RedisKeysStore;

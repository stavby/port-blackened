import { GetDictUserPreviewSchemaDto } from "@port/shield-schemas";
import { StandardTable } from "@port/utils";
import { UserID } from "@port/common-schemas";
import { Input, OPAClient } from "@styra/opa";
import { ColumnSchema, OpaTableLivePermission, OpaTablePermission, TablePermission } from "./interfaces.ts";
import { DATALAKE_CATALOG_NAME } from "@port/common-schemas";

export class OpaApi {
  private readonly opa: OPAClient;

  constructor(url: string) {
    this.opa = new OPAClient(url);
  }

  async getUserPermissions(userId: UserID): Promise<TablePermission[]> {
    const input = {
      action: {
        operation: "ReturnPermissions",
      },
      context: {
        identity: { user: userId },
      },
    } as const satisfies Input;

    const opaTablesPermission = await this.opa.evaluate<typeof input, OpaTablePermission[]>("policies/return_permissions", input);

    const tablePermissions = opaTablesPermission.map<TablePermission>(({ table_schema, table_name, columns }) => ({
      tableSchema: table_schema,
      tableName: table_name,
      columns,
    }));

    return tablePermissions;
  }

  async getUserPermissionsByTable(userId: UserID, table: StandardTable): Promise<ColumnSchema["column_name"][]> {
    const input = {
      action: {
        operation: "ReturnTablePermissions",
        resource: {
          catalog_name: DATALAKE_CATALOG_NAME,
          table_schema: table.tableSchema,
          table_name: table.tableName,
        },
      },
      context: {
        identity: { user: userId },
      },
    } as const satisfies Input;

    const columns = await this.opa.evaluate<typeof input, ColumnSchema["column_name"][] | undefined>(
      "policies/return_table_permissions",
      input,
    );

    return columns ?? [];
  }

  async getUserPermissionsByTables(userId: UserID, tables: StandardTable[]): Promise<TablePermission[]> {
    const input = {
      action: {
        operation: "ReturnBatchTablePermissions",
        resources: tables.map((table) => ({
          catalog_name: DATALAKE_CATALOG_NAME,
          table_schema: table.tableSchema,
          table_name: table.tableName,
        })),
      },
      context: {
        identity: { user: userId },
      },
    } as const satisfies Input;

    const opaTablesPermission = await this.opa.evaluate<typeof input, OpaTablePermission[] | undefined>(
      "policies/return_batch_table_permissions",
      input,
    );

    const tablePermissions = opaTablesPermission?.map<TablePermission>(({ table_schema, table_name, columns }) => ({
      tableSchema: table_schema,
      tableName: table_name,
      columns,
    }));

    return tablePermissions ?? [];
  }

  async getUserLivePermissions(user_attributes: GetDictUserPreviewSchemaDto): Promise<TablePermission[]> {
    const input = {
      action: {
        operation: "ReturnLivePermissions",
      },
      context: {
        identity: { user: user_attributes.user_id, user_attributes },
      },
    } as const satisfies Input;

    const opaTablesPermission = await this.opa.evaluate<typeof input, OpaTableLivePermission[]>("policies/return_live_permissions", input);

    const tablePermissions = opaTablesPermission.map<TablePermission>(({ table_schema, table_name, columns, permission_source }) => ({
      tableSchema: table_schema,
      tableName: table_name,
      columns,
      permission_source,
    }));

    return tablePermissions;
  }

  async getUserPermissionsByTableAndUser(
    table: StandardTable,
    user_attributes: GetDictUserPreviewSchemaDto,
  ): Promise<ColumnSchema["column_name"][]> {
    const input = {
      action: {
        operation: "ReturnLiveTablePermissions",
        resource: {
          catalog_name: DATALAKE_CATALOG_NAME,
          table_schema: table.tableSchema,
          table_name: table.tableName,
        },
      },
      context: {
        identity: { user: user_attributes.user_id, user_attributes },
      },
    } as const satisfies Input;

    const columns = await this.opa.evaluate<typeof input, ColumnSchema["column_name"][] | undefined>(
      "policies/return_live_table_permissions",
      input,
    );

    return columns ?? [];
  }
}

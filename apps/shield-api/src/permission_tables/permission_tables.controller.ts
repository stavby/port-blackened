import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiParam, ApiTags } from "@nestjs/swagger";
import { ObjectId } from "mongodb";
import { ParseObjectIdPipe } from "src/utils/mongo.utils";
import { GetRowFilterValuesQueryParams } from "./permission_table.dto";
import { RowFilter } from "./permission_tables.classes";
import { PermissionTablesService } from "./permission_tables.service";
import { ExternalApi } from "src/utils/api.decorators";
import { PermissionTableDictionary } from "./permissions_tables.interfaces";

@Controller("permission_tables")
@ApiTags("Permission Tables")
export class PermissionTablesController {
  constructor(private readonly permissionTablesService: PermissionTablesService) {}

  @Get()
  async getPermissionTables() {
    return await this.permissionTablesService.getPermissionTables();
  }

  @ExternalApi()
  @Get("external")
  async getPermissionTablesExternal() {
    return await this.permissionTablesService.getPermissionTables();
  }

  @Get("id/:id")
  @ApiParam({ name: "id", type: "string" })
  async getPermissionTableById(@Param("id", new ParseObjectIdPipe()) id: ObjectId) {
    return await this.permissionTablesService.getPermissionTableById(id);
  }

  @Get("/id/:id/row-filters/:row_filter_kod")
  @ApiParam({ name: "id", type: "string" })
  @ApiParam({ name: "row_filter_kod", type: "string" })
  async getRowFilterValueOptions(
    @Param("id", new ParseObjectIdPipe()) permission_table_id: ObjectId,
    @Param("row_filter_kod") row_filter_kod: RowFilter["kod"],
    @Query() { unflatten }: GetRowFilterValuesQueryParams,
  ) {
    return await this.permissionTablesService.getRowFilterValueOptions(permission_table_id, row_filter_kod, { unflatten });
  }

  @Get("dictionary")
  @ExternalApi()
  async getPermissionTableDictionary(): Promise<PermissionTableDictionary> {
    return await this.permissionTablesService.getPermissionTableDictionary();
  }
}

import { Body, Controller, Delete, Get, Param, Post, Put, Res } from "@nestjs/common";
import { ApiParam } from "@nestjs/swagger";
import { Response } from "express";
import { ObjectId } from "mongodb";
import { AuthenticatedUser } from "nest-keycloak-connect";
import { LoggedUser } from "src/auth/auth.interface";
import { EXCEL_CONTENT_DISPOSITION, EXCEL_CONTENT_TYPE_HEADER } from "src/excel/excel.constants";
import { CustomerRoute, ExternalApi } from "src/utils/api.decorators";
import { ParseObjectIdPipe } from "src/utils/mongo.utils";
import { RawStandardTablesBody, SchemasDictionary, TablesDictionary } from "./table.classes";
import {
  DeprecateTablesDto,
  EditTableDto,
  GetTableByIdDto,
  GetTableSuggestionsDto,
  GetTablesDto,
  UpsertTableResponseDto,
  UpsertExternalTablesDto,
  UpsertInternalTablesDto
} from "./table.dto";
import { TableService } from "./table.service";

@Controller("tables")
export class TableController {
  constructor(private readonly tableService: TableService) { }

  @Get()
  async getTables(@AuthenticatedUser() user: LoggedUser): Promise<GetTablesDto[]> {
    return await this.tableService.getTables(user);
  }

  @Get("/id/:id")
  @ApiParam({ name: "id", type: "string" })
  async getTableById(
    @Param("id", new ParseObjectIdPipe())
    id: ObjectId,
    @AuthenticatedUser() user: LoggedUser,
  ): Promise<GetTableByIdDto> {
    return await this.tableService.getTableDtoById(id, user.userId);
  }

  @Get("/id/:id/suggestions")
  @ApiParam({ name: "id", type: "string" })
  async getTableSuggestionsById(
    @Param("id", new ParseObjectIdPipe())
    id: ObjectId,
    @AuthenticatedUser() user: LoggedUser,
  ): Promise<GetTableSuggestionsDto> {
    return { column_classifications: await this.tableService.getColumnClassificationSuggestions(id, user.userId) };
  }

  @ExternalApi()
  @Post("/upsert/batch/external")
  async upsertBatchTablesExternal(
    @Body() tables: UpsertInternalTablesDto,
  ): Promise<UpsertTableResponseDto> {
    return this.tableService.upsertTables(tables);
  }

  @CustomerRoute(["insight"])
  @Post("/upsert/batch")
  /** @important This Endpoint is used by customers */
  async upsertBatchTables(@Body() tables: UpsertExternalTablesDto, @AuthenticatedUser() user: LoggedUser): Promise<UpsertTableResponseDto> {
    return this.tableService.upsertTablesCustomers(tables, user);
  }

  @ExternalApi()
  @Delete("/deprecate/batch/external")
  async deprecateBatchTablesExternal(@Body() tables: DeprecateTablesDto): Promise<string[]> {
    return this.tableService.deprecateTables(tables, { user_type: "internal" });
  }

  @CustomerRoute(["insight"])
  @Delete("/deprecate/batch")
  /** @important This Endpoint is used by customers */
  async deprecateBatchTables(@Body() tables: DeprecateTablesDto, @AuthenticatedUser() user: LoggedUser): Promise<string[]> {
    return this.tableService.deprecateTables(tables, { user_type: "customer", user_id: user.userId });
  }

  @ExternalApi()
  @Get("dictionary")
  async getTablesDictionary(): Promise<TablesDictionary> {
    return await this.tableService.getTablesDictionary();
  }

  @ExternalApi()
  @Get("schemas/dictionary")
  async getSchemasDictionary(): Promise<SchemasDictionary> {
    return await this.tableService.getSchemasDictionary();
  }

  @Put("/id/:id")
  @ApiParam({ name: "id", type: "string" })
  async editTableById(
    @Param("id", new ParseObjectIdPipe())
    id: ObjectId,
    @Body() data: EditTableDto,
    @AuthenticatedUser() user: LoggedUser,
  ): Promise<void> {
    return await this.tableService.editTableById(id, data.columns_dict, data.verification_stages, user);
  }

  @Get("/excel")
  async getTablesExcel(@AuthenticatedUser() user: LoggedUser, @Res() res: Response): Promise<void> {
    const tablesExcelFile = await this.tableService.getTablesExcel(user);

    res.setHeader(EXCEL_CONTENT_TYPE_HEADER.headerName, EXCEL_CONTENT_TYPE_HEADER.headerValue);
    res.setHeader(EXCEL_CONTENT_DISPOSITION.headerName, EXCEL_CONTENT_DISPOSITION.headerValue("tables.xlsb"));

    res.send(tablesExcelFile);
  }

  @ExternalApi()
  @Post("/permission-keys-status")
  async getPermissionKeysStatus(@Body() { tables }: RawStandardTablesBody) {
    return await this.tableService.getTablesPermissionKeysStatus(tables);
  }

  @ExternalApi()
  @Post("/sapTables")
  async refreshSapTables() {
    return await this.tableService.refreshSapTables();
  }
}

import { Controller, Get, Param } from "@nestjs/common";
import { MetadataService } from "./metadata.service";
import { ApiBasicAuth, ApiTags } from "@nestjs/swagger";
import { TableSchemaDef } from "./metadata.dtos";

@Controller()
@ApiBasicAuth()
@ApiTags("Metadata")
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get("catalog")
  listTables(): string[] {
    return this.metadataService.listTables();
  }

  @Get("validate/table/:tableName")
  validateTable(@Param("tableName") tableName: string): boolean {
    return this.metadataService.validateTable(tableName);
  }

  @Get(":tableName/describe")
  getTableSchema(@Param("tableName") tableName: string): TableSchemaDef[] {
    return this.metadataService.getTableSchema(tableName);
  }

  @Get(":tableName/sample")
  async getTableSample(@Param("tableName") tableName: string): Promise<unknown[]> {
    return await this.metadataService.getTableSample(tableName);
  }
}

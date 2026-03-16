import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/database/database.module";
import { TrinoModule } from "src/trino/trino.module";
import { PermissionTablesController } from "./permission_tables.controller";
import { PermissionTablesService } from "./permission_tables.service";
import { MongooseModule } from "@nestjs/mongoose";
import { PermissionTable, PermissionTableSchema } from "@port/shield-models";

@Module({
  imports: [DatabaseModule, TrinoModule, MongooseModule.forFeature([{ name: PermissionTable.name, schema: PermissionTableSchema }])],
  controllers: [PermissionTablesController],
  providers: [PermissionTablesService],
  exports: [PermissionTablesService],
})
export class PermissionTablesModule {}

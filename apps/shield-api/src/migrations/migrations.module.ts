import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PermissionTable, PermissionTableSchema, Table, TableSchema, Task, TaskSchema } from "@port/shield-models";
import { DatabaseModule } from "src/database/database.module";
import { TableModule } from "src/tables/table.module";
import MigrationsController from "./migrations.controller";

@Module({
  controllers: [MigrationsController],
  imports: [
    MongooseModule.forFeature([
      { name: Table.name, schema: TableSchema },
      { name: PermissionTable.name, schema: PermissionTableSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    DatabaseModule,
    TableModule,
  ],
})
export class MigrationsModule {}

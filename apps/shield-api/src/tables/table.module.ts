import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SapTables, SapTablesSchema, Table, TableSchema, Task, TaskSchema } from "@port/shield-models";
import { AuditingModule } from "src/auditing/auditing.module";
import { ClassificationsModule } from "src/classifications/classifications.module";
import { DomainsModule } from "src/domains/domains.module";
import { ExcelModule } from "src/excel/excel.module";
import { KafkaModule } from "src/kafka/kafka.module";
import { TasksModule } from "src/tasks/tasks.module";
import { TrinoModule } from "src/trino/trino.module";
import { DatabaseModule } from "../database/database.module";
import { TableController } from "./table.controller";
import { TableService } from "./table.service";
import { PermissionTablesModule } from "src/permission_tables/permission_tables.module";
import { UserInfoModule } from "src/user-info/user-info.module";

@Module({
  imports: [
    DatabaseModule,
    ExcelModule,
    KafkaModule,
    TrinoModule,
    DomainsModule,
    ClassificationsModule,
    TasksModule,
    AuditingModule,
    PermissionTablesModule,
    UserInfoModule,
    MongooseModule.forFeature([
      { name: Table.name, schema: TableSchema },
      { name: Task.name, schema: TaskSchema },
      { name: SapTables.name, schema: SapTablesSchema },
    ]),
  ],
  controllers: [TableController],
  providers: [TableService],
  exports: [TableService],
})
export class TableModule {}

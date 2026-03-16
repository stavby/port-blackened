import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { DatabaseModule } from "src/database/database.module";
import { AuditingModule } from "src/auditing/auditing.module";
import { DomainsModule } from "src/domains/domains.module";
import { MongooseModule } from "@nestjs/mongoose";
import { Task, TaskSchema } from "@port/shield-models";

@Module({
  imports: [DatabaseModule, AuditingModule, DomainsModule, MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

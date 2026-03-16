import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  ApplicationUser,
  ApplicationUserSchema,
  Auditing,
  AuditingSchema,
  AuditLog,
  AuditLogSchema,
  Classification,
  ClassificationSchema,
  Domain,
  DomainSchema,
  PermissionTable,
  PermissionTableSchema,
  Role,
  RoleSchema,
  Table,
  TableSchema,
  Task,
  TaskSchema,
  User,
  UserSchema,
} from "@port/shield-models";
import { DataController } from "./data.controller";
import { DataService } from "./data.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ApplicationUser.name, schema: ApplicationUserSchema },
      { name: Classification.name, schema: ClassificationSchema },
      { name: Domain.name, schema: DomainSchema },
      { name: Role.name, schema: RoleSchema },
      { name: PermissionTable.name, schema: PermissionTableSchema },
      { name: Auditing.name, schema: AuditingSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Table.name, schema: TableSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [DataController],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}

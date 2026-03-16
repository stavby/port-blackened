import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SapPermittedUsers, SapPermittedUsersSchema, Table, TableSchema, User, UserSchema } from "@port/shield-models";
import { ExcelModule } from "src/excel/excel.module";
import { PermissionTablesModule } from "src/permission_tables/permission_tables.module";
import { SecretService } from "src/secret/secret.service";
import { UserInfoModule } from "src/user-info/user-info.module";
import { DatabaseModule } from "../database/database.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { TrinoModule } from "src/trino/trino.module";
import { AuditingModule } from "src/auditing/auditing.module";
import { PermissionGroupsModule } from "src/permission_groups/permission_groups.module";
import { OPAModule } from "src/opa/opa.module";
import { TableModule } from "src/tables/table.module";

@Module({
  imports: [
    DatabaseModule,
    PermissionTablesModule,
    UserInfoModule,
    ExcelModule,
    AuditingModule,
    forwardRef(() => PermissionGroupsModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Table.name, schema: TableSchema },
      { name: SapPermittedUsers.name, schema: SapPermittedUsersSchema },
    ]),
    TrinoModule,
    OPAModule,
    TableModule,
  ],
  controllers: [UserController],
  providers: [UserService, SecretService],
  exports: [UserService],
})
export class UserModule {}

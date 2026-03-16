import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PermissionGroup, PermissionGroupSchema, User, UserSchema } from "@port/shield-models";
import { DatabaseModule } from "src/database/database.module";
import { ExcelModule } from "src/excel/excel.module";
import { PermissionGroupsController } from "./permission_groups.controller";
import { PermissionGroupsService } from "./permission_groups.service";
import { AuditingModule } from "src/auditing/auditing.module";
import { UserModule } from "src/user/user.module";
import { PermissionTablesModule } from "src/permission_tables/permission_tables.module";

@Module({
  imports: [
    DatabaseModule,
    ExcelModule,
    forwardRef(() => UserModule),
    MongooseModule.forFeature([
      { name: PermissionGroup.name, schema: PermissionGroupSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuditingModule,
    PermissionTablesModule,
  ],
  controllers: [PermissionGroupsController],
  providers: [PermissionGroupsService],
  exports: [PermissionGroupsService],
})
export class PermissionGroupsModule {}

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ApplicationUser, ApplicationUserSchema } from "@port/shield-models";
import { AuditingModule } from "src/auditing/auditing.module";
import { DomainsModule } from "src/domains/domains.module";
import { ExcelModule } from "src/excel/excel.module";
import { KafkaModule } from "src/kafka/kafka.module";
import { RolesModule } from "src/roles/roles.module";
import { UserInfoModule } from "src/user-info/user-info.module";
import { DatabaseModule } from "../database/database.module";
import { ApplicationUsersController } from "./application_users.controller";
import { ApplicationUsersService } from "./application_users.service";

@Module({
  imports: [
    DatabaseModule,
    UserInfoModule,
    ExcelModule,
    KafkaModule,
    DomainsModule,
    RolesModule,
    AuditingModule,
    MongooseModule.forFeature([{ name: ApplicationUser.name, schema: ApplicationUserSchema }]),
  ],
  controllers: [ApplicationUsersController],
  providers: [ApplicationUsersService],
  exports: [ApplicationUsersService],
})
export class ApplicationUsersModule {}

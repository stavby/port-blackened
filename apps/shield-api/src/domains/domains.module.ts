import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ApplicationUser, ApplicationUserSchema, Domain, DomainSchema } from "@port/shield-models";
import { AuditingModule } from "src/auditing/auditing.module";
import { ClassificationsModule } from "src/classifications/classifications.module";
import { ExcelModule } from "src/excel/excel.module";
import { TrinoModule } from "src/trino/trino.module";
import { DatabaseModule } from "../database/database.module";
import { DomainsController } from "./domains.controller";
import { DomainsService } from "./domains.service";

@Module({
  imports: [
    DatabaseModule,
    AuditingModule,
    TrinoModule,
    ClassificationsModule,
    ExcelModule,
    MongooseModule.forFeature([
      { name: Domain.name, schema: DomainSchema },
      { name: ApplicationUser.name, schema: ApplicationUserSchema },
    ]),
  ],
  controllers: [DomainsController],
  providers: [DomainsService],
  exports: [DomainsService],
})
export class DomainsModule {}

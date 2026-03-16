import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/database/database.module";
import AuditingService from "./auditing.service";
import { MongooseModule } from "@nestjs/mongoose";
import { AuditLog, AuditLogSchema } from "@port/shield-models";

@Module({
  imports: [DatabaseModule, MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
  providers: [AuditingService],
  exports: [AuditingService],
})
export class AuditingModule {}

import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { ClassificationsController } from "./classifications.controller";
import { ClassificationsService } from "./classifications.service";
import { ExcelModule } from "src/excel/excel.module";
import { AuditingModule } from "src/auditing/auditing.module";
import { MongooseModule } from "@nestjs/mongoose";
import { Classification, ClassificationSchema } from "@port/shield-models";

@Module({
  imports: [
    DatabaseModule,
    ExcelModule,
    AuditingModule,
    MongooseModule.forFeature([
      {
        name: Classification.name,
        schema: ClassificationSchema,
      },
    ]),
  ],
  controllers: [ClassificationsController],
  providers: [ClassificationsService],
  exports: [ClassificationsService],
})
export class ClassificationsModule {}

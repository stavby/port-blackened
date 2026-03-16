import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { RequestsController } from "./requests.controller";
import { RequestsService } from "./requests.service";

@Module({
  imports: [DatabaseModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}

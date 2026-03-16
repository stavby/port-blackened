import { Module } from "@nestjs/common";
import { MetadataService } from "./metadata.service";
import { MetadataController } from "./metadata.controller";
import { DataModule } from "../data/data.module";

@Module({
  imports: [DataModule],
  controllers: [MetadataController],
  providers: [MetadataService],
})
export class MetadataModule {}

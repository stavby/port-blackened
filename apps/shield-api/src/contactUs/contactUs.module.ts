import { Module } from "@nestjs/common";
import { ContactUsController } from "./contactUs.controller";
import { ContactUsService } from "./contactUs.service";

@Module({
  controllers: [ContactUsController],
  imports: [],
  providers: [ContactUsService],
})
export class ContactUsModule {}

import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { SecretController } from "./secret.controller";
import { SecretService } from "./secret.service";

@Module({
  imports: [DatabaseModule],
  controllers: [SecretController],
  providers: [SecretService],
})
export class SecretModule {}

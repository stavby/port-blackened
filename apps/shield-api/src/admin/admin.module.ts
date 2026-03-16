import { Module } from "@nestjs/common";
import { User, UserSchema } from "@port/shield-models";
import { OpenFgaModule } from "src/openfga/openfga.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { MongooseModule } from "@nestjs/mongoose";
import { IORedisModule } from "src/redis/ioredis.module";

@Module({
  imports: [OpenFgaModule, IORedisModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TrinoModule } from "src/trino/trino.module";
import { UserInfoController } from "./user-info.controller";
import { UserInfoService } from "./user-info.service";
import { KEYCLOAK_ADMIN_PROVIDE, keycloakAdminProvider } from "./keycloak-admin.provider";

@Module({
  imports: [ConfigModule, TrinoModule],
  providers: [keycloakAdminProvider, UserInfoService],
  controllers: [UserInfoController],
  exports: [UserInfoService, KEYCLOAK_ADMIN_PROVIDE],
})
export class UserInfoModule {}

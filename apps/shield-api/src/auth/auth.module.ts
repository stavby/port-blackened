import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { DatabaseModule } from "src/database/database.module";
import { SecretService } from "src/secret/secret.service";
import { TrinoModule } from "src/trino/trino.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OidcClientProvider } from "./oidcClient.provider";
import { DirectAccessGrantStrategy } from "./keycloak/directAccessGrant.strategy";
import { RolesModule } from "src/roles/roles.module";
import { ApplicationUsersModule } from "src/application_users/application_users.module";

@Module({
  imports: [PassportModule, DatabaseModule, TrinoModule, RolesModule, ApplicationUsersModule],
  providers: [AuthService, SecretService, OidcClientProvider, DirectAccessGrantStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

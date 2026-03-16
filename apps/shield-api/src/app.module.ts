import { MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { KeycloakConnectModule } from "nest-keycloak-connect";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { KeycloakConfigModule } from "./auth/keycloak/keycloak.config.module";
import { KeycloakConfigService } from "./auth/keycloak/keycloak.config.service";
import { OIDCGuard } from "./auth/oidc.guard";
import { BasicAuthModule } from "./basicAuth/basicAuth.module";
import { ClassificationsModule } from "./classifications/classifications.module";
import { LoggerMiddleware } from "./common/logger.middleware";
import { config } from "./config";
import { ContactUsModule } from "./contactUs/contactUs.module";
import { DomainsModule } from "./domains/domains.module";
import { MigrationsModule } from "./migrations/migrations.module";
import { PermissionTablesModule } from "./permission_tables/permission_tables.module";
import { IORedisModule } from "./redis/ioredis.module";
import { RequestsModule } from "./requests/requests.module";
import { RolesModule } from "./roles/roles.module";
import { SecretModule } from "./secret/secret.module";
import { TableModule } from "./tables/table.module";
import { TasksModule } from "./tasks/tasks.module";
import { TrinoModule } from "./trino/trino.module";
import { UserInfoModule } from "./user-info/user-info.module";
import { UserModule } from "./user/user.module";
import { OpenFgaModule } from "./openfga/openfga.module";
import { ApplicationUsersModule } from "./application_users/application_users.module";
import { PermissionGroupsModule } from "./permission_groups/permission_groups.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    // Register ConfigService as a provider
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    // Register Keycloak Connect
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [KeycloakConfigModule],
    }),
    // Register basic auth for external api
    BasicAuthModule,
    // Register app modules
    UserInfoModule,
    ApplicationUsersModule,
    RolesModule,
    AuthModule,
    ClassificationsModule,
    DomainsModule,
    RequestsModule,
    SecretModule,
    TableModule,
    TasksModule,
    TrinoModule,
    UserModule,
    TasksModule,
    PermissionTablesModule,
    ContactUsModule,
    IORedisModule,
    MigrationsModule,
    OpenFgaModule,
    PermissionGroupsModule,
    AdminModule,
    MongooseModule.forRoot(process.env.MONGODB_CONNECTION_STRING),
  ],
  controllers: [AppController],
  // register auth guard globally
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: OIDCGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}

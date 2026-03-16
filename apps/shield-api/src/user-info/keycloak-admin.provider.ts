import { InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConfigProps } from "src/config/config.interface";
import { KeycloakAdmin } from "@port/keycloak-admin";

export const KEYCLOAK_ADMIN_PROVIDE = "KEYCLOAK_ADMIN";

export const keycloakAdminProvider = {
  provide: KEYCLOAK_ADMIN_PROVIDE,
  useFactory: async (configService: ConfigService<ConfigProps>): Promise<KeycloakAdmin> => {
    try {
      const baseUrl = configService.get("keycloak.url", { infer: true });
      const realmName = configService.get("keycloak.realm", { infer: true });
      const clientId = configService.get("keycloak.clientId", { infer: true });
      const clientSecret = configService.get("keycloak.clientSecret", { infer: true });

      const keycloakAdmin = await KeycloakAdmin.build({
        baseUrl,
        realmName,
        clientId,
        clientSecret,
      });

      return keycloakAdmin;
    } catch (e) {
      throw new InternalServerErrorException(`Keycloak admin initialization failed with the following error, ${e}`);
    }
  },
  inject: [ConfigService],
};

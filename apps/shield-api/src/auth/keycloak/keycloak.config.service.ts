import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KeycloakConnectOptions, KeycloakConnectOptionsFactory, TokenValidation } from "nest-keycloak-connect";
import { ConfigProps } from "src/config/config.interface";
import { COOKIE_KEY } from "src/utils/constants";

@Injectable()
export class KeycloakConfigService implements KeycloakConnectOptionsFactory {
  constructor(private readonly configService: ConfigService<ConfigProps>) {}

  createKeycloakConnectOptions(): KeycloakConnectOptions {
    return {
      authServerUrl: this.configService.get("keycloak.url", { infer: true }),
      realm: this.configService.get("keycloak.realm", { infer: true }),
      clientId: this.configService.get("keycloak.clientId", { infer: true }),
      secret: this.configService.get("keycloak.clientSecret", { infer: true })!,
      cookieKey: COOKIE_KEY,
      tokenValidation: TokenValidation.ONLINE,
    };
  }
}

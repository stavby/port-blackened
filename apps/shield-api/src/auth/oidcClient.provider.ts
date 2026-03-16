import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Issuer } from "openid-client";
import { ConfigProps } from "src/config/config.interface";

export const OIDC_CLIENT_PROVIDER = "OidcClient";

export const OidcClientProvider: Provider = {
  provide: OIDC_CLIENT_PROVIDER,
  useFactory: async (configService: ConfigService<ConfigProps>) => {
    const issuerUrl = `${configService.get("keycloak.url", { infer: true })}/realms/${configService.get("keycloak.realm", { infer: true })}/.well-known/openid-configuration`;
    const trustIssuer = await Issuer.discover(issuerUrl);

    const client = new trustIssuer.Client({
      client_id: configService.get("keycloak.clientId", { infer: true }),
      client_secret: configService.get("keycloak.clientSecret", { infer: true }),
      redirect_uris: [configService.get("keycloak.redirectUri", { infer: true })],
    });

    return client;
  },
  inject: [ConfigService],
};

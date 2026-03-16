import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import KeycloakConnect from "keycloak-connect";
import { BaseClient } from "openid-client";
import { ConfigProps } from "src/config/config.interface";
import { OIDC_CLIENT_PROVIDER } from "./oidcClient.provider";

@Injectable()
export class AuthService {
  private readonly keycloakConnect: KeycloakConnect.Keycloak;

  constructor(
    @Inject(OIDC_CLIENT_PROVIDER) private readonly oidcClient: BaseClient,
    private readonly configService: ConfigService<ConfigProps>,
  ) {
    const authServerUrl = this.configService.get("keycloak.url", { infer: true });
    const realm = this.configService.get("keycloak.realm", { infer: true });
    const clientId = this.configService.get("keycloak.clientId", { infer: true });
    const secret = this.configService.get("keycloak.clientSecret", { infer: true });

    this.keycloakConnect = new KeycloakConnect({}, {
      "auth-server-url": authServerUrl,
      realm,
      clientId,
      secret,
    } as any);
  }

  async handleLoginCallback(req: Request) {
    const params = this.oidcClient.callbackParams(req as any);
    const keycloakRedirectUri = this.configService.get("keycloak.redirectUri", { infer: true });
    const { access_token, expires_in } = await this.oidcClient.callback(keycloakRedirectUri, params, { state: params.state });

    const redirectTo = params.state;
    const clientHost = this.configService.get("clientHost", { infer: true });
    const redirectUrl = redirectTo ? `${clientHost}/${redirectTo}` : clientHost;

    return { access_token, expires_in, redirectUrl };
  }

  async directAccessGrant(username: string, password: string) {
    return await this.keycloakConnect.grantManager.obtainDirectly(username, password);
  }
}

import { ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { userIdSchema } from "@port/common-schemas";
import retry from "async-retry";
import KeycloakConnect from "keycloak-connect";
import { AuthGuard, KeycloakConnectConfig, KeycloakMultiTenantService, META_UNPROTECTED } from "nest-keycloak-connect";
import { KeycloakAuthenticatedUser, LoggedUser } from "./auth.interface";

/**
 * @Public from nest-keycloak-connect - request has no user
 * @Default request has user of type {LoggedUser}
 * @throws {UnauthorizedException} when access_token is missing or invalid
 */
@Injectable()
export class OIDCGuard extends AuthGuard {
  constructor(
    singleTenant: KeycloakConnect.Keycloak,
    keycloakOpts: KeycloakConnectConfig,
    logger: Logger,
    multiTenant: KeycloakMultiTenantService,
    reflector: Reflector,
    private readonly childReflector: Reflector,
  ) {
    super(singleTenant, keycloakOpts, logger, multiTenant, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOidcUnprotected = this.childReflector.getAllAndOverride<boolean>(META_UNPROTECTED, [context.getClass(), context.getHandler()]);

    if (isOidcUnprotected) return true;

    await retry(
      async (bail) => {
        try {
          // keycloak level auth
          const result = await super.canActivate(context);

          if (!result) {
            bail(new UnauthorizedException("Failed to authenticate with Keycloak"));
          }
        } catch (error) {
          if (error instanceof UnauthorizedException) {
            bail(error);
          } else {
            throw error;
          }
        }
      },
      { retries: 3 },
    );

    const request = context.switchToHttp().getRequest();
    const user: KeycloakAuthenticatedUser = request.user;
    const userId = userIdSchema.parse(user.preferred_username);

    const formattedKeycloakUser: LoggedUser = {
      userId,
      preferredUsername: user.preferred_username,
      displayName: user.name,
      email: user.email,
    };

    request.user = formattedKeycloakUser;

    return true;
  }
}

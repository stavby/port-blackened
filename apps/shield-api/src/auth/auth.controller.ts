import { Controller, Get, Inject, InternalServerErrorException, Logger, Post, Query, Redirect, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { Grant } from "keycloak-connect";
import { AuthenticatedUser, Public as OIDCPublic } from "nest-keycloak-connect";
import { BaseClient } from "openid-client";
import { COOKIE_KEY, DEFAULT_JWT_EXPIRES_IN_MS } from "src/utils/constants";
import { LoggedUser } from "./auth.interface";
import { AuthService } from "./auth.service";
import { DirectAccessGrantGuard } from "./keycloak/directAccessGrant.guard";
import { OIDC_CLIENT_PROVIDER } from "./oidcClient.provider";
import { ApplicationUsersService } from "src/application_users/application_users.service";
import { ZGetLoggedUserInfoDto, ZGetLoggedUserPermissionsDisplayDto } from "src/application_users/application_users.classes";
import { ApiTags } from "@nestjs/swagger";

@Controller()
@ApiTags("Authentication")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject(OIDC_CLIENT_PROVIDER) private readonly oidcClient: BaseClient,
    private readonly authService: AuthService,
    private readonly applicationUsersService: ApplicationUsersService,
  ) {}

  @OIDCPublic()
  @Redirect()
  @Get("auth/login")
  login(
    @Query("redirectTo")
    redirectTo?: string,
  ) {
    const url = this.oidcClient.authorizationUrl({ scope: "openid profile email", state: redirectTo });
    return { url };
  }

  @OIDCPublic()
  @UseGuards(new DirectAccessGrantGuard())
  @Post("auth/login/direct")
  async directAccessGrant(@AuthenticatedUser() grant: Grant) {
    if (!grant.access_token || !("token" in grant.access_token) || typeof grant.access_token.token !== "string") {
      throw new InternalServerErrorException("Failed to obtain access token using direct access grant");
    }

    return grant.access_token.token;
  }

  @OIDCPublic()
  @Get("auth/callback")
  async loginCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { access_token, expires_in, redirectUrl } = await this.authService.handleLoginCallback(req);

    res.cookie(COOKIE_KEY, access_token, {
      maxAge: expires_in ? (expires_in - 10) * 1000 : DEFAULT_JWT_EXPIRES_IN_MS,
      httpOnly: true,
    });

    res.redirect(redirectUrl);
  }

  @Get("userInfo")
  async getUserInfo(@AuthenticatedUser() user: LoggedUser): Promise<ZGetLoggedUserInfoDto> {
    const { roleNames, isAdmin } = await this.applicationUsersService.getLoggedUserPermissions(user.userId);

    return {
      userId: user.userId,
      fullName: user.displayName,
      roleNames,
      isAdmin,
    };
  }

  @Get("userInfoDisplay")
  async getLoggedUserPermissionsDisplay(@AuthenticatedUser() user: LoggedUser): Promise<ZGetLoggedUserPermissionsDisplayDto> {
    return await this.applicationUsersService.getLoggedUserPermissionsDisplay(user);
  }
}

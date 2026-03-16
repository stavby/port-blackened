import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Grant } from "keycloak-connect";
import { BasicStrategy as Strategy } from "passport-http";
import { AuthService } from "../auth.service";

export const DIRECT_ACCESS_GRANT_STRATEGY_NAME = "direct-access-grant";

@Injectable()
export class DirectAccessGrantStrategy extends PassportStrategy(Strategy, DIRECT_ACCESS_GRANT_STRATEGY_NAME) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<Grant> {
    return await this.authService.directAccessGrant(username, password);
  }
}

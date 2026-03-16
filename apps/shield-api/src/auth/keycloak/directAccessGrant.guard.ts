import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DIRECT_ACCESS_GRANT_STRATEGY_NAME } from "./directAccessGrant.strategy";

/**
 * @Default request has user of type {Grant}
 * @throws {UnauthorizedException}
 */
@Injectable()
export class DirectAccessGrantGuard extends AuthGuard(DIRECT_ACCESS_GRANT_STRATEGY_NAME) {}

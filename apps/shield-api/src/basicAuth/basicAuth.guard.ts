import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * @Default request has user of type {BasicAuthenticatedUser}
 * @throws {UnauthorizedException}
 */
@Injectable()
export class BasicAuthGuard extends AuthGuard("basic") {}

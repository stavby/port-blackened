import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { formatFGAObjectId, PLATFORM_FGA_INSTANCE } from "@port/openfga-client";
import { OpenFgaService } from "../../openfga/openfga.service";
import { LoggedUser } from "src/auth/auth.interface";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private openFgaService: OpenFgaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    if (!req.user) {
      throw new UnauthorizedException("User not authenticated");
    }

    const user: LoggedUser = req.user;

    const checkedRole = await this.openFgaService.check({
      user: formatFGAObjectId({ type: "user", id: user.userId }),
      relation: "admin",
      object: PLATFORM_FGA_INSTANCE,
    });

    if (checkedRole.allowed) {
      return true;
    }

    throw new ForbiddenException(`User ${user.userId} is not admin`);
  }
}

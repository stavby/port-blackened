import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { env } from "src/config/env";

@Injectable()
export class BasicAuthGuard extends AuthGuard("basic") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (env.NODE_ENV === "dev" || isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}

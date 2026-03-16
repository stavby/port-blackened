import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { trace } from "@opentelemetry/api";
import { ATTR_USER_ID, ATTR_USER_FULL_NAME } from "@port/utils";
import { BasicAuthenticatedUser, LoggedUser } from "src/auth/auth.interface";

@Injectable()
export class OtelInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<unknown>) {
    const request = context.switchToHttp().getRequest();
    const span = trace.getActiveSpan();

    if (request.user && span) {
      const user = request.user as LoggedUser | BasicAuthenticatedUser;

      span.setAttribute(ATTR_USER_ID, user.userId);

      if ("displayName" in user) {
        span.setAttribute(ATTR_USER_FULL_NAME, user.displayName);
      }
    }

    return next.handle();
  }
}

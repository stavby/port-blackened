import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from "@nestjs/common";
import { Observable } from "rxjs";
import { FORM_DATA_JSON_BODY } from "./constants";

@Injectable()
export class FormDataParseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    if (!request.body[FORM_DATA_JSON_BODY]) {
      request.body = {};
      return next.handle();
    }

    try {
      request.body = JSON.parse(request.body[FORM_DATA_JSON_BODY]);
    } catch (err) {
      throw new BadRequestException((err as Error)?.message, { cause: err });
    }

    return next.handle();
  }
}

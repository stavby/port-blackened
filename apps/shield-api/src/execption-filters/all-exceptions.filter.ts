import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import { AbstractHttpAdapter } from "@nestjs/core";
import { ExtractDataFromError } from "./extract-data-from-error";
import { ZodError } from "zod";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: AbstractHttpAdapter) {}

  catch(exception: any, host: ArgumentsHost) {
    const httpAdapter = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const response: unknown = exception?.getResponse?.();

    // zod error
    if ("error" in exception && exception.error instanceof ZodError) {
      exception.cause = exception.error;
    }

    const { httpStatus, error } = ExtractDataFromError.extractDataFromError(exception);

    // class validator
    if (httpStatus === HttpStatus.BAD_REQUEST) {
      if (typeof response === "object" && response !== null && "message" in response) {
        exception.cause = response.message;
      }
    }

    this.logger.error(exception);

    const responseBody = {
      timeStamp: new Date().toISOString(),
      statusCode: httpStatus,
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message: typeof error === "object" && error.message ? error.message : error,
      error: error.errors,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}

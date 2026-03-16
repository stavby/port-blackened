import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger: Logger = new Logger("SHIELD");

  use(req: Request, res: Response, next: NextFunction) {
    const { originalUrl, method, hostname, ip } = req;

    res.on("finish", () => {
      const { statusCode } = res;
      const userString = req.user?.userId || "--unknown--";
      const text = `[${hostname} - ${ip}] - [${method}][${statusCode}] - [${userString}] - [${originalUrl}]`;
      if (400 <= statusCode && statusCode < 600) {
        this.logger.error(text);
      } else {
        this.logger.log(text);
      }
    });
    next();
  }
}

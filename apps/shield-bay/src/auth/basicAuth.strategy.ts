import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { BasicStrategy as Strategy } from "passport-http";
import { env } from "src/config/env";

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      passReqToCallback: true,
    });
  }

  async validate(req: Request, username: string, password: string): Promise<boolean> {
    if (env.BASIC_AUTH_USER === username && env.BASIC_AUTH_PASSWORD === password) {
      return true;
    }

    throw new UnauthorizedException("Incorrect credentials for basic auth");
  }
}

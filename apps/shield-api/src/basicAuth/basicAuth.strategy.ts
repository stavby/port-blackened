import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { UserID } from "@port/common-schemas";
import { Request } from "express";
import { BasicStrategy as Strategy } from "passport-http";
import { BasicAuthenticatedUser } from "src/auth/auth.interface";
import { ConfigProps } from "src/config/config.interface";

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService<ConfigProps>) {
    super({
      passReqToCallback: true,
    });
  }

  async validate(req: Request, username: string, password: string): Promise<BasicAuthenticatedUser> {
    const externalApiUser = this.configService.get("externalApi.username", { infer: true });
    const externalApiPassword = this.configService.get("externalApi.password", { infer: true });

    if (externalApiUser === username && externalApiPassword === password) {
      return { userId: username as UserID } satisfies BasicAuthenticatedUser;
    }

    throw new UnauthorizedException("Incorrect credentials for basic auth");
  }
}

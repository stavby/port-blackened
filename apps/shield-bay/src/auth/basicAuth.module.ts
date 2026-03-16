import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { BasicStrategy } from "./basicAuth.strategy";
import { APP_GUARD } from "@nestjs/core";
import { BasicAuthGuard } from "./basicAuth.guard";

@Module({
  imports: [PassportModule],
  providers: [BasicStrategy, { provide: APP_GUARD, useClass: BasicAuthGuard }],
})
export class BasicAuthModule {}

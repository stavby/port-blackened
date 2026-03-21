import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BasicAuth, Trino } from "trino-client";
import { TrinoController } from "./trino.controller";
import { TrinoService } from "./trino.service";
import { readServerFile } from "@port/server-files";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "TRINO",
      useFactory: async (configService: ConfigService) => {
        const trino = Trino.create({
          server: configService.get<string>("trino.server"),
          source: "shield",
          catalog: configService.get<string>("trino.catalog"),
          schema: configService.get<string>("trino.schema"),
          // BLACKEND
          // auth: new BasicAuth(configService.get<string>("trino.user"), configService.get<string>("trino.password")),
          // ssl: { rejectUnauthorized: true, ca: [readServerFile("")] },
          auth: new BasicAuth(configService.get<string>("trino.user")),
          ssl: { rejectUnauthorized: false },
        });
        Logger.log("Connecting to Trino...");
        return trino;
      },
      inject: [ConfigService],
    },
    TrinoService,
  ],
  controllers: [TrinoController],
  exports: [TrinoService],
})
export class TrinoModule {}

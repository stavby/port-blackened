import { HttpException, HttpStatus, Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { ConfigProps } from "src/config/config.interface";
import { DATABASE_CONNECTION_TOKEN } from "./db-connections";

@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION_TOKEN,
      useFactory: async (configService: ConfigService<ConfigProps>) => {
        try {
          Logger.log("Connecting to PostgreSQL...");

          return drizzle(configService.get("postgres.connectionString", { infer: true })!);
        } catch (error) {
          throw new HttpException(`PostgreSQL connection error`, HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION_TOKEN],
})
export class DbModule {}

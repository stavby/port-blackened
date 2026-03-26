import { HttpException, HttpStatus, Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { ConfigProps } from "src/config/config.interface";
import { DATABASE_CONNECTION_TOKEN } from "./db-connections";
import * as schemas from "./schemas";

export type DrizzleConnection = ReturnType<typeof drizzle<typeof schemas>>;

@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION_TOKEN,
      useFactory: async (configService: ConfigService<ConfigProps>): Promise<DrizzleConnection> => {
        try {
          Logger.log("Connecting to PostgreSQL...");
          const connectionString = configService.get("postgres.connectionString", { infer: true })!;
          return drizzle(connectionString, { schema: schemas });
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

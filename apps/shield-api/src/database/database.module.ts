import { HttpException, HttpStatus, Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Db, MongoClient } from "mongodb";
import { DB_CONNECTION_PROVIDER } from "src/utils/constants";

@Module({
  providers: [
    {
      provide: DB_CONNECTION_PROVIDER,
      useFactory: async (configService: ConfigService): Promise<Db> => {
        try {
          Logger.log("Connecting to MongoDB...");

          const connectionString = configService.get<string>("mongodb.connectionString");
          const client = await MongoClient.connect(connectionString);
          // BLACKEND
          // return client.db("shield-db");
          return client.db("shield");
        } catch (e) {
          throw new HttpException(`MongoDB connection error`, HttpStatus.INTERNAL_SERVER_ERROR, { cause: e });
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [DB_CONNECTION_PROVIDER],
})
export class DatabaseModule {}

import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AppController } from "./app.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { env } from "src/config/env";
import { LoggerMiddleware } from "./common/logger.middleware";
import { BasicAuthModule } from "./auth/basicAuth.module";
import { DataModule } from "./data/data.module";
import { MetadataModule } from "./metadata/metadata.module";

@Module({
  imports: [MongooseModule.forRoot(env.MONGODB_CONNECTION_STRING), BasicAuthModule, DataModule, MetadataModule],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}

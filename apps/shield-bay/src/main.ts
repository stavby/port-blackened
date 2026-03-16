import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { SchemaObjectFactory } from "@nestjs/swagger/dist/services/schema-object-factory";
import { AppModule } from "./app.module";
import { patchNestJsSwagger, ZodValidationPipe } from "nestjs-zod";
import { patchOpenApiSpecDocument } from "./config/open-api";
import { WinstonModule } from "nest-winston";
import { logger } from "@port/logger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: WinstonModule.createLogger({ instance: logger }) });

  app.enableCors({ credentials: true, origin: true });
  app.useGlobalPipes(new ZodValidationPipe());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patchNestJsSwagger(SchemaObjectFactory as any);
  const swaggerConfig = new DocumentBuilder().setTitle("Shield Bay").setDescription("Shield-Bay's Swagger").addBasicAuth().build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup("/docs", app, swaggerDocument, {
    jsonDocumentUrl: "/default-spec",
  });

  // Patched spec for trino OpenApi connector
  SwaggerModule.setup("/docs-trino", app, swaggerDocument, {
    jsonDocumentUrl: "/spec",
    patchDocumentOnRequest: patchOpenApiSpecDocument,
  });

  await app.listen(3000);
}
bootstrap();

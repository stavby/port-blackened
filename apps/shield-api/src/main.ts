import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { SchemaObjectFactory } from "@nestjs/swagger/dist/services/schema-object-factory";
import cookieParser from "cookie-parser";
import { json, urlencoded } from "express";
import { patchNestJsSwagger } from "nestjs-zod";
import { AppModule } from "./app.module";
import { WinstonModule } from "nest-winston";
import { logger } from "@port/logger";
import { AllExceptionsFilter } from "./execption-filters";
import { CustomValidationPipe } from "./utils/validation/validation.pipe";
import { OtelInterceptor } from "./common/otel.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false, logger: WinstonModule.createLogger({ instance: logger }) });

  // Set global prefix for ingress
  app.setGlobalPrefix("data");

  // Set global exceptions handler
  const { httpAdapter } = app.get(HttpAdapterHost);
  const configService = app.get(ConfigService);

  // Important: registration order matters, last filter runs first. The order should be from least to most specific
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // Cookie parser middleware
  app.use(cookieParser());

  // Config body parser size limit
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ limit: "50mb", extended: true }));

  // Cors
  app.enableCors({
    credentials: true,
    origin: true,
    allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers", "client-redirect-url"],
  });

  // Register global validation pipe
  app.useGlobalPipes(new CustomValidationPipe({ transform: true, whitelist: true }));

  app.useGlobalInterceptors(new OtelInterceptor());

  // Patch NestJS Swagger for nestjs-zod custom schema object factory
  patchNestJsSwagger(SchemaObjectFactory as any);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("Shield")
    .setDescription("The shield API description")
    .setExternalDoc("Postman Collection", "/data/api-json")
    .setVersion("1.0")
    .addBasicAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("/api", app, document, { useGlobalPrefix: true });

  const port = configService.get("port", { infer: true })!;

  await app.listen(port);
}
bootstrap();

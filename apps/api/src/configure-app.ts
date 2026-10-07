import { BadRequestException, INestApplication, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ApiExceptionFilter } from "./common/api-exception.filter";
import { attachResponseContracts } from "./common/swagger-contracts";
export function configureApp(app: INestApplication) {
  app.enableCors({
    origin: process.env.API_CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
      exceptionFactory: (errors) => {
        // Never retain rejected input in validation responses.
        return new BadRequestException({
          code: "VALIDATION_ERROR",
          fields: errors.map((error) => ({
            field: error.property,
            rules: Object.keys(error.constraints ?? {}),
          })),
        });
      },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  const config = new DocumentBuilder()
    .setTitle("TalkyTown API")
    .setDescription("Phase 4 Mock-only functional backend.")
    .setVersion("0.4.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  attachResponseContracts(document);
  SwaggerModule.setup("docs", app, document);
  return document;
}

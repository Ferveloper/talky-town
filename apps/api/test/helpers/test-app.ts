import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { configureApp } from "../../src/configure-app";
import { memoryPrisma } from "./memory-prisma";
import { ConfigService } from "@nestjs/config";
import { OpenAiCompatibleTransport } from "@talkytown/ai-core";
import { AI_RUNTIME_POLICY, type AiRuntimePolicy } from "../../src/config/ai-runtime-policy";
export async function testApp(
  options: {
    policy?: AiRuntimePolicy;
    transport?: OpenAiCompatibleTransport;
    config?: Record<string, string>;
  } = {},
) {
  const memory = memoryPrisma();
  const builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(memory.db);
  if (options.policy) builder.overrideProvider(AI_RUNTIME_POLICY).useValue(options.policy);
  if (options.transport)
    builder.overrideProvider(OpenAiCompatibleTransport).useValue(options.transport);
  if (options.config)
    builder.overrideProvider(ConfigService).useValue(
      new ConfigService({
        _PROCESS_ENV_VALIDATED: {
          JWT_SECRET: "talkytown-deterministic-test-secret-32-characters",
          DEMO_AUTH_ENABLED: "true",
          ...options.config,
        },
      }),
    );
  const module = await builder.compile();
  const app = module.createNestApplication();
  const swagger = configureApp(app);
  await app.init();
  return { app, swagger, ...memory };
}

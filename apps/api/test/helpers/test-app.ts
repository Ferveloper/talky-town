import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { configureApp } from "../../src/configure-app";
import { memoryPrisma } from "./memory-prisma";
export async function testApp() {
  const memory = memoryPrisma();
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(memory.db)
    .compile();
  const app = module.createNestApplication();
  const swagger = configureApp(app);
  await app.init();
  return { app, swagger, ...memory };
}

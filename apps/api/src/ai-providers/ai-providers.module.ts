import { Module } from "@nestjs/common";
import { MockAiProvider } from "@talkytown/ai-core";
import { AiProvidersService } from "./ai-providers.service";
import { AiProvidersController } from "./ai-providers.controller";
@Module({
  controllers: [AiProvidersController],
  providers: [MockAiProvider, AiProvidersService],
  exports: [AiProvidersService],
})
export class AiProvidersModule {}

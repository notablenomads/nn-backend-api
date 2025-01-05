import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';
import { AiChatModule } from './ai-chat/ai-chat.module';

@Module({
  imports: [CoreModule, HealthModule, AiChatModule],
  controllers: [AppController],
})
export class AppModule {}

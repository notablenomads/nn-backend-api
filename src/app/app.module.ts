import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [CoreModule, HealthModule, AiChatModule, EmailModule],
  controllers: [AppController],
})
export class AppModule {}

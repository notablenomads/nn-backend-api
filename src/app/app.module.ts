import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';
import { EmailModule } from './email/email.module';
import { BlogModule } from './blog/blog.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { ConnectionSecurityModule } from './connection-security/connection-security.module';

@Module({
  imports: [CoreModule, HealthModule, EmailModule, BlogModule, AiChatModule, ConnectionSecurityModule],
})
export class AppModule {}

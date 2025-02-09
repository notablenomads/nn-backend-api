import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { EmailModule } from './email/email.module';
import { BlogModule } from './blog/blog.module';
import { LeadModule } from './lead/lead.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

const modules = [AiChatModule, EmailModule, BlogModule, LeadModule, UserModule, AuthModule];

@Module({
  imports: [CoreModule, HealthModule, ...modules],
  controllers: [AppController],
})
export class AppModule {}

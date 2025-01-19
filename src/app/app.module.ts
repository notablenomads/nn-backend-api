import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { EmailModule } from './email/email.module';
import { BlogModule } from './blog/blog.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { ConnectionSecurityModule } from './connection-security/connection-security.module';
import configuration from './config/configuration';
import { validationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    HealthModule,
    EmailModule,
    BlogModule,
    AiChatModule,
    ConnectionSecurityModule,
  ],
})
export class AppModule {}

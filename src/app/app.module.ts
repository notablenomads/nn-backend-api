import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { EmailModule } from './email/email.module';
import { BlogModule } from './blog/blog.module';
import { LeadModule } from './lead/lead.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { SecurityMiddleware } from './core/middleware/security.middleware';
import { RequestSizeMiddleware } from './core/middleware/request-size.middleware';

const modules = [AiChatModule, EmailModule, BlogModule, LeadModule, UserModule, AuthModule];

@Module({
  imports: [CoreModule, HealthModule, ...modules],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware, RequestSizeMiddleware).forRoutes('*');
  }
}

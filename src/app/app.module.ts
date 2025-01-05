import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';
import { AiChatModule } from './ai-chat/ai-chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CoreModule,
    HealthModule,
    AiChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

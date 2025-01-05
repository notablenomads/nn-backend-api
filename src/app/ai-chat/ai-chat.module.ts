import { Module } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { AiChatGateway } from './ai-chat.gateway';
import { AiChatController } from './ai-chat.controller';

@Module({
  imports: [],
  providers: [AiChatService, AiChatGateway],
  controllers: [AiChatController],
  exports: [AiChatService],
})
export class AiChatModule {}

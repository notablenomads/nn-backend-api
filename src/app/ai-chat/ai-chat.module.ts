import { Module } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { AiChatGateway } from './ai-chat.gateway';

@Module({
  providers: [AiChatService, AiChatGateway],
  exports: [AiChatService],
})
export class AiChatModule {}

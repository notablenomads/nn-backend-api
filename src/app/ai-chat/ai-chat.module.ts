import { Module } from '@nestjs/common';
import { AiChatGateway } from './ai-chat.gateway';
import { AiChatService } from './ai-chat.service';

@Module({
  providers: [AiChatGateway, AiChatService],
})
export class AiChatModule {}

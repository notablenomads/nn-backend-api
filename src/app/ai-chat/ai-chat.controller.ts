import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiChatService } from './ai-chat.service';
import { ChatMessageDto } from './interfaces/chat.interface';

@ApiTags('AI Chat')
@Controller('ai-chat')
export class AiChatController {
  private readonly logger = new Logger(AiChatController.name);
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('message')
  @ApiOperation({ summary: 'Send a message to the AI chat' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendMessage(@Body() chatMessageDto: ChatMessageDto) {
    try {
      const response = await this.aiChatService.generateResponse(chatMessageDto.message, chatMessageDto.chatHistory);
      return { response, success: true };
    } catch (error) {
      this.logger.error(`Failed to generate response: ${error.message}`, error.stack);
      throw new HttpException('Failed to generate response', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

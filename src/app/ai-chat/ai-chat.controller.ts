import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Controller, Post, Body, HttpException, HttpStatus, Logger, Sse } from '@nestjs/common';
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

  @Sse('stream')
  @ApiOperation({ summary: 'Start a streaming chat session with AI' })
  @ApiResponse({ status: 200, description: 'Stream started successfully' })
  streamResponse(@Body() chatMessageDto: ChatMessageDto): Observable<MessageEvent> {
    try {
      return this.aiChatService.streamResponse(chatMessageDto.message, chatMessageDto.chatHistory).pipe(
        map(
          (chunk) =>
            ({
              data: {
                response: chunk,
                success: true,
              },
            }) as MessageEvent,
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to start stream: ${error.message}`, error.stack);
      throw new HttpException('Failed to start stream', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

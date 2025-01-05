import { Server, Socket } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { IChatPayload } from './interfaces/chat.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class AiChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AiChatGateway.name);
  @WebSocketServer() server: Server;

  constructor(private readonly aiChatService: AiChatService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: IChatPayload) {
    try {
      const response = await this.aiChatService.generateResponse(payload.message, payload.chatHistory);
      this.server.to(client.id).emit('messageResponse', {
        response,
        success: true,
      });
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`, error.stack);
      this.server.to(client.id).emit('messageResponse', {
        error: 'Failed to generate response',
        success: false,
      });
    }
  }

  @SubscribeMessage('startStream')
  async handleStreamStart(client: Socket, payload: IChatPayload) {
    try {
      const response = await this.aiChatService.streamResponse(payload.message, payload.chatHistory);
      this.server.to(client.id).emit('streamResponse', {
        response: response.text(),
        success: true,
      });
    } catch (error) {
      this.logger.error(`Error handling stream: ${error.message}`, error.stack);
      this.server.to(client.id).emit('streamResponse', {
        error: 'Failed to generate stream response',
        success: false,
      });
    }
  }
}

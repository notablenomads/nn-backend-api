import { Server, Socket } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiChatService } from './ai-chat.service';
import { IChatPayload } from './interfaces/chat.interface';
import {
  IStreamChunkResponse,
  IStreamErrorResponse,
  IStreamCompleteResponse,
  StreamEventType,
} from './interfaces/stream.interface';
import { CorsService } from '../core/services/cors.service';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const corsService = new CorsService(new ConfigService());
      return corsService.createOriginValidator()(origin, callback);
    },
    credentials: true,
  },
  namespace: 'chat',
})
export class AiChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AiChatGateway.name);
  @WebSocketServer() server: Server;

  constructor(
    private readonly aiChatService: AiChatService,
    private readonly corsService: CorsService,
  ) {}

  async handleConnection(client: Socket) {
    const origin = client.handshake.headers.origin;
    const validation = this.corsService.validateOrigin(origin);

    if (!validation.isAllowed) {
      this.logger.warn(`Rejected connection: ${validation.error}`);
      client.disconnect();
      return;
    }

    const corsStatus = this.corsService.getStatus();
    const statusMessage = corsStatus.isRestricted ? '(CORS restricted)' : '(CORS unrestricted)';
    this.logger.log(`Client connected: ${client.id} from ${origin || 'unknown origin'} ${statusMessage}`);
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
  handleStreamStart(client: Socket, payload: IChatPayload) {
    const stream = this.aiChatService.streamResponse(payload.message, payload.chatHistory);

    stream.subscribe({
      next: (chunk) => {
        const response: IStreamChunkResponse = {
          chunk,
          success: true,
        };
        this.server.to(client.id).emit(StreamEventType.CHUNK, response);
      },
      error: (error) => {
        this.logger.error(`Error handling stream: ${error.message}`, error.stack);
        const response: IStreamErrorResponse = {
          error: 'Failed to generate stream response',
          success: false,
        };
        this.server.to(client.id).emit(StreamEventType.ERROR, response);
      },
      complete: () => {
        const response: IStreamCompleteResponse = {
          success: true,
        };
        this.server.to(client.id).emit(StreamEventType.COMPLETE, response);
      },
    });
  }
}

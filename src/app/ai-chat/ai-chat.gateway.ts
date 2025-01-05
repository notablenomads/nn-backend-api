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
import { IConfig } from '../config/config.interface';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const config = new ConfigService();
      const corsRestrict = config.get<boolean>('app.corsRestrict');

      // If CORS restrictions are disabled, allow all origins
      if (!corsRestrict) {
        callback(null, true);
        return;
      }

      // CORS restrictions are enabled - check against allowed domains
      const allowedDomains = config.get<IConfig['app']['corsEnabledDomains']>('app.corsEnabledDomains');

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        const originDomain = new URL(origin).hostname;
        const isAllowed = allowedDomains.some((domain) => {
          if (domain.startsWith('*.')) {
            const baseDomain = domain.slice(2); // Remove *. from the start
            return originDomain === baseDomain || originDomain.endsWith('.' + baseDomain);
          }
          return originDomain === domain;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } catch {
        callback(new Error('Invalid origin'));
      }
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
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    const origin = client.handshake.headers.origin;
    const corsRestrict = this.configService.get<boolean>('app.corsRestrict');

    // If CORS restrictions are disabled, allow all connections
    if (!corsRestrict) {
      this.logger.log(`Client connected: ${client.id} from ${origin || 'unknown origin'} (CORS restrictions disabled)`);
      return;
    }

    // CORS restrictions are enabled - check against allowed domains
    const allowedDomains = this.configService.get<IConfig['app']['corsEnabledDomains']>('app.corsEnabledDomains');

    if (origin) {
      try {
        const originDomain = new URL(origin).hostname;
        const isAllowed = allowedDomains.some((domain) => {
          if (domain.startsWith('*.')) {
            const baseDomain = domain.slice(2);
            return originDomain === baseDomain || originDomain.endsWith('.' + baseDomain);
          }
          return originDomain === domain;
        });

        if (!isAllowed) {
          this.logger.warn(`Rejected connection from unauthorized domain: ${origin}`);
          client.disconnect();
          return;
        }
      } catch (error) {
        this.logger.error(`Invalid origin: ${origin}`, error);
        client.disconnect();
        return;
      }
    }

    this.logger.log(`Client connected: ${client.id} from ${origin || 'unknown origin'}`);
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

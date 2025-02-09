import { Server, Socket } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
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
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  },
  namespace: 'chat',
  transports: ['websocket'],
  path: '/socket.io/',
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: {
    name: 'io',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  },
})
export class AiChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(AiChatGateway.name);
  @WebSocketServer() server: Server;

  constructor(
    private readonly aiChatService: AiChatService,
    private readonly corsService: CorsService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Add middleware for additional security
    server.use((socket: Socket, next) => {
      const origin = socket.handshake.headers.origin;
      if (!origin) {
        return next(new Error('Origin not allowed'));
      }
      next();
    });
  }

  async handleConnection(client: Socket) {
    try {
      const origin = client.handshake.headers.origin;
      const validation = this.corsService.validateOrigin(origin);

      if (!validation.isAllowed) {
        this.logger.warn(`Rejected connection from ${origin}: ${validation.error}`);
        client.disconnect();
        return;
      }

      const corsStatus = this.corsService.getStatus();
      const statusMessage = corsStatus.isRestricted ? '(CORS restricted)' : '(CORS unrestricted)';
      this.logger.log(`Client connected: ${client.id} from ${origin} ${statusMessage}`);

      // Send initial connection status
      client.emit('connection_status', {
        status: 'connected',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: IChatPayload) {
    try {
      if (!payload?.message) {
        throw new Error('Message is required');
      }

      const response = await this.aiChatService.generateResponse(payload.message, payload.chatHistory);
      this.server.to(client.id).emit('messageResponse', {
        response,
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`, error.stack);
      this.server.to(client.id).emit('messageResponse', {
        error: 'Failed to generate response',
        success: false,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('startStream')
  handleStreamStart(client: Socket, payload: IChatPayload) {
    if (!payload?.message) {
      const response: IStreamErrorResponse = {
        error: 'Message is required',
        success: false,
        timestamp: new Date().toISOString(),
      };
      this.server.to(client.id).emit(StreamEventType.ERROR, response);
      return;
    }

    const stream = this.aiChatService.streamResponse(payload.message, payload.chatHistory);

    stream.subscribe({
      next: (chunk) => {
        const response: IStreamChunkResponse = {
          chunk,
          success: true,
          timestamp: new Date().toISOString(),
        };
        this.server.to(client.id).emit(StreamEventType.CHUNK, response);
      },
      error: (error) => {
        this.logger.error(`Error handling stream: ${error.message}`, error.stack);
        const response: IStreamErrorResponse = {
          error: 'Failed to generate stream response',
          success: false,
          timestamp: new Date().toISOString(),
        };
        this.server.to(client.id).emit(StreamEventType.ERROR, response);
      },
      complete: () => {
        const response: IStreamCompleteResponse = {
          success: true,
          timestamp: new Date().toISOString(),
        };
        this.server.to(client.id).emit(StreamEventType.COMPLETE, response);
      },
    });
  }
}

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig, Content } from '@google/generative-ai';
import { Observable } from 'rxjs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IChatMessage } from './interfaces/chat.interface';
import { IConfig } from '../config/config.interface';
import { ERRORS } from '../core/errors/errors';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private model: GenerativeModel;
  private readonly generationConfig: GenerationConfig = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  };

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<IConfig['ai']['geminiApiKey']>('ai.geminiApiKey');

    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY is required');
    }

    this.logger.log('Initializing Gemini AI with API key');
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      this.model = genAI.getGenerativeModel({
        model: 'tunedModels/notablenomadv11-kdwedlxam0zp',
      });
      this.logger.log('Gemini AI model initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Gemini AI model: ${error.message}`, error.stack);
      throw error;
    }
  }

  private convertToGeminiHistory(chatHistory: IChatMessage[] = []): Content[] {
    this.logger.debug(`Converting chat history: ${JSON.stringify(chatHistory)}`);
    return chatHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));
  }

  async generateResponse(prompt: string, chatHistory: IChatMessage[] = []) {
    this.logger.log(`Generating response for prompt: ${prompt}`);
    this.logger.debug(`Chat history length: ${chatHistory.length}`);

    try {
      const chat = this.model.startChat({
        history: this.convertToGeminiHistory(chatHistory),
        generationConfig: this.generationConfig,
      });

      this.logger.debug('Chat started, sending message...');
      const result = await chat.sendMessage([{ text: prompt }]);
      const response = await result.response;
      const text = response.text();

      this.logger.log(`Generated response length: ${text.length}`);
      this.logger.debug(`Response preview: ${text.substring(0, 100)}...`);

      return text;
    } catch (error) {
      this.logger.error(`Failed to generate response: ${error.message}`, error.stack);
      throw ERRORS.CHAT.PROCESSING.MESSAGE_FAILED({ reason: error.message });
    }
  }

  streamResponse(prompt: string, chatHistory: IChatMessage[] = []): Observable<string> {
    this.logger.log(`Starting stream response for prompt: ${prompt}`);
    this.logger.debug(`Chat history length: ${chatHistory.length}`);

    return new Observable((subscriber) => {
      let isFirstChunk = true;
      let accumulatedText = '';

      (async () => {
        try {
          const chat = this.model.startChat({
            history: this.convertToGeminiHistory(chatHistory),
            generationConfig: this.generationConfig,
          });

          this.logger.debug('Chat started, sending message stream...');
          const result = await chat.sendMessageStream([{ text: prompt }]);

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();

            if (chunkText) {
              accumulatedText += chunkText;
              this.logger.debug(`Received chunk: ${chunkText}`);

              if (isFirstChunk) {
                this.logger.debug('Sending first chunk');
                subscriber.next(accumulatedText);
                isFirstChunk = false;
                accumulatedText = '';
                continue;
              }

              if (this.isCompleteSentence(accumulatedText)) {
                this.logger.debug(`Sending complete sentence: ${accumulatedText}`);
                subscriber.next(accumulatedText);
                accumulatedText = '';
              }
            }
          }

          if (accumulatedText) {
            this.logger.debug(`Sending final chunk: ${accumulatedText}`);
            subscriber.next(accumulatedText);
          }

          this.logger.log('Stream completed successfully');
          subscriber.complete();
        } catch (error) {
          this.logger.error(`Stream error: ${error.message}`, error.stack);
          const errorMessage = ERRORS.CHAT.PROCESSING.STREAM_ERROR({ reason: error.message });
          subscriber.error(errorMessage);
        }
      })();

      return () => {
        this.logger.log('Stream cancelled by client');
      };
    });
  }

  private isCompleteSentence(text: string): boolean {
    const sentenceEndings = ['.', '!', '?', '\n'];
    const lastChar = text.trim().slice(-1);
    return sentenceEndings.includes(lastChar) || text.length > 200;
  }
}

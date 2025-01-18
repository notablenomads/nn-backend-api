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
    const apiKey =
      this.configService.get<IConfig['ai']['geminiApiKey']>('ai.geminiApiKey') ||
      'AIzaSyAni9RfAsb18pxORSSbjyP4mam23APjFeo';
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-pro',
    });
  }

  private convertToGeminiHistory(chatHistory: IChatMessage[] = []): Content[] {
    return chatHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));
  }

  async generateResponse(prompt: string, chatHistory: IChatMessage[] = []) {
    try {
      const chat = this.model.startChat({
        history: this.convertToGeminiHistory(chatHistory),
        generationConfig: this.generationConfig,
      });

      const result = await chat.sendMessage([{ text: prompt }]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error(ERRORS.CHAT.MESSAGE_FAILED({ reason: error.message }).message, error.stack);
      throw error;
    }
  }

  streamResponse(prompt: string, chatHistory: IChatMessage[] = []): Observable<string> {
    return new Observable((subscriber) => {
      let isFirstChunk = true;
      let accumulatedText = '';

      (async () => {
        try {
          const chat = this.model.startChat({
            history: this.convertToGeminiHistory(chatHistory),
            generationConfig: this.generationConfig,
          });

          const result = await chat.sendMessageStream([{ text: prompt }]);

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();

            if (chunkText) {
              accumulatedText += chunkText;

              if (isFirstChunk) {
                subscriber.next(accumulatedText);
                isFirstChunk = false;
                accumulatedText = '';
                continue;
              }

              if (this.isCompleteSentence(accumulatedText)) {
                subscriber.next(accumulatedText);
                accumulatedText = '';
              }
            }
          }

          if (accumulatedText) {
            subscriber.next(accumulatedText);
          }

          subscriber.complete();
        } catch (error) {
          const errorMessage = ERRORS.CHAT.STREAM_ERROR({ reason: error.message });
          this.logger.error(errorMessage.message, error.stack);
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

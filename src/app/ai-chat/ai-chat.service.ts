import { GoogleGenerativeAI, GenerativeModel, GenerationConfig, Content } from '@google/generative-ai';
import { Observable } from 'rxjs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IChatMessage } from './interfaces/chat.interface';
import { IConfig } from '../config/config.interface';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private model: GenerativeModel;
  private readonly generationConfig: GenerationConfig = {
    temperature: 1,
    topK: 64,
    topP: 0.95,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
  };

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<IConfig['ai']['geminiApiKey']>('ai.geminiApiKey');
    if (!apiKey) {
      throw new Error('***REMOVED*** is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'tunedModels/notable-nomads-gpt-72jpk04b4u12',
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
      this.logger.error(`Error generating AI response: ${error.message}`, error.stack);
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
              // Accumulate text to handle partial words/sentences
              accumulatedText += chunkText;

              // For the first chunk, emit immediately to show quick response
              if (isFirstChunk) {
                subscriber.next(accumulatedText);
                isFirstChunk = false;
                accumulatedText = '';
                continue;
              }

              // For subsequent chunks, wait for complete sentences or punctuation
              if (this.isCompleteSentence(accumulatedText)) {
                subscriber.next(accumulatedText);
                accumulatedText = '';
              }
            }
          }

          // Emit any remaining text
          if (accumulatedText) {
            subscriber.next(accumulatedText);
          }

          subscriber.complete();
        } catch (error) {
          this.logger.error(`Error streaming AI response: ${error.message}`, error.stack);
          subscriber.error(error);
        }
      })();

      // Return cleanup function
      return () => {
        this.logger.log('Stream cancelled by client');
      };
    });
  }

  private isCompleteSentence(text: string): boolean {
    // Adjust the sentence length threshold to match the new maxOutputTokens
    const sentenceEndings = ['.', '!', '?', '\n'];
    const lastChar = text.trim().slice(-1);
    return sentenceEndings.includes(lastChar) || text.length > 200; // Increased threshold for longer outputs
  }
}

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig, Content } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IChatMessage } from './interfaces/chat.interface';

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
    const apiKey = this.configService.get<string>('***REMOVED***');
    if (!apiKey) {
      throw new Error('***REMOVED*** is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
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

      const result = await chat.sendMessage([
        {
          text: prompt,
        },
      ]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error(`Error generating AI response: ${error.message}`, error.stack);
      throw error;
    }
  }

  async streamResponse(prompt: string, chatHistory: IChatMessage[] = []) {
    try {
      const chat = this.model.startChat({
        history: this.convertToGeminiHistory(chatHistory),
        generationConfig: this.generationConfig,
      });

      const result = await chat.sendMessage([
        {
          text: prompt,
        },
      ]);
      return result.response;
    } catch (error) {
      this.logger.error(`Error streaming AI response: ${error.message}`, error.stack);
      throw error;
    }
  }
}

import { Observable } from 'rxjs';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { IChatMessage } from './interfaces/chat.interface';
import { IConfig } from '../config/config.interface';
import { ERRORS } from '../core/errors/errors';
import { getExampleShots } from './ai-chat.example-shots';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private client: OpenAI;
  private modelConfig: {
    temperature: number;
    maxOutputTokens: number;
    modelName: string;
    apiKey: string;
    apiBaseUrl: string;
  };

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<IConfig['ai']['modelApiKey']>('ai.modelApiKey');
    const apiBaseUrl = this.configService.get<IConfig['ai']['modelApiBaseUrl']>('ai.modelApiBaseUrl');
    const temperature = this.configService.get<number>('ai.modelTemprature');
    const maxOutputTokens = this.configService.get<number>('ai.modelMaxOutputTokens');
    const modelName = this.configService.get<string>('ai.modelName');
    if (!apiKey) {
      this.logger.error(`LLM API key is not configured (ai.modelApiKey)`);
      throw new Error(`LLM MODEL API KEY is required`);
    }
    if (!modelName) {
      this.logger.error(`LLM model name is not configured (ai.modelName)`);
      throw new Error(`LLM MODEL NAME is required`);
    }

    this.modelConfig = {
      temperature,
      maxOutputTokens,
      modelName,
      apiKey,
      apiBaseUrl,
    };

    this.logger.log(`Initializing client model: ${this.modelConfig.modelName}`);

    this.client = new OpenAI({
      apiKey,
      baseURL: apiBaseUrl,
    });
  }

  private convertToAIHistory(chatHistory: IChatMessage[] = []): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    this.logger.debug(`Converting chat history: ${JSON.stringify(chatHistory)}`);

    return chatHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
  }

  async generateResponse(prompt: string, chatHistory: IChatMessage[] = []) {
    this.logger.log(`Generating response for prompt: ${prompt}`);
    this.logger.debug(`Chat history length: ${chatHistory.length}`);

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        ...this.convertToAIHistory(chatHistory),
        ...this.promptBuilder(prompt),
      ];

      const completion = await this.client.chat.completions.create({
        model: this.modelConfig.modelName,
        messages,
        temperature: this.modelConfig.temperature,
        max_tokens: this.modelConfig.maxOutputTokens,
      });

      const text = completion.choices[0]?.message?.content ?? '';

      this.logger.log(`Generated response length: ${text.length}`);
      this.logger.debug(`Response preview: ${text.substring(0, 100)}...`);

      return text;
    } catch (error: any) {
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
          const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            ...this.convertToAIHistory(chatHistory),
            ...this.promptBuilder(prompt),
          ];

          this.logger.debug('Chat started, sending message stream...');
          const stream = await this.client.chat.completions.create({
            model: this.modelConfig.modelName,
            messages,
            temperature: this.modelConfig.temperature,
            max_tokens: this.modelConfig.maxOutputTokens,
            stream: true,
          });

          for await (const chunk of stream) {
            const chunkText = chunk.choices[0]?.delta?.content ?? '';

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
        } catch (error: any) {
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

  private promptBuilder(question: string): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const prompt = [] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    const exampleShots = getExampleShots();
    for (const example of exampleShots) {
      prompt.push(
        {
          role: 'user',
          content: example.question,
        },
        {
          role: 'assistant',
          content: example.answer,
        },
      );
    }
    prompt.push({
      role: 'user',
      content: question,
    });
    return prompt;
  }

  private isCompleteSentence(text: string): boolean {
    const sentenceEndings = ['.', '!', '?', '\n'];
    const lastChar = text.trim().slice(-1);
    return sentenceEndings.includes(lastChar) || text.length > 200;
  }
}

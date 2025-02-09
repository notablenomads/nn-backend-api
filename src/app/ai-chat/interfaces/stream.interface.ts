export interface IBaseStreamResponse {
  success: boolean;
  timestamp: string;
}

export interface IStreamChunkResponse extends IBaseStreamResponse {
  chunk: string;
}

export interface IStreamErrorResponse extends IBaseStreamResponse {
  error: string;
}

export type IStreamCompleteResponse = IBaseStreamResponse;

export enum StreamEventType {
  CHUNK = 'streamChunk',
  ERROR = 'streamError',
  COMPLETE = 'streamComplete',
}

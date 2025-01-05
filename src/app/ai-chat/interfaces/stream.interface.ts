export interface IStreamChunkResponse {
  chunk: string;
  success: boolean;
}

export interface IStreamErrorResponse {
  error: string;
  success: boolean;
}

export interface IStreamCompleteResponse {
  success: boolean;
}

export enum StreamEventType {
  CHUNK = 'streamChunk',
  ERROR = 'streamError',
  COMPLETE = 'streamComplete',
}

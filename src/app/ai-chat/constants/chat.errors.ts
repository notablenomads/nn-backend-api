import { ErrorService } from '../../core/errors/error.service';

const errorService = new ErrorService();

export const CHAT_ERRORS = {
  VALIDATION: {
    INVALID_MESSAGE: errorService.createError('CHAT_INVALID_MESSAGE', 'Invalid chat message format', {
      prefix: 'CHAT',
    }),
    EMPTY_MESSAGE: errorService.createError('CHAT_EMPTY_MESSAGE', 'Chat message cannot be empty', { prefix: 'CHAT' }),
    MESSAGE_TOO_LONG: errorService.createError('CHAT_MESSAGE_TOO_LONG', 'Chat message exceeds maximum length', {
      prefix: 'CHAT',
    }),
  },
  CONNECTION: {
    FAILED: errorService.createDynamicError('CHAT_CONNECTION_FAILED', 'Failed to establish chat connection: {reason}', {
      prefix: 'CHAT',
    }),
    TIMEOUT: errorService.createError('CHAT_CONNECTION_TIMEOUT', 'Chat connection timed out', { prefix: 'CHAT' }),
  },
  PROCESSING: {
    MESSAGE_FAILED: errorService.createDynamicError('CHAT_MESSAGE_FAILED', 'Failed to process chat message: {reason}', {
      prefix: 'CHAT',
    }),
    STREAM_ERROR: errorService.createDynamicError('CHAT_STREAM_ERROR', 'Failed to process chat stream: {reason}', {
      prefix: 'CHAT',
    }),
    RATE_LIMIT: errorService.createDynamicError(
      'CHAT_RATE_LIMIT',
      'Rate limit exceeded. Please wait {seconds} seconds',
      { prefix: 'CHAT' },
    ),
  },
  SESSION: {
    NOT_FOUND: errorService.createError('CHAT_SESSION_NOT_FOUND', 'Chat session not found', { prefix: 'CHAT' }),
    EXPIRED: errorService.createError('CHAT_SESSION_EXPIRED', 'Chat session has expired', { prefix: 'CHAT' }),
  },
};

export const createChatValidationError = (errors: Record<string, string[]>) =>
  errorService.createValidationError(errors);

export const createChatProcessingError = (message: string) => errorService.createProcessingError(message);

export const createChatNotFoundError = () => errorService.createNotFoundError('Chat session');

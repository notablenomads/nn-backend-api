import { ErrorService } from '../../core/errors/error.service';

const errorService = new ErrorService();

export const CHAT_ERRORS = {
  VALIDATION: {
    INVALID_MESSAGE: errorService.createError('CHAT_INVALID_MESSAGE', 'Invalid chat message format', 'CHAT'),
    EMPTY_MESSAGE: errorService.createError('CHAT_EMPTY_MESSAGE', 'Chat message cannot be empty', 'CHAT'),
    MESSAGE_TOO_LONG: errorService.createError('CHAT_MESSAGE_TOO_LONG', 'Chat message exceeds maximum length', 'CHAT'),
  },
  CONNECTION: {
    FAILED: errorService.createDynamicError(
      'CHAT_CONNECTION_FAILED',
      'Failed to establish chat connection: {reason}',
      'CHAT',
    ),
    TIMEOUT: errorService.createError('CHAT_CONNECTION_TIMEOUT', 'Chat connection timed out', 'CHAT'),
  },
  PROCESSING: {
    MESSAGE_FAILED: errorService.createDynamicError(
      'CHAT_MESSAGE_FAILED',
      'Failed to process chat message: {reason}',
      'CHAT',
    ),
    STREAM_ERROR: errorService.createDynamicError(
      'CHAT_STREAM_ERROR',
      'Failed to process chat stream: {reason}',
      'CHAT',
    ),
    RATE_LIMIT: errorService.createDynamicError(
      'CHAT_RATE_LIMIT',
      'Rate limit exceeded. Please wait {seconds} seconds',
      'CHAT',
    ),
  },
  SESSION: {
    NOT_FOUND: errorService.createError('CHAT_SESSION_NOT_FOUND', 'Chat session not found', 'CHAT'),
    EXPIRED: errorService.createError('CHAT_SESSION_EXPIRED', 'Chat session has expired', 'CHAT'),
  },
};

export const createChatValidationError = (errors: Record<string, string[]>) =>
  errorService.createValidationError(errors);

export const createChatProcessingError = (message: string) => errorService.createProcessingError(message);

export const createChatNotFoundError = () => errorService.createNotFoundError('Chat session');

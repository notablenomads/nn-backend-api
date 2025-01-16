/* eslint-disable @typescript-eslint/naming-convention */
export const CONSTANTS = {
  ERRORS_PREFIX: 'APP',
};

function formatErrorCode(input: string): string {
  return input.replace(/\s/g, '_').toUpperCase();
}

function createError(code: string, messageTemplate: string) {
  return {
    code: `${CONSTANTS.ERRORS_PREFIX}_${formatErrorCode(code)}`,
    message: messageTemplate,
  };
}

function createDynamicError(code: string, messageTemplate: string) {
  return (params: Record<string, string | number>) => {
    let message = messageTemplate;
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value));
    });
    return {
      code: `${CONSTANTS.ERRORS_PREFIX}_${formatErrorCode(code)}`,
      message,
    };
  };
}

const ERRORS = {
  GENERIC: {
    INTERNAL_SERVER_ERROR: createError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'),
    VALIDATION_ERROR: createDynamicError('VALIDATION_ERROR', 'Validation failed: {reason}'),
    UNAUTHORIZED: createError('UNAUTHORIZED', 'You are not authorized to perform this action'),
    FORBIDDEN: createError('FORBIDDEN', 'You do not have permission to access this resource'),
    BAD_REQUEST: createDynamicError('BAD_REQUEST', '{reason}'),
    NOT_IMPLEMENTED: createError('NOT_IMPLEMENTED', 'This feature is not yet implemented'),
    SERVICE_UNAVAILABLE: createError('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable'),
    MISSING_CONFIG: createDynamicError('MISSING_CONFIG', 'Required configuration {configName} is missing'),
  },
  ENTITY: {
    NOT_FOUND: (entity: string, fieldName?: string, fieldValue?: string) => ({
      code: `${CONSTANTS.ERRORS_PREFIX}_${formatErrorCode(entity)}_NOT_FOUND`,
      message: `The requested ${entity}${fieldName && fieldValue ? ' with ' + fieldName + ' ' + fieldValue : ''} was not found`,
    }),
    ALREADY_EXISTS: (entity: string, fieldName?: string, fieldValue?: string) => ({
      code: `${CONSTANTS.ERRORS_PREFIX}_${formatErrorCode(entity)}_ALREADY_EXISTS`,
      message: `A ${entity}${fieldName && fieldValue ? ' with ' + fieldName + ' ' + fieldValue : ''} already exists`,
    }),
    INVALID: (entity: string, reason?: string) => ({
      code: `${CONSTANTS.ERRORS_PREFIX}_${formatErrorCode(entity)}_INVALID`,
      message: `Invalid ${entity}${reason ? ': ' + reason : ''}`,
    }),
  },
  AUTH: {
    INVALID_CREDENTIALS: createError('INVALID_CREDENTIALS', 'The provided credentials are invalid'),
    TOKEN_EXPIRED: createError('TOKEN_EXPIRED', 'The authentication token has expired'),
    INVALID_TOKEN: createError('INVALID_TOKEN', 'The authentication token is invalid'),
  },
  API: {
    RATE_LIMIT_EXCEEDED: createDynamicError(
      'RATE_LIMIT_EXCEEDED',
      'Rate limit exceeded. Please try again in {timeLeft} seconds',
    ),
    EXTERNAL_SERVICE_ERROR: createDynamicError(
      'EXTERNAL_SERVICE_ERROR',
      'Service {serviceName} is currently unavailable',
    ),
    INVALID_PARAMETERS: createDynamicError('INVALID_PARAMETERS', 'Invalid parameters: {reason}'),
  },
  EMAIL: {
    SEND_FAILED: createDynamicError('EMAIL_SEND_FAILED', 'Failed to send email: {reason}'),
    INVALID_ADDRESS: createDynamicError('EMAIL_INVALID_ADDRESS', 'Invalid email address: {email}'),
    TEMPLATE_ERROR: createDynamicError('EMAIL_TEMPLATE_ERROR', 'Failed to process email template: {reason}'),
  },
  CHAT: {
    CONNECTION_ERROR: createDynamicError('CHAT_CONNECTION_ERROR', 'Failed to establish chat connection: {reason}'),
    MESSAGE_FAILED: createDynamicError('CHAT_MESSAGE_FAILED', 'Failed to process chat message: {reason}'),
    STREAM_ERROR: createDynamicError('CHAT_STREAM_ERROR', 'Failed to process chat stream: {reason}'),
  },
  BLOG: {
    FETCH_ERROR: createDynamicError('BLOG_FETCH_ERROR', 'Failed to fetch blog posts: {reason}'),
    PARSE_ERROR: createDynamicError('BLOG_PARSE_ERROR', 'Failed to parse blog content: {reason}'),
  },
};

export { ERRORS };

import { ErrorService } from '../../core/errors/error.service';

const errorService = new ErrorService();

export const EMAIL_ERRORS = {
  VALIDATION: {
    INVALID_ADDRESS: errorService.createDynamicError('EMAIL_INVALID_ADDRESS', 'Invalid email address: {email}', {
      prefix: 'EMAIL',
    }),
    MISSING_SUBJECT: errorService.createError('EMAIL_MISSING_SUBJECT', 'Email subject is required', {
      prefix: 'EMAIL',
    }),
    MISSING_CONTENT: errorService.createError('EMAIL_MISSING_CONTENT', 'Email content is required', {
      prefix: 'EMAIL',
    }),
  },
  SENDING: {
    FAILED: errorService.createDynamicError('EMAIL_SEND_FAILED', 'Failed to send email: {reason}', { prefix: 'EMAIL' }),
    RATE_LIMIT: errorService.createDynamicError(
      'EMAIL_RATE_LIMIT',
      'Email rate limit exceeded. Please wait {minutes} minutes',
      { prefix: 'EMAIL' },
    ),
  },
  TEMPLATE: {
    NOT_FOUND: errorService.createDynamicError('EMAIL_TEMPLATE_NOT_FOUND', 'Email template {templateName} not found', {
      prefix: 'EMAIL',
    }),
    PARSE_ERROR: errorService.createDynamicError(
      'EMAIL_TEMPLATE_PARSE_ERROR',
      'Failed to parse email template: {reason}',
      { prefix: 'EMAIL' },
    ),
    MISSING_VARIABLES: errorService.createDynamicError(
      'EMAIL_TEMPLATE_MISSING_VARS',
      'Missing required template variables: {variables}',
      { prefix: 'EMAIL' },
    ),
  },
  CONFIG: {
    MISSING_CREDENTIALS: errorService.createError(
      'EMAIL_MISSING_CREDENTIALS',
      'Email service credentials are not configured',
      { prefix: 'EMAIL' },
    ),
    INVALID_CONFIG: errorService.createDynamicError('EMAIL_INVALID_CONFIG', 'Invalid email configuration: {reason}', {
      prefix: 'EMAIL',
    }),
  },
};

export const createEmailValidationError = (errors: Record<string, string[]>) =>
  errorService.createValidationError(errors);

export const createEmailProcessingError = (message: string) => errorService.createProcessingError(message);

export const createEmailConfigError = (message: string) =>
  errorService.createProcessingError(`Configuration error: ${message}`);

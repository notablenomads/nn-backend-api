/* eslint-disable @typescript-eslint/naming-convention */
import { ErrorService } from './error.service';
import { BLOG_ERRORS } from '../../blog/constants/blog.errors';
import { CHAT_ERRORS } from '../../ai-chat/constants/chat.errors';
import { EMAIL_ERRORS } from '../../email/constants/email.errors';
import { LEAD_ERRORS } from '../../lead/constants/lead.errors';

const errorService = new ErrorService();

const CORE_ERRORS = {
  GENERIC: {
    INTERNAL_SERVER_ERROR: errorService.createError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'),
    VALIDATION_ERROR: errorService.createDynamicError('VALIDATION_ERROR', 'Validation failed: {reason}'),
    UNAUTHORIZED: errorService.createError('UNAUTHORIZED', 'You are not authorized to perform this action'),
    FORBIDDEN: errorService.createError('FORBIDDEN', 'You do not have permission to access this resource'),
    BAD_REQUEST: errorService.createDynamicError('BAD_REQUEST', '{reason}'),
    NOT_IMPLEMENTED: errorService.createError('NOT_IMPLEMENTED', 'This feature is not yet implemented'),
    SERVICE_UNAVAILABLE: errorService.createError('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable'),
    MISSING_CONFIG: errorService.createDynamicError('MISSING_CONFIG', 'Required configuration {configName} is missing'),
  },
  ENTITY: {
    NOT_FOUND: (entity: string, fieldName?: string, fieldValue?: string) =>
      errorService.createError(
        `${entity}_NOT_FOUND`,
        `The requested ${entity}${fieldName && fieldValue ? ` with ${fieldName} ${fieldValue}` : ''} was not found`,
      ),
    ALREADY_EXISTS: (entity: string, fieldName?: string, fieldValue?: string) =>
      errorService.createError(
        `${entity}_ALREADY_EXISTS`,
        `A ${entity}${fieldName && fieldValue ? ` with ${fieldName} ${fieldValue}` : ''} already exists`,
      ),
    INVALID: (entity: string, reason?: string) =>
      errorService.createError(`${entity}_INVALID`, `Invalid ${entity}${reason ? ': ' + reason : ''}`),
  },
  AUTH: {
    INVALID_CREDENTIALS: errorService.createError('INVALID_CREDENTIALS', 'The provided credentials are invalid'),
    TOKEN_EXPIRED: errorService.createError('TOKEN_EXPIRED', 'The authentication token has expired'),
    INVALID_TOKEN: errorService.createError('INVALID_TOKEN', 'The authentication token is invalid'),
  },
  API: {
    RATE_LIMIT_EXCEEDED: errorService.createDynamicError(
      'RATE_LIMIT_EXCEEDED',
      'Rate limit exceeded. Please try again in {timeLeft} seconds',
    ),
    EXTERNAL_SERVICE_ERROR: errorService.createDynamicError(
      'EXTERNAL_SERVICE_ERROR',
      'Service {serviceName} is currently unavailable',
    ),
    INVALID_PARAMETERS: errorService.createDynamicError('INVALID_PARAMETERS', 'Invalid parameters: {reason}'),
  },
};

export const ERRORS = {
  ...CORE_ERRORS,
  BLOG: BLOG_ERRORS,
  CHAT: CHAT_ERRORS,
  EMAIL: EMAIL_ERRORS,
  LEAD: LEAD_ERRORS,
};

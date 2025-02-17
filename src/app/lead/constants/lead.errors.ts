import { ErrorService } from '../../core/errors/error.service';

const errorService = new ErrorService();

export const LEAD_ERRORS = {
  VALIDATION: {
    INVALID_INPUT: errorService.createError('LEAD_VALIDATION_INVALID_INPUT', 'Invalid input data', 'LEAD'),
    EXISTING_PROJECT_CHALLENGE: errorService.createError(
      'LEAD_VALIDATION_EXISTING_PROJECT_CHALLENGE',
      'Please specify the main challenge for your existing project',
      'LEAD',
    ),
    PROJECT_CHALLENGES: errorService.createError(
      'LEAD_VALIDATION_PROJECT_CHALLENGES',
      'Please specify at least one challenge for your existing project',
      'LEAD',
    ),
    COMPETITOR_URLS: errorService.createError(
      'LEAD_VALIDATION_COMPETITOR_URLS',
      'Please provide at least one competitor URL',
      'LEAD',
    ),
  },
  SUBMISSION: {
    FAILED: errorService.createDynamicError(
      'LEAD_SUBMISSION_FAILED',
      'Failed to process lead submission: {reason}',
      'LEAD',
    ),
    EMAIL_FAILED: errorService.createDynamicError(
      'LEAD_EMAIL_FAILED',
      'Failed to send lead notification emails: {reason}',
      'LEAD',
    ),
  },
  NOT_FOUND: errorService.createError('LEAD_NOT_FOUND', 'The requested lead could not be found', 'LEAD'),
  PROCESSING: {
    TEMPLATE_ERROR: errorService.createDynamicError(
      'LEAD_TEMPLATE_ERROR',
      'Failed to process lead template: {reason}',
      'LEAD',
    ),
    LOGO_NOT_FOUND: errorService.createError('LEAD_LOGO_NOT_FOUND', 'Logo file could not be found', 'LEAD'),
  },
};

export const createLeadValidationError = (errors: Record<string, string[]>) =>
  errorService.createValidationError(errors);

export const createLeadProcessingError = (message: string) => errorService.createProcessingError(message);

export const createLeadNotFoundError = () => errorService.createNotFoundError('Lead');

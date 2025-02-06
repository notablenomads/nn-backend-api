import { ErrorService } from '../../core/errors/error.service';

const errorService = new ErrorService();

export const LEAD_ERRORS = {
  VALIDATION: {
    EXISTING_PROJECT_CHALLENGE: errorService.createError(
      'LEAD_VALIDATION_EXISTING_PROJECT_CHALLENGE',
      'Challenge must be specified for existing projects',
      'LEAD',
    ),
    COMPETITOR_URLS: errorService.createError(
      'LEAD_VALIDATION_COMPETITOR_URLS',
      'Competitor URLs must be provided when hasCompetitors is true',
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

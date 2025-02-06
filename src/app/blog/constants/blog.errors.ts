import { ErrorService } from '../../core/errors/error.service';

const errorService = new ErrorService();

export const BLOG_ERRORS = {
  VALIDATION: {
    INVALID_SLUG: errorService.createError('BLOG_INVALID_SLUG', 'Invalid blog post slug format', 'BLOG'),
    MISSING_CONTENT: errorService.createError('BLOG_MISSING_CONTENT', 'Blog post content is required', 'BLOG'),
  },
  FETCH: {
    FAILED: errorService.createDynamicError('BLOG_FETCH_FAILED', 'Failed to fetch blog post: {reason}', 'BLOG'),
    NOT_FOUND: errorService.createError('BLOG_NOT_FOUND', 'The requested blog post could not be found', 'BLOG'),
  },
  PROCESSING: {
    PARSE_ERROR: errorService.createDynamicError('BLOG_PARSE_ERROR', 'Failed to parse blog content: {reason}', 'BLOG'),
    METADATA_ERROR: errorService.createDynamicError(
      'BLOG_METADATA_ERROR',
      'Failed to process blog metadata: {reason}',
      'BLOG',
    ),
  },
};

export const createBlogValidationError = (errors: Record<string, string[]>) =>
  errorService.createValidationError(errors);

export const createBlogProcessingError = (message: string) => errorService.createProcessingError(message);

export const createBlogNotFoundError = () => errorService.createNotFoundError('Blog post');

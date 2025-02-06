import { Injectable } from '@nestjs/common';
import { IBaseError, IErrorResponse, ErrorParams, IErrorOptions } from './error.types';

@Injectable()
export class ErrorService {
  private readonly defaultPrefix = 'APP';

  formatErrorCode(input: string, options?: IErrorOptions): string {
    const prefix = options?.prefix || this.defaultPrefix;
    const code = options?.shouldFormat !== false ? input.replace(/\s/g, '_').toUpperCase() : input;
    return `${prefix}_${code}`;
  }

  createError(code: string, messageTemplate: string, options?: IErrorOptions): IBaseError {
    return {
      code: this.formatErrorCode(code, options),
      message: messageTemplate,
    };
  }

  createDynamicError(code: string, messageTemplate: string, options?: IErrorOptions) {
    return (params: ErrorParams): IBaseError => {
      let message = messageTemplate;
      Object.entries(params).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, String(value));
      });
      return {
        code: this.formatErrorCode(code, options),
        message,
      };
    };
  }

  createValidationError(errors: Record<string, string[]>): IErrorResponse {
    return {
      message: 'Validation failed',
      errors,
    };
  }

  createProcessingError(message: string): IErrorResponse {
    return {
      message: 'Processing failed',
      errors: {
        general: [message],
      },
    };
  }

  createNotFoundError(entity: string): IErrorResponse {
    return {
      message: `${entity} not found`,
      errors: {
        general: [`The requested ${entity.toLowerCase()} could not be found`],
      },
    };
  }

  createEntityError(entity: string, action: string, reason?: string): IBaseError {
    const message = `Failed to ${action} ${entity}${reason ? `: ${reason}` : ''}`;
    return this.createError(`${entity}_${action}_failed`, message);
  }
}

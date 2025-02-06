import { Injectable } from '@nestjs/common';
import { IBaseError, IErrorResponse } from './error.types';

@Injectable()
export class ErrorService {
  private readonly defaultPrefix = 'APP';

  createError(code: string, message: string, prefix?: string): IBaseError {
    return {
      code: this.formatErrorCode(code, prefix),
      message,
    };
  }

  createDynamicError(code: string, messageTemplate: string, prefix?: string) {
    return (params?: Record<string, string | number>): IBaseError => {
      let message = messageTemplate;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          message = message.replace(`{${key}}`, String(value));
        });
      }
      return {
        code: this.formatErrorCode(code, prefix),
        message,
      };
    };
  }

  private formatErrorCode(code: string, prefix?: string): string {
    const finalPrefix = prefix || this.defaultPrefix;
    return `${finalPrefix}_${code.replace(/\s/g, '_').toUpperCase()}`;
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

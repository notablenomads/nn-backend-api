export interface IBaseError {
  code: string;
  message: string;
}

export interface IErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

export interface IValidationError extends IErrorResponse {
  code: string;
}

export type ErrorParams = Record<string, string | number>;

export interface IErrorFactory {
  create(message: string): IBaseError;
  createWithParams(params: ErrorParams): IBaseError;
}

export interface IErrorOptions {
  prefix?: string;
  shouldFormat?: boolean;
}

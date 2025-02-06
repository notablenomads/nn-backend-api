export interface IBaseError {
  code: string;
  message: string;
}

export interface IErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

export type ErrorCreator = (params?: Record<string, string | number>) => IBaseError;

export interface IErrorCategory {
  [key: string]: IBaseError | ErrorCreator;
}

export interface ICoreErrors {
  GENERIC: IErrorCategory;
  ENTITY: IErrorCategory;
  AUTH: IErrorCategory;
  API: IErrorCategory;
}

export interface IModuleErrors {
  [key: string]: IErrorCategory;
}

import { SetMetadata } from '@nestjs/common';

export enum AuthType {
  JWT = 'jwt',
  NONE = 'none',
}

export const AUTH_TYPE_KEY = 'authType';
export const Auth = (authType: AuthType) => SetMetadata(AUTH_TYPE_KEY, authType);

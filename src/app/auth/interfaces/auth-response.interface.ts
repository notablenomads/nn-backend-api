import { ITokens } from './tokens.interface';

export interface IAuthResponse extends ITokens {
  userId: string;
  email: string;
}

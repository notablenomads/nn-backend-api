import { Role } from '../../core/enums/role.enum';

export interface IJwtPayload {
  sub: string;
  email: string;
  roles: Role[];
  exp?: number;
  iat?: number;
}

export type JwtPayload = IJwtPayload;

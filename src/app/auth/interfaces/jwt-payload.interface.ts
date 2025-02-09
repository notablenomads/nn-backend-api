export interface IJwtPayload {
  sub: string; // user id
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

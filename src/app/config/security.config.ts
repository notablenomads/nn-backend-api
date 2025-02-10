export interface ISecurityConfig {
  rateLimit: {
    windowMs: number;
    max: number;
  };
  helmet: {
    enabled: boolean;
    contentSecurityPolicy: boolean;
    crossOriginEmbedderPolicy: boolean;
    crossOriginOpenerPolicy: boolean;
    crossOriginResourcePolicy: boolean;
  };
  cookie: {
    secure: boolean;
    sameSite: boolean;
    httpOnly: boolean;
  };
  inputValidation: {
    sanitize: boolean;
    maxPayloadSize: string;
  };
}

export const defaultSecurityConfig: ISecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
  helmet: {
    enabled: true,
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
  },
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: true,
    httpOnly: true,
  },
  inputValidation: {
    sanitize: true,
    maxPayloadSize: '10mb',
  },
};

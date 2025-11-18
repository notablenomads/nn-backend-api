export interface IAppConfig {
  nodeEnv: string;
  port: number;
  host: string;
  apiPrefix: string;
  enableSwagger: boolean;
  corsEnabledDomains: string[];
  corsRestrict: boolean;
  trustedProxies?: string[];
}

export interface IJwtConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  clockTolerance: number;
  issuer: string;
}

export interface IAiConfig {
  modelApiKey: string;
  modelApiBaseUrl: string;
  modelName: string;
  modelTemprature: number;
  modelMaxOutputTokens: number;
}

export interface IAwsConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface IEmailConfig {
  fromAddress: string;
  toAddress: string;
}

export interface IDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema: string;
}

export interface ISentryConfig {
  dsn: string;
}

export interface IMonitoringConfig {
  memoryThresholdMs: number;
}

export interface IEncryptionConfig {
  key: string;
}

import { ISecurityConfig } from './security.config';

export interface IConfig {
  app: IAppConfig;
  jwt: IJwtConfig;
  ai: IAiConfig;
  aws: IAwsConfig;
  email: IEmailConfig;
  database: IDatabaseConfig;
  sentry: ISentryConfig;
  monitoring: IMonitoringConfig;
  encryption: IEncryptionConfig;
  security: ISecurityConfig;
}

export interface IAppConfig {
  nodeEnv: string;
  port: number;
  host: string;
  apiPrefix: string;
  corsEnabledDomains: string[];
  corsRestrict: boolean;
  name: string;
  description: string;
  version: string;
}

export interface IAiConfig {
  geminiApiKey: string;
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

export interface IConfig {
  app: IAppConfig;
  ai: IAiConfig;
  aws: IAwsConfig;
  email: IEmailConfig;
}

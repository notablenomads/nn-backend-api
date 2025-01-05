export interface IAppConfig {
  nodeEnv: string;
  port: number;
  host: string;
  apiPrefix: string;
  corsOrigin: string;
}

export interface IAiConfig {
  geminiApiKey: string;
}

export interface IConfig {
  app: IAppConfig;
  ai: IAiConfig;
}

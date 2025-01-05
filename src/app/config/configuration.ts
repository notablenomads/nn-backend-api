import { IConfig } from './config.interface';

export default (): IConfig => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || 'v1',
    corsEnabledDomains: (process.env.CORS_ENABLED_DOMAINS || '*.notablenomads.com')
      .split(',')
      .map((domain) => domain.trim()),
    corsRestrict: process.env.CORS_RESTRICT === 'true',
  },
  ai: {
    geminiApiKey: process.env.***REMOVED*** || '',
  },
});

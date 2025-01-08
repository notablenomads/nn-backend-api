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
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
  aws: {
    region: process.env.AWS_REGION || 'eu-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  email: {
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@notablenomads.com',
    toAddress: process.env.EMAIL_TO_ADDRESS || 'contact@notablenomads.com',
  },
});

import { IConfig } from './config.interface';

export default (): IConfig => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: process.env.API_PREFIX || 'api',
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
    corsEnabledDomains: process.env.CORS_ENABLED_DOMAINS?.split(',') || [],
    corsRestrict: process.env.CORS_RESTRICT !== 'false',
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  email: {
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@mail.notablenomads.com',
    toAddress: process.env.EMAIL_TO_ADDRESS || '',
  },
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'notablenomads',
    schema: process.env.DATABASE_SCHEMA || 'public',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },
});

import { IConfig } from './config.interface';
import { defaultSecurityConfig } from './security.config';

export default (): IConfig => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: process.env.API_PREFIX || 'api',
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
    corsEnabledDomains: process.env.CORS_ENABLED_DOMAINS?.split(',').map((domain) => domain.trim()) || [],
    corsRestrict: process.env.CORS_RESTRICT !== 'false',
    trustedProxies: process.env.TRUSTED_PROXIES?.split(',').map((proxy) => proxy.trim()) || [],
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE || '30', 10), // 30 seconds
    issuer: process.env.JWT_ISSUER || 'notablenomads',
  },
  ai: {
    modelApiKey: process.env.LLM_MODEL_API_KEY || '',
    modelApiBaseUrl: process.env.LLM_MODEL_API_BASE_URL || 'https://api.openai.com/v1',
    modelName: process.env.LLM_MODEL_NAME || 'gpt-4o-mini',
    modelTemprature: parseFloat(process.env.LLM_MODEL_TEMPRATURE || '0.2'),
    modelMaxOutputTokens: parseInt(process.env.LLM_MODEL_MAX_OUTPUT_TOKENS || '1024', 10),
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  email: {
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
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
  monitoring: {
    memoryThresholdMs: parseInt(process.env.MONITORING_MEMORY_THRESHOLD_MS || '1000', 10),
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },
  security: {
    ...defaultSecurityConfig,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || (15 * 60 * 1000).toString(), 10),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
    helmet: {
      ...defaultSecurityConfig.helmet,
      enabled: process.env.SECURITY_HELMET_ENABLED !== 'false',
    },
    cookie: {
      ...defaultSecurityConfig.cookie,
      secure: process.env.NODE_ENV === 'production' ? true : process.env.COOKIE_SECURE !== 'false',
    },
    inputValidation: {
      ...defaultSecurityConfig.inputValidation,
      maxPayloadSize: process.env.MAX_PAYLOAD_SIZE || '10mb',
    },
  },
});

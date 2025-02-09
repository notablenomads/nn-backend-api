import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('localhost'),
  API_PREFIX: Joi.string().default('v1'),
  ENABLE_SWAGGER: Joi.boolean().default(true).description('Whether to enable Swagger documentation'),
  CORS_ENABLED_DOMAINS: Joi.string()
    .default('*.notablenomads.com')
    .description('Comma-separated list of allowed domains'),
  CORS_RESTRICT: Joi.boolean().default(false).description('Whether to enforce CORS restrictions'),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required().description('JWT secret key - Must be at least 32 characters long'),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT refresh token secret key - Must be at least 32 characters long'),
  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^[0-9]+[smhd]$/)
    .default('15m')
    .description('JWT expiration time (e.g., 15m, 1h, 7d)'),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .pattern(/^[0-9]+[smhd]$/)
    .default('7d')
    .description('JWT refresh token expiration time (e.g., 15m, 1h, 7d)'),

  // AI Configuration
  ***REMOVED***: Joi.string().required().description('AI API key').when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // AWS Configuration
  ***REMOVED***: Joi.string().default('eu-central-1'),
  ***REMOVED***: Joi.string().required().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  ***REMOVED***: Joi.string().required().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Email Configuration
  EMAIL_FROM_ADDRESS: Joi.string()
    .email()
    .default('noreply@notablenomads.com')
    .description('Email address to send from'),
  EMAIL_TO_ADDRESS: Joi.string().email().default('contact@notablenomads.com').description('Email address to send to'),

  // Sentry Configuration
  SENTRY_DSN: Joi.string().uri().allow('').default(''),

  // Monitoring Configuration
  MONITORING_MEMORY_THRESHOLD_MS: Joi.number().default(1000).description('Memory logging threshold in milliseconds'),
});

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

  // AI Configuration
  ***REMOVED***: Joi.string().default('AIzaSyAni9RfAsb18pxORSSbjyP4mam23APjFeo'),

  // AWS Configuration
  ***REMOVED***: Joi.string().default('eu-central-1'),
  ***REMOVED***: Joi.string().required(),
  ***REMOVED***: Joi.string().required(),

  // Email Configuration
  EMAIL_FROM_ADDRESS: Joi.string().email().default('noreply@notablenomads.com'),
  EMAIL_TO_ADDRESS: Joi.string().email().default('contact@notablenomads.com'),

  // Sentry Configuration
  SENTRY_DSN: Joi.string().uri().allow('').default(''),

  // Monitoring Configuration
  MONITORING_MEMORY_THRESHOLD_MS: Joi.number().default(1000).description('Memory logging threshold in milliseconds'),
});

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
  GEMINI_API_KEY: Joi.string().default('AIzaSyAni9RfAsb18pxORSSbjyP4mam23APjFeo'),

  // AWS Configuration
  AWS_REGION: Joi.string().default('eu-central-1'),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),

  // Email Configuration
  EMAIL_FROM_ADDRESS: Joi.string().email().default('noreply@notablenomads.com'),
  EMAIL_TO_ADDRESS: Joi.string().email().default('contact@notablenomads.com'),
});

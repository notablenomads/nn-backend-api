import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('localhost'),
  ***REMOVED***: Joi.string().required(),
  API_PREFIX: Joi.string().default('v1'),
  CORS_ORIGIN: Joi.string().default('*'),
});

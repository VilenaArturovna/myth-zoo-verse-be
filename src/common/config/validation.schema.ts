import * as Joi from 'joi';

export const validationSchema = Joi.object({
  //APP
  NODE_ENV: Joi.string().valid('development', 'staging', 'production'),
  PORT: Joi.number().port(),

  //POSTGRES
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),

  //REDIS
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),

  //TELEGRAM
  TG_BOT_TOKEN: Joi.string().required(),
  TG_BOT_NAME: Joi.string().required(),

  //JWT
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_TTL: Joi.number().required(),
  JWT_REFRESH_TTL: Joi.number().required(),
  COOKIE_SECURE: Joi.boolean().required(),
});

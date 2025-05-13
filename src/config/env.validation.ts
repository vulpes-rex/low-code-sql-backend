import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_TYPE: Joi.string()
    .valid('postgresql', 'mysql', 'mariadb', 'postgres')
    .default('postgresql'),
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USERNAME: Joi.string().default('postgres'),
  DATABASE_PASSWORD: Joi.string().default('postgres'),
  DATABASE_NAME: Joi.string().default('low_code_sql'),
  DATABASE_SCHEMA: Joi.string().default('public'),

  // JWT
  JWT_SECRET: Joi.string().default('dev-secret-key-change-in-production'),
  JWT_EXPIRATION: Joi.string().default('1d'),

  // Admin API
  ADMIN_API_URL: Joi.string().uri().default('http://localhost:3001'),
  ADMIN_API_KEY: Joi.string().default('dev-admin-key-change-in-production'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('debug'),
}); 
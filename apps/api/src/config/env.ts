import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).default('postgres://platform_app:platform_app@localhost:5432/platform'),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  JWT_PRIVATE_KEY: z.string().min(1).default('dev-jwt-private-key-placeholder'),
  JWT_PUBLIC_KEY: z.string().min(1).default('dev-jwt-public-key-placeholder'),
  ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(19456),
  ARGON2_TIME_COST: z.coerce.number().int().positive().default(2),
  ARGON2_PARALLELISM: z.coerce.number().int().positive().default(1),
  EMAIL_FROM: z.string().email().default('noreply@example.com'),
});

export type AppEnv = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);

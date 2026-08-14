import { z } from 'zod';

const envSchema = z.object({
  REGION: z.string().trim().min(1),

  COGNITO_USER_POOL_ID: z.string().trim().min(1),
  COGNITO_CLIENT_ID: z.string().trim().min(1),
  COGNITO_CLIENT_SECRET: z.string().trim().min(1),

  DB_HOST: z.string().trim().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().trim().min(1),
  DB_USER: z.string().trim().min(1),
  DB_PASSWORD: z.string(),

  NEXT_PUBLIC_APP_URL: z.string().trim().url(),
});

const result = envSchema.safeParse({
  REGION: process.env.REGION,

  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET,

  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!result.success) {
  console.error(
    'Invalid environment variables:',
    result.error.flatten().fieldErrors,
  );

  throw new Error('Invalid environment variables');
}

export const env = result.data;
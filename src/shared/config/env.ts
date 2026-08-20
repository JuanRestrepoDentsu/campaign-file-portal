import { z } from 'zod';

const envSchema = z.object({
  REGION: z.string().trim().min(1),

  COGNITO_USER_POOL_ID: z.string().trim().min(1),
  COGNITO_CLIENT_ID: z.string().trim().min(1),
  COGNITO_CLIENT_SECRET: z.string().trim().min(1),

  NEXT_PUBLIC_APP_URL: z.string().trim().url(),
});

const result = envSchema.safeParse({
  REGION: process.env.REGION,

  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET,

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

import { z } from 'zod';

const identifier = z.string().trim().min(1).max(64).regex(
  /^[A-Za-z0-9_]+$/,
  'Solo se permiten letras, números y guiones bajos.',
);

export const campaignIdSchema = z.coerce.number().int().positive();
export const uploadIdSchema = z.coerce.number().int().positive();
export const uploadConfigurationSchema = z.object({
  campaignId: campaignIdSchema,
  targetTable: identifier,
  upsertKeyColumns: z.array(identifier).min(1).max(10)
    .transform((columns) => [...new Set(columns)]),
});

export const initiateUploadSchema = uploadConfigurationSchema.extend({
  filename: z.string().trim().min(1).max(255).refine((value) => value.toLowerCase().endsWith('.csv'), 'Solo se admiten archivos .csv.'),
  fileSize: z.number().int().positive().max(120 * 1024 * 1024),
  contentType: z.string().max(100).optional(),
});

export const completeMultipartSchema = z.object({
  parts: z.array(z.object({ partNumber: z.number().int().positive(), eTag: z.string().min(1).max(200) })).min(1).max(100),
});

export const uploadListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
});

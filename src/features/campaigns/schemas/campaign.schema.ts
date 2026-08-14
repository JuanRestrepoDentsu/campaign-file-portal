import { z } from 'zod';

const campaignNameSchema = z.string().trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(150, 'El nombre no puede superar 150 caracteres.');

const campaignCodeSchema = z.string().trim()
  .min(2, 'El código debe tener al menos 2 caracteres.')
  .max(100, 'El código no puede superar 100 caracteres.')
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(
    /^[A-Z0-9]+(?:[_-][A-Z0-9]+)*$/,
    'Usa letras, números, guiones o guiones bajos, sin espacios.',
  ));

const descriptionSchema = z.string().trim()
  .max(500, 'La descripción no puede superar 500 caracteres.')
  .transform((value) => value || null);

export const campaignStatusSchema = z.enum(['active', 'inactive', 'archived']);

const campaignFields = {
  clientId: z.coerce.number().int().positive('Selecciona un cliente.'),
  name: campaignNameSchema,
  code: campaignCodeSchema,
  description: descriptionSchema,
  status: campaignStatusSchema,
  userIds: z.array(z.coerce.number().int().positive())
    .max(500, 'No puedes asignar más de 500 usuarios.')
    .default([])
    .transform((values) => [...new Set(values)]),
};

export const createCampaignSchema = z.object({
  ...campaignFields,
  status: campaignStatusSchema.default('active'),
});

export const updateCampaignSchema = z.object(campaignFields);

export const campaignStatusMutationSchema = z.object({
  status: campaignStatusSchema,
});

export const campaignIdSchema = z.coerce.number().int().positive();

export const campaignListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
  search: z.string().trim().max(150).default(''),
  status: z.enum(['all', 'active', 'inactive', 'archived']).default('all'),
  clientId: z.union([
    z.coerce.number().int().positive(),
    z.null(),
    z.literal(''),
  ]).default(null).transform((value) => value === '' ? null : value),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CampaignStatusMutationInput = z.infer<typeof campaignStatusMutationSchema>;

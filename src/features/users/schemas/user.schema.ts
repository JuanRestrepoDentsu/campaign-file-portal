import { z } from 'zod';

export const userRoleSchema = z.enum([
  'super_admin',
  'client_admin',
  'client_user',
]);

export const userStatusSchema = z.enum([
  'invited',
  'active',
  'blocked',
  'inactive',
]);

const nullableClientIdSchema = z
  .union([
    z.coerce.number().int().positive(),
    z.null(),
    z.literal(''),
  ])
  .transform((value) =>
    value === '' ? null : value,
  );

const businessFields = {
  firstName: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede superar 100 caracteres.'),
  lastName: z
    .string()
    .trim()
    .max(100, 'El apellido no puede superar 100 caracteres.')
    .transform((value) => value || null),
  role: userRoleSchema,
  clientId: nullableClientIdSchema,
  campaignIds: z
    .array(z.coerce.number().int().positive())
    .max(200, 'No puedes asignar más de 200 campañas.')
    .default([])
    .transform((values) => [...new Set(values)]),
};

function validateRoleRelations(
  input: {
    role: z.infer<typeof userRoleSchema>;
    clientId: number | null;
    campaignIds: number[];
  },
  context: z.RefinementCtx,
) {
  if (
    input.role === 'super_admin' &&
    (input.clientId !== null || input.campaignIds.length > 0)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['clientId'],
      message: 'Un superadministrador no debe pertenecer a un cliente.',
    });
  }

  if (input.role !== 'super_admin' && input.clientId === null) {
    context.addIssue({
      code: 'custom',
      path: ['clientId'],
      message: 'Selecciona el cliente del usuario.',
    });
  }
}

export const createUserSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Ingresa un correo válido.')
      .max(254)
      .transform((value) => value.toLowerCase()),
    ...businessFields,
  })
  .superRefine(validateRoleRelations);

export const updateUserSchema = z
  .object(businessFields)
  .superRefine(validateRoleRelations);

export const userIdSchema = z.coerce
  .number()
  .int()
  .positive();

export const userStatusMutationSchema = z.object({
  status: z.enum(['active', 'blocked', 'inactive']),
});

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
  search: z.string().trim().max(254).default(''),
  role: z
    .enum(['all', 'super_admin', 'client_admin', 'client_user'])
    .default('all'),
  status: z
    .enum(['all', 'invited', 'active', 'blocked', 'inactive'])
    .default('all'),
  clientId: z
    .union([
      z.coerce.number().int().positive(),
      z.null(),
      z.literal(''),
    ])
    .default(null)
    .transform((value) => (value === '' ? null : value)),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserStatusMutationInput = z.infer<
  typeof userStatusMutationSchema
>;

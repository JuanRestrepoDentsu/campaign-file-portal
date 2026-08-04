import {
  z,
} from 'zod';

const clientNameSchema = z
  .string()
  .trim()
  .min(
    2,
    'El nombre debe tener al menos 2 caracteres.',
  )
  .max(
    150,
    'El nombre no puede superar 150 caracteres.',
  );

const clientCodeSchema = z
  .string()
  .trim()
  .min(
    2,
    'El código debe tener al menos 2 caracteres.',
  )
  .max(
    80,
    'El código no puede superar 80 caracteres.',
  )
  .transform((value) =>
    value.toUpperCase(),
  )
  .pipe(
    z.string().regex(
      /^[A-Z0-9]+(?:[_-][A-Z0-9]+)*$/,
      'Usa letras, números, guiones o guiones bajos, sin espacios.',
    ),
  );

export const clientStatusSchema =
  z.enum([
    'active',
    'inactive',
  ]);

export const createClientSchema =
  z.object({
    name: clientNameSchema,
    code: clientCodeSchema,
    status:
      clientStatusSchema.default(
        'active',
      ),
  });

export const updateClientSchema =
  z
    .object({
      name:
        clientNameSchema.optional(),
      code:
        clientCodeSchema.optional(),
      status:
        clientStatusSchema.optional(),
    })
    .refine(
      (input) =>
        Object.keys(input).length > 0,
      {
        message:
          'Debes enviar al menos un campo para actualizar.',
      },
    );

export const clientIdSchema = z.coerce
  .number()
  .int()
  .positive();

export const clientListQuerySchema =
  z.object({
    page: z.coerce
      .number()
      .int()
      .positive()
      .default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(5)
      .max(100)
      .default(10),
    search: z
      .string()
      .trim()
      .max(150)
      .default(''),
    status: z
      .enum([
        'all',
        'active',
        'inactive',
      ])
      .default('all'),
  });

export type CreateClientInput =
  z.infer<
    typeof createClientSchema
  >;

export type UpdateClientInput =
  z.infer<
    typeof updateClientSchema
  >;

export type ClientListQuery =
  z.infer<
    typeof clientListQuerySchema
  >;

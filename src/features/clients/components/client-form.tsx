'use client';

import type {
  FormEvent,
} from 'react';
import {
  useState,
} from 'react';
import {
  useRouter,
} from 'next/navigation';

import type {
  ClientStatus,
} from '@/features/clients/types/client';

type ClientFormValues = {
  name: string;
  code: string;
  status: ClientStatus;
};

type ClientFormProps = {
  mode: 'create' | 'edit';
  clientId?: number;
  initialValues?:
    ClientFormValues;
};

type ClientApiResponse = {
  message?: string;
  errors?: {
    name?: string[];
    code?: string[];
    status?: string[];
  };
};

const EMPTY_VALUES:
  ClientFormValues = {
  name: '',
  code: '',
  status: 'active',
};

export function ClientForm({
  mode,
  clientId,
  initialValues = EMPTY_VALUES,
}: ClientFormProps) {
  const router = useRouter();
  const [values, setValues] =
    useState(initialValues);
  const [errors, setErrors] =
    useState<
      NonNullable<
        ClientApiResponse['errors']
      >
    >({});
  const [message, setMessage] =
    useState('');
  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrors({});
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(
        mode === 'create'
          ? '/api/admin/clients'
          : `/api/admin/clients/${clientId}`,
        {
          method:
            mode === 'create'
              ? 'POST'
              : 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            values,
          ),
        },
      );

      const data =
        (await response.json()) as
          ClientApiResponse;

      if (!response.ok) {
        setErrors(
          data.errors ?? {},
        );
        setMessage(
          data.message ??
            'No fue posible guardar el cliente.',
        );
        return;
      }

      router.push(
        `/admin/clients?notice=${
          mode === 'create'
            ? 'created'
            : 'updated'
        }`,
      );
      router.refresh();
    } catch {
      setMessage(
        'No fue posible comunicarse con el servidor.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-sm font-medium text-slate-700"
        >
          Nombre
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={150}
          autoComplete="organization"
          value={values.name}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          aria-invalid={
            Boolean(errors.name)
          }
          aria-describedby={
            errors.name
              ? 'name-error'
              : undefined
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />

        {errors.name?.[0] && (
          <p
            id="name-error"
            className="text-sm text-red-700"
          >
            {errors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="code"
          className="text-sm font-medium text-slate-700"
        >
          Código
        </label>

        <input
          id="code"
          name="code"
          type="text"
          required
          minLength={2}
          maxLength={80}
          spellCheck={false}
          value={values.code}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              code:
                event.target.value
                  .toUpperCase(),
            }))
          }
          aria-invalid={
            Boolean(errors.code)
          }
          aria-describedby={
            errors.code
              ? 'code-error'
              : 'code-help'
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono uppercase outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />

        <p
          id="code-help"
          className="text-xs text-slate-500"
        >
          Identificador único. Usa letras, números, guiones o guiones bajos.
        </p>

        {errors.code?.[0] && (
          <p
            id="code-error"
            className="text-sm text-red-700"
          >
            {errors.code[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="status"
          className="text-sm font-medium text-slate-700"
        >
          Estado
        </label>

        <select
          id="status"
          name="status"
          value={values.status}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              status:
                event.target.value as
                  ClientStatus,
            }))
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="active">
            Activo
          </option>
          <option value="inactive">
            Inactivo
          </option>
        </select>
      </div>

      {message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() =>
            router.push(
              '/admin/clients',
            )
          }
          disabled={isLoading}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? 'Guardando…'
            : mode === 'create'
              ? 'Crear cliente'
              : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

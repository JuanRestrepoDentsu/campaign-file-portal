'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type {
  PortalUserRole,
  UserFormOptions,
} from '@/features/users/types/user';

type Values = {
  email: string;
  firstName: string;
  lastName: string;
  role: PortalUserRole;
  clientId: string;
  campaignIds: number[];
};

type Props = {
  mode: 'create' | 'edit';
  options: UserFormOptions;
  userId?: number;
  initialValues?: Values;
};

type ApiResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const EMPTY: Values = {
  email: '',
  firstName: '',
  lastName: '',
  role: 'client_user',
  clientId: '',
  campaignIds: [],
};

export function UserForm({
  mode,
  options,
  userId,
  initialValues = EMPTY,
}: Props) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const availableCampaigns = useMemo(
    () =>
      options.campaigns.filter(
        (campaign) => campaign.clientId === Number(values.clientId),
      ),
    [options.campaigns, values.clientId],
  );

  function setRole(role: PortalUserRole) {
    setValues((current) => ({
      ...current,
      role,
      clientId: role === 'super_admin' ? '' : current.clientId,
      campaignIds: role === 'super_admin' ? [] : current.campaignIds,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage('');
    setLoading(true);
    try {
      const body = {
        ...(mode === 'create' ? { email: values.email } : {}),
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
        clientId: values.clientId || null,
        campaignIds: values.campaignIds,
      };
      const response = await fetch(
        mode === 'create' ? '/api/admin/users' : `/api/admin/users/${userId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const data = (await response.json()) as ApiResponse;
      if (!response.ok) {
        setErrors(data.errors ?? {});
        setMessage(data.message ?? 'No fue posible guardar el usuario.');
        return;
      }
      router.push(`/admin/users?notice=${mode === 'create' ? 'created' : 'updated'}`);
      router.refresh();
    } catch {
      setMessage('No fue posible comunicarse con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200';

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Nombre
          <input
            required
            minLength={2}
            maxLength={100}
            value={values.firstName}
            onChange={(event) =>
              setValues((current) => ({ ...current, firstName: event.target.value }))
            }
            className={fieldClass}
          />
          {errors.firstName?.[0] && (
            <span className="block text-red-700">{errors.firstName[0]}</span>
          )}
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          Apellido
          <input
            maxLength={100}
            value={values.lastName}
            onChange={(event) =>
              setValues((current) => ({ ...current, lastName: event.target.value }))
            }
            className={fieldClass}
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        Correo
        <input
          required
          type="email"
          maxLength={254}
          autoComplete="email"
          disabled={mode === 'edit'}
          value={values.email}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
          className={`${fieldClass} disabled:bg-slate-100 disabled:text-slate-500`}
        />
        {mode === 'edit' && (
          <span className="block text-xs font-normal text-slate-500">
            El correo es el identificador de acceso y no se modifica desde este formulario.
          </span>
        )}
        {errors.email?.[0] && (
          <span className="block text-red-700">{errors.email[0]}</span>
        )}
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Rol
          <select
            value={values.role}
            onChange={(event) => setRole(event.target.value as PortalUserRole)}
            className={fieldClass}
          >
            <option value="super_admin">Superadministrador</option>
            <option value="client_admin">Administrador de cliente</option>
            <option value="client_user">Usuario de cliente</option>
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          Cliente
          <select
            disabled={values.role === 'super_admin'}
            required={values.role !== 'super_admin'}
            value={values.clientId}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                clientId: event.target.value,
                campaignIds: [],
              }))
            }
            className={`${fieldClass} disabled:bg-slate-100`}
          >
            <option value="">Selecciona un cliente</option>
            {options.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.code})
              </option>
            ))}
          </select>
          {errors.clientId?.[0] && (
            <span className="block text-red-700">{errors.clientId[0]}</span>
          )}
        </label>
      </div>

      {values.role !== 'super_admin' && (
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Campañas</legend>
          <div className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
            {availableCampaigns.length ? (
              availableCampaigns.map((campaign) => (
                <label key={campaign.id} className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={values.campaignIds.includes(campaign.id)}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        campaignIds: event.target.checked
                          ? [...current.campaignIds, campaign.id]
                          : current.campaignIds.filter((id) => id !== campaign.id),
                      }))
                    }
                  />
                  {campaign.name} ({campaign.code})
                </label>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Selecciona un cliente con campañas activas.
              </p>
            )}
          </div>
        </fieldset>
      )}

      {message && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {message}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          disabled={loading}
          onClick={() => router.push('/admin/users')}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Guardando…' : mode === 'create' ? 'Crear e invitar' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

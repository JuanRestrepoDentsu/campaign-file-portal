'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type {
  CampaignFormOptions,
  CampaignStatus,
} from '@/features/campaigns/types/campaign';

type Values = {
  clientId: string;
  name: string;
  code: string;
  description: string;
  status: CampaignStatus;
  userIds: number[];
};

type Props = {
  mode: 'create' | 'edit';
  options: CampaignFormOptions;
  campaignId?: number;
  initialValues?: Values;
};

type ApiResponse = { message?: string; errors?: Record<string, string[]> };

const EMPTY: Values = {
  clientId: '',
  name: '',
  code: '',
  description: '',
  status: 'active',
  userIds: [],
};

export function CampaignForm({
  mode,
  options,
  campaignId,
  initialValues = EMPTY,
}: Props) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const availableUsers = useMemo(
    () => options.users.filter((user) => user.clientId === Number(values.clientId)),
    [options.users, values.clientId],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch(
        mode === 'create' ? '/api/admin/campaigns' : `/api/admin/campaigns/${campaignId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: values.clientId,
            name: values.name,
            code: values.code,
            description: values.description,
            status: values.status,
            userIds: values.userIds,
          }),
        },
      );
      const data = (await response.json()) as ApiResponse;
      if (!response.ok) {
        setErrors(data.errors ?? {});
        setMessage(data.message ?? 'No fue posible guardar la campaña.');
        return;
      }
      router.push(`/admin/campaigns?notice=${mode === 'create' ? 'created' : 'updated'}`);
      router.refresh();
    } catch {
      setMessage('No fue posible comunicarse con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200';

  return (
    <form onSubmit={submit} className="space-y-6">
      <label className="block space-y-2 text-sm font-medium text-slate-700">
        Cliente
        <select
          required
          value={values.clientId}
          onChange={(event) => setValues((current) => ({
            ...current,
            clientId: event.target.value,
            userIds: [],
          }))}
          className={fieldClass}
        >
          <option value="">Selecciona un cliente</option>
          {options.clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} ({client.code}){client.status === 'inactive' ? ' — Inactivo' : ''}
            </option>
          ))}
        </select>
        {errors.clientId?.[0] && <span className="block text-red-700">{errors.clientId[0]}</span>}
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Nombre
          <input
            required minLength={2} maxLength={150}
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            className={fieldClass}
          />
          {errors.name?.[0] && <span className="block text-red-700">{errors.name[0]}</span>}
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          Código
          <input
            required minLength={2} maxLength={100} spellCheck={false}
            value={values.code}
            onChange={(event) => setValues((current) => ({
              ...current,
              code: event.target.value.toUpperCase(),
            }))}
            className={`${fieldClass} font-mono uppercase`}
          />
          {errors.code?.[0] && <span className="block text-red-700">{errors.code[0]}</span>}
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        Descripción
        <textarea
          rows={4} maxLength={500}
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          className={fieldClass}
        />
        <span className="block text-right text-xs font-normal text-slate-500">
          {values.description.length}/500
        </span>
        {errors.description?.[0] && <span className="block text-red-700">{errors.description[0]}</span>}
      </label>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        Estado
        <select
          value={values.status}
          onChange={(event) => setValues((current) => ({
            ...current,
            status: event.target.value as CampaignStatus,
          }))}
          className={fieldClass}
        >
          <option value="active">Activa</option>
          <option value="inactive">Inactiva</option>
          <option value="archived">Archivada</option>
        </select>
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Usuarios asignados</legend>
        <p className="mt-1 text-xs text-slate-500">
          Solo aparecen usuarios pertenecientes al cliente seleccionado.
        </p>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
          {availableUsers.length ? availableUsers.map((user) => (
            <label key={user.id} className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={values.userIds.includes(user.id)}
                onChange={(event) => setValues((current) => ({
                  ...current,
                  userIds: event.target.checked
                    ? [...current.userIds, user.id]
                    : current.userIds.filter((id) => id !== user.id),
                }))}
              />
              <span>
                <span className="block font-medium">{user.firstName} {user.lastName ?? ''}</span>
                <span className="block text-xs text-slate-500">{user.email} · {user.status}</span>
              </span>
            </label>
          )) : (
            <p className="text-sm text-slate-500">Selecciona un cliente con usuarios disponibles.</p>
          )}
        </div>
        {errors.userIds?.[0] && <span className="mt-2 block text-sm text-red-700">{errors.userIds[0]}</span>}
      </fieldset>

      {message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
        <button
          type="button" disabled={loading}
          onClick={() => router.push('/admin/campaigns')}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit" disabled={loading}
          className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Guardando…' : mode === 'create' ? 'Crear campaña' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

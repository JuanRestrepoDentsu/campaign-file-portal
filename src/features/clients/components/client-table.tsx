'use client';

import {
  useState,
} from 'react';
import Link from 'next/link';
import {
  useRouter,
} from 'next/navigation';

import {
  ClientStatusBadge,
} from '@/features/clients/components/client-status-badge';
import type {
  ClientStatus,
  PortalClient,
} from '@/features/clients/types/client';

type ClientTableProps = {
  clients: PortalClient[];
};

type ApiResponse = {
  message?: string;
};

function formatDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    'es-CO',
    {
      dateStyle: 'medium',
      timeZone:
        'America/Bogota',
    },
  ).format(new Date(date));
}

export function ClientTable({
  clients,
}: ClientTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] =
    useState<number | null>(null);
  const [error, setError] =
    useState('');

  async function changeStatus(
    client: PortalClient,
    status: ClientStatus,
  ) {
    const action =
      status === 'active'
        ? 'activar'
        : 'desactivar';

    if (
      !window.confirm(
        `¿Deseas ${action} a ${client.name}?`,
      )
    ) {
      return;
    }

    setError('');
    setPendingId(client.id);

    try {
      const response = await fetch(
        `/api/admin/clients/${client.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const data =
        (await response.json()) as
          ApiResponse;

      if (!response.ok) {
        setError(
          data.message ??
            'No fue posible cambiar el estado.',
        );
        return;
      }

      router.refresh();
    } catch {
      setError(
        'No fue posible comunicarse con el servidor.',
      );
    } finally {
      setPendingId(null);
    }
  }

  if (clients.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="font-medium text-slate-800">
          No se encontraron clientes
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Ajusta los filtros o registra un nuevo cliente.
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actualizado
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {clients.map((client) => {
              const isPending =
                pendingId === client.id;
              const nextStatus:
                ClientStatus =
                client.status ===
                'active'
                  ? 'inactive'
                  : 'active';

              return (
                <tr
                  key={client.id}
                  className="hover:bg-slate-50/70"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {client.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      ID {client.id}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-slate-600">
                    {client.code}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <ClientStatusBadge
                      status={
                        client.status
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatDate(
                      client.updatedAt,
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/clients/${client.id}/edit`}
                        className="font-medium text-slate-700 transition hover:text-slate-950"
                      >
                        Editar
                      </Link>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          changeStatus(
                            client,
                            nextStatus,
                          )
                        }
                        className={[
                          'font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
                          client.status ===
                          'active'
                            ? 'text-red-700 hover:text-red-900'
                            : 'text-emerald-700 hover:text-emerald-900',
                        ].join(' ')}
                      >
                        {isPending
                          ? 'Guardando…'
                          : client.status ===
                              'active'
                            ? 'Desactivar'
                            : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

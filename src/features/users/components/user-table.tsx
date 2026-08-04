'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { UserStatusBadge } from '@/features/users/components/user-status-badge';
import type { PortalUser, PortalUserStatus } from '@/features/users/types/user';

type Props = { users: PortalUser[]; currentUserId: number };
type ApiResponse = { message?: string };

const ROLE_LABELS = {
  super_admin: 'Superadministrador',
  client_admin: 'Administrador de cliente',
  client_user: 'Usuario de cliente',
};

export function UserTable({ users, currentUserId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function requestAction(
    user: PortalUser,
    action: 'status' | 'resend-invitation' | 'sign-out',
    status?: Exclude<PortalUserStatus, 'invited'>,
  ) {
    const key = `${user.id}:${action}:${status ?? ''}`;
    setPending(key);
    setMessage('');
    try {
      const response = await fetch(
        action === 'status'
          ? `/api/admin/users/${user.id}/status`
          : `/api/admin/users/${user.id}/${action}`,
        {
          method: action === 'status' ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: action === 'status' ? JSON.stringify({ status }) : undefined,
        },
      );
      const data = (await response.json()) as ApiResponse;
      setMessage(data.message ?? (response.ok ? 'Operación completada.' : 'La operación falló.'));
      if (response.ok) router.refresh();
    } catch {
      setMessage('No fue posible comunicarse con el servidor.');
    } finally {
      setPending(null);
    }
  }

  if (!users.length) {
    return <div className="px-6 py-14 text-center text-slate-500">No se encontraron usuarios.</div>;
  }

  return (
    <>
      {message && <p role="status" className="border-b border-slate-200 px-6 py-3 text-sm text-slate-700">{message}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">Usuario</th>
              <th className="px-6 py-3">Rol / cliente</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const busy = pending?.startsWith(`${user.id}:`) ?? false;
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                    </p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <p>{ROLE_LABELS[user.role]}</p>
                    <p className="text-xs text-slate-500">{user.client?.name ?? 'Sin cliente'}</p>
                  </td>
                  <td className="px-6 py-4"><UserStatusBadge status={user.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap justify-end gap-3 text-sm font-medium">
                      <Link href={`/admin/users/${user.id}/edit`} className="text-slate-700 hover:text-slate-950">Editar</Link>
                      {user.status === 'invited' && (
                        <button disabled={busy} onClick={() => requestAction(user, 'resend-invitation')} className="text-amber-700 disabled:opacity-50">Reenviar</button>
                      )}
                      {user.status !== 'active' && (
                        <button disabled={busy} onClick={() => requestAction(user, 'status', 'active')} className="text-emerald-700 disabled:opacity-50">Activar</button>
                      )}
                      {user.status === 'active' && !isSelf && (
                        <button disabled={busy} onClick={() => requestAction(user, 'status', 'blocked')} className="text-red-700 disabled:opacity-50">Bloquear</button>
                      )}
                      {user.status !== 'inactive' && !isSelf && (
                        <button disabled={busy} onClick={() => requestAction(user, 'status', 'inactive')} className="text-slate-600 disabled:opacity-50">Desactivar</button>
                      )}
                      {user.status === 'active' && (
                        <button disabled={busy} onClick={() => requestAction(user, 'sign-out')} className="text-slate-600 disabled:opacity-50">Cerrar sesiones</button>
                      )}
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

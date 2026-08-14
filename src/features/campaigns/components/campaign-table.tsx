'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CampaignStatusBadge } from '@/features/campaigns/components/campaign-status-badge';
import type { CampaignStatus, PortalCampaign } from '@/features/campaigns/types/campaign';

export function CampaignTable({ campaigns }: { campaigns: PortalCampaign[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function changeStatus(campaign: PortalCampaign, status: CampaignStatus) {
    if (!window.confirm(`¿Deseas cambiar ${campaign.name} al estado ${status}?`)) return;
    setPendingId(campaign.id);
    setError('');
    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? 'No fue posible cambiar el estado.');
        return;
      }
      router.refresh();
    } catch {
      setError('No fue posible comunicarse con el servidor.');
    } finally {
      setPendingId(null);
    }
  }

  if (!campaigns.length) {
    return <div className="px-6 py-14 text-center text-slate-500">No se encontraron campañas.</div>;
  }

  return (
    <>
      {error && <div role="alert" className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Campaña', 'Cliente', 'Estado', 'Usuarios', 'Acciones'].map((label) => (
                <th key={label} className={`${label === 'Acciones' ? 'text-right' : 'text-left'} px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-slate-50/70">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">{campaign.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">{campaign.code}</p>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {campaign.client.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4"><CampaignStatusBadge status={campaign.status} /></td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{campaign.assignedUsers.length}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/campaigns/${campaign.id}/edit`} className="font-medium text-slate-700 hover:text-slate-950">Editar</Link>
                    {campaign.status !== 'active' && (
                      <button disabled={pendingId === campaign.id} onClick={() => changeStatus(campaign, 'active')} className="font-medium text-emerald-700 disabled:opacity-50">Activar</button>
                    )}
                    {campaign.status === 'active' && (
                      <button disabled={pendingId === campaign.id} onClick={() => changeStatus(campaign, 'inactive')} className="font-medium text-amber-700 disabled:opacity-50">Desactivar</button>
                    )}
                    {campaign.status !== 'archived' && (
                      <button disabled={pendingId === campaign.id} onClick={() => changeStatus(campaign, 'archived')} className="font-medium text-slate-600 disabled:opacity-50">Archivar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

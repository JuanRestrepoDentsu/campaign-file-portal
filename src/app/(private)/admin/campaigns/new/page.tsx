import Link from 'next/link';

import { CampaignForm } from '@/features/campaigns/components/campaign-form';
import { getRemoteCampaignOptions } from '@/shared/api/portal-data';
import { requireRole } from '@/shared/auth/authorization';

export default async function NewCampaignPage() {
  const [, options] = await Promise.all([
    requireRole(['super_admin']),
    getRemoteCampaignOptions(),
  ]);
  return (
    <main className="px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/campaigns" className="text-sm font-medium text-slate-600 hover:text-slate-950">← Volver a campañas</Link>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Nueva campaña</h1>
          <p className="mt-2 text-slate-600">Configura la campaña y sus usuarios iniciales.</p>
          <div className="mt-8"><CampaignForm mode="create" options={options} /></div>
        </div>
      </div>
    </main>
  );
}

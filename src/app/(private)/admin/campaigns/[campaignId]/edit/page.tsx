import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CampaignForm } from '@/features/campaigns/components/campaign-form';
import { campaignIdSchema } from '@/features/campaigns/schemas/campaign.schema';
import {
  getCampaign,
  getCampaignFormOptions,
} from '@/features/campaigns/services/get-campaigns';
import { requireRole } from '@/shared/auth/authorization';

type Props = { params: Promise<{ campaignId: string }> };

export default async function EditCampaignPage({ params }: Props) {
  await requireRole(['super_admin']);
  const id = campaignIdSchema.safeParse((await params).campaignId);
  if (!id.success) notFound();
  const [campaign, baseOptions] = await Promise.all([
    getCampaign(id.data),
    getCampaignFormOptions(),
  ]);
  if (!campaign) notFound();
  const options = {
    clients: baseOptions.clients.some((client) => client.id === campaign.client.id)
      ? baseOptions.clients
      : [...baseOptions.clients, campaign.client],
    users: baseOptions.users,
  };
  return (
    <main className="px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/campaigns" className="text-sm font-medium text-slate-600 hover:text-slate-950">← Volver a campañas</Link>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Editar campaña</h1>
          <p className="mt-2 text-slate-600">Actualiza la configuración y las asignaciones de {campaign.name}.</p>
          <div className="mt-8">
            <CampaignForm
              mode="edit"
              campaignId={campaign.id}
              options={options}
              initialValues={{
                clientId: String(campaign.client.id),
                name: campaign.name,
                code: campaign.code,
                description: campaign.description ?? '',
                status: campaign.status,
                userIds: campaign.assignedUsers.map((user) => user.id),
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

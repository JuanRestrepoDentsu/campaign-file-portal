import type { CampaignStatus } from '@/features/campaigns/types/campaign';

const STYLES: Record<CampaignStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-amber-100 text-amber-800',
  archived: 'bg-slate-200 text-slate-700',
};

const LABELS: Record<CampaignStatus, string> = {
  active: 'Activa',
  inactive: 'Inactiva',
  archived: 'Archivada',
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}

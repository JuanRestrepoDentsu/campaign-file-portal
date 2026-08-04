import type {
  ClientStatus,
} from '@/features/clients/types/client';

type ClientStatusBadgeProps = {
  status: ClientStatus;
};

export function ClientStatusBadge({
  status,
}: ClientStatusBadgeProps) {
  const isActive =
    status === 'active';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
          : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
      ].join(' ')}
    >
      {isActive
        ? 'Activo'
        : 'Inactivo'}
    </span>
  );
}

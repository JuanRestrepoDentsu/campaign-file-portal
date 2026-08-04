import type { PortalUserStatus } from '@/features/users/types/user';

const STATUS = {
  invited: ['Invitado', 'bg-amber-50 text-amber-700 ring-amber-200'],
  active: ['Activo', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
  blocked: ['Bloqueado', 'bg-red-50 text-red-700 ring-red-200'],
  inactive: ['Inactivo', 'bg-slate-100 text-slate-600 ring-slate-200'],
} as const;

export function UserStatusBadge({ status }: { status: PortalUserStatus }) {
  const [label, colors] = STATUS[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${colors}`}
    >
      {label}
    </span>
  );
}

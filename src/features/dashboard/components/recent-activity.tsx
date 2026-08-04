import type { DashboardActivity } from '@/features/dashboard/types/dashboard';

type Props = { activities: DashboardActivity[] };

const ACTION_LABELS: Record<string, string> = {
  client_created: 'creó un cliente',
  client_updated: 'actualizó un cliente',
  client_activated: 'activó un cliente',
  client_deactivated: 'desactivó un cliente',
  user_created: 'creó un usuario',
  user_updated: 'actualizó un usuario',
  user_activated: 'activó un usuario',
  user_blocked: 'bloqueó un usuario',
  user_deactivated: 'desactivó un usuario',
  user_invitation_resent: 'reenvió una invitación',
  user_sessions_revoked: 'cerró las sesiones de un usuario',
  campaign_created: 'creó una campaña',
  campaign_updated: 'actualizó una campaña',
};

function label(action: string) {
  return ACTION_LABELS[action] ?? action.replaceAll('_', ' ');
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(date));
}

export function RecentActivity({ activities }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-950">Actividad reciente</h2>
        <p className="mt-1 text-sm text-slate-500">Últimas acciones administrativas registradas.</p>
      </div>
      {!activities.length ? (
        <div className="px-6 py-12 text-center">
          <p className="font-medium text-slate-700">Aún no hay actividad registrada</p>
          <p className="mt-1 text-sm text-slate-500">Las acciones administrativas aparecerán aquí.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-start justify-between gap-5 px-6 py-4">
              <div className="min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-medium text-slate-950">{activity.actorName ?? 'Sistema'}</span>{' '}
                  {label(activity.action)}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {activity.entityType}{activity.entityId ? ` · ${activity.entityId}` : ''}
                </p>
              </div>
              <time className="shrink-0 text-xs text-slate-500">{formatDate(activity.createdAt)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

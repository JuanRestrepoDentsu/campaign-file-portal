import {
  CampaignsIcon,
  ClientsIcon,
  UploadsIcon,
  UsersIcon,
} from '@/features/dashboard/components/dashboard-icons';
import {
  DashboardStatCard,
} from '@/features/dashboard/components/dashboard-stat-card';
import {
  QuickActionCard,
} from '@/features/dashboard/components/quick-action-card';
import {
  RecentActivity,
} from '@/features/dashboard/components/recent-activity';
import {
  getAdminDashboard,
} from '@/features/dashboard/services/get-admin-dashboard';
import {
  requireRole,
} from '@/shared/auth/authorization';

export default async function AdminDashboardPage() {
  const [user, dashboard] = await Promise.all([
    requireRole(['super_admin']),
    getAdminDashboard(),
  ]);

  const fullName =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ') || user.email;

  return (
    <main className="px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section>
          <p className="text-sm font-medium text-slate-500">
            Administración
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Bienvenido, {fullName}
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Consulta el estado general de la plataforma y
            administra clientes, usuarios y campañas.
          </p>
        </section>

        <section
          aria-label="Resumen de la plataforma"
          className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <DashboardStatCard
            title="Clientes activos"
            value={dashboard.summary.activeClients}
            description="Organizaciones habilitadas"
            href="/admin/clients"
            icon={<ClientsIcon />}
          />

          <DashboardStatCard
            title="Usuarios"
            value={dashboard.summary.totalUsers}
            description="Usuarios activos e invitados"
            href="/admin/users"
            icon={<UsersIcon />}
          />

          <DashboardStatCard
            title="Campañas activas"
            value={dashboard.summary.activeCampaigns}
            description="Campañas disponibles"
            href="/admin/campaigns"
            icon={<CampaignsIcon />}
          />

          <DashboardStatCard
            title="Cargas"
            value={dashboard.summary.totalUploads}
            description="Archivos procesados"
            icon={<UploadsIcon />}
          />
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <RecentActivity
            activities={dashboard.recentActivity}
          />

          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Acciones rápidas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Accede a las tareas administrativas más
                frecuentes.
              </p>
            </div>

            <div className="space-y-4">
              <QuickActionCard
                title="Crear cliente"
                description="Registra una nueva organización."
                href="/admin/clients/new"
                icon={<ClientsIcon />}
              />

              <QuickActionCard
                title="Crear usuario"
                description="Invita un usuario mediante Cognito."
                href="/admin/users/new"
                icon={<UsersIcon />}
                disabled
              />

              <QuickActionCard
                title="Crear campaña"
                description="Configura una campaña para un cliente."
                href="/admin/campaigns/new"
                icon={<CampaignsIcon />}
                disabled
              />

              <QuickActionCard
                title="Cargar archivo"
                description="Procesa un archivo CSV."
                href="/portal/uploads/new"
                icon={<UploadsIcon />}
                disabled
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
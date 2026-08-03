export type DashboardSummary = {
  activeClients: number;
  totalUsers: number;
  activeCampaigns: number;
  totalUploads: number;
};

export type DashboardActivity = {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  actorName: string | null;
  createdAt: Date;
};

export type AdminDashboardData = {
  summary: DashboardSummary;
  recentActivity: DashboardActivity[];
};
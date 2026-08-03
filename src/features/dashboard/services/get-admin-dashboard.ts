import {
  getDashboardSummary,
  getRecentDashboardActivity,
} from '@/features/dashboard/repositories/dashboard.repository';
import type {
  AdminDashboardData,
} from '@/features/dashboard/types/dashboard';

export async function getAdminDashboard():
  Promise<AdminDashboardData> {
  const [
    summary,
    recentActivity,
  ] = await Promise.all([
    getDashboardSummary(),
    getRecentDashboardActivity(8),
  ]);

  return {
    summary,
    recentActivity,
  };
}
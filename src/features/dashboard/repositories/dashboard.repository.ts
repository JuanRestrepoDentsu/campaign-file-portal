import type { RowDataPacket } from 'mysql2';
import type { DashboardActivity, DashboardSummary } from '@/features/dashboard/types/dashboard';
import { db } from '@/shared/database/mysql';
interface SummaryRow extends RowDataPacket{active_clients:number;total_users:number;active_campaigns:number;total_uploads:number}
interface ActivityRow extends RowDataPacket{id:number;action:string;entity_type:string;entity_id:string|null;actor_name:string|null;created_at:Date}
export async function getDashboardSummary():Promise<DashboardSummary>{const[rows]=await db.query<SummaryRow[]>(`SELECT
 (SELECT COUNT(*) FROM portal_clients WHERE status='active') active_clients,
 (SELECT COUNT(*) FROM portal_users WHERE status IN ('active','invited')) total_users,
 (SELECT COUNT(*) FROM portal_campaigns WHERE status='active') active_campaigns,
 (SELECT COUNT(*) FROM portal_file_uploads WHERE status IN ('completed','completed_with_errors')) total_uploads`);const row=rows[0];return{activeClients:Number(row?.active_clients??0),totalUsers:Number(row?.total_users??0),activeCampaigns:Number(row?.active_campaigns??0),totalUploads:Number(row?.total_uploads??0)}}
export async function getRecentDashboardActivity(limit=8):Promise<DashboardActivity[]>{const safe=Math.min(Math.max(Math.trunc(limit),1),20);const[rows]=await db.query<ActivityRow[]>(`SELECT audit.id,audit.action,audit.entity_type,audit.entity_id,CASE WHEN users.id IS NULL THEN NULL ELSE TRIM(CONCAT(users.first_name,' ',COALESCE(users.last_name,''))) END actor_name,audit.created_at FROM portal_audit_logs audit LEFT JOIN portal_users users ON users.id=audit.actor_user_id ORDER BY audit.created_at DESC LIMIT ${safe}`);return rows.map((row)=>({id:row.id,action:row.action,entityType:row.entity_type,entityId:row.entity_id,actorName:row.actor_name,createdAt:row.created_at}))}

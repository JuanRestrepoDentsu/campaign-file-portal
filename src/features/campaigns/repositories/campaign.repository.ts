import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import type {
  CampaignFormOptions,
  CampaignListFilters,
  CampaignMutationInput,
  CampaignStatus,
  CampaignUserSummary,
  PaginatedCampaigns,
  PortalCampaign,
} from '@/features/campaigns/types/campaign';
import { db } from '@/shared/database/mysql';

interface CampaignRow extends RowDataPacket {
  id: number;
  client_id: number;
  client_name: string;
  client_code: string;
  client_status: 'active' | 'inactive';
  name: string;
  code: string;
  description: string | null;
  status: CampaignStatus;
  created_at: Date;
  updated_at: Date;
}

interface UserRow extends RowDataPacket {
  id: number;
  campaign_id?: number;
  client_id: number;
  email: string;
  first_name: string;
  last_name: string | null;
  status: CampaignUserSummary['status'];
}

interface ClientRow extends RowDataPacket {
  id: number;
  name: string;
  code: string;
  status: 'active' | 'inactive';
}

interface CountRow extends RowDataPacket { total: number }

function mapUser(row: UserRow): CampaignUserSummary {
  return {
    id: Number(row.id),
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    status: row.status,
  };
}

function mapCampaign(row: CampaignRow, users: CampaignUserSummary[]): PortalCampaign {
  return {
    id: Number(row.id),
    client: {
      id: Number(row.client_id),
      name: row.client_name,
      code: row.client_code,
      status: row.client_status,
    },
    name: row.name,
    code: row.code,
    description: row.description,
    status: row.status,
    assignedUsers: users,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildFilters(filters: CampaignListFilters) {
  const conditions: string[] = [];
  const values: Array<string | number> = [];
  if (filters.search) {
    conditions.push('(campaigns.name LIKE ? OR campaigns.code LIKE ?)');
    const term = `%${filters.search}%`;
    values.push(term, term);
  }
  if (filters.status !== 'all') {
    conditions.push('campaigns.status = ?');
    values.push(filters.status);
  }
  if (filters.clientId !== null) {
    conditions.push('campaigns.client_id = ?');
    values.push(filters.clientId);
  }
  return {
    sql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

async function findAssignedUsersByCampaignIds(campaignIds: number[]) {
  const result = new Map<number, CampaignUserSummary[]>();
  if (!campaignIds.length) return result;
  const placeholders = campaignIds.map(() => '?').join(', ');
  const [rows] = await db.query<UserRow[]>(
    `
      SELECT assignments.campaign_id, users.id, users.client_id, users.email,
        users.first_name, users.last_name, users.status
      FROM portal_user_campaigns AS assignments
      INNER JOIN portal_users AS users ON users.id = assignments.user_id
      WHERE assignments.campaign_id IN (${placeholders})
      ORDER BY users.first_name ASC, users.last_name ASC, users.id ASC
    `,
    campaignIds,
  );
  for (const row of rows) {
    const id = Number(row.campaign_id);
    const users = result.get(id) ?? [];
    users.push(mapUser(row));
    result.set(id, users);
  }
  return result;
}

const CAMPAIGN_SELECT = `
  SELECT campaigns.id, campaigns.client_id, clients.name AS client_name,
    clients.code AS client_code, clients.status AS client_status,
    campaigns.name, campaigns.code, campaigns.description, campaigns.status,
    campaigns.created_at, campaigns.updated_at
  FROM portal_campaigns AS campaigns
  INNER JOIN portal_clients AS clients ON clients.id = campaigns.client_id
`;

export async function findCampaigns(filters: CampaignListFilters): Promise<PaginatedCampaigns> {
  const where = buildFilters(filters);
  const [countRows] = await db.execute<CountRow[]>(
    `SELECT COUNT(*) AS total FROM portal_campaigns AS campaigns ${where.sql}`,
    where.values,
  );
  const totalItems = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const offset = (page - 1) * filters.pageSize;
  const [rows] = await db.query<CampaignRow[]>(
    `${CAMPAIGN_SELECT} ${where.sql}
     ORDER BY campaigns.name ASC, campaigns.id ASC LIMIT ? OFFSET ?`,
    [...where.values, filters.pageSize, offset],
  );
  const userMap = await findAssignedUsersByCampaignIds(rows.map((row) => Number(row.id)));
  return {
    items: rows.map((row) => mapCampaign(row, userMap.get(Number(row.id)) ?? [])),
    pagination: { page, pageSize: filters.pageSize, totalItems, totalPages },
    filters,
  };
}

export async function findCampaignById(campaignId: number): Promise<PortalCampaign | null> {
  const [rows] = await db.execute<CampaignRow[]>(
    `${CAMPAIGN_SELECT} WHERE campaigns.id = ? LIMIT 1`,
    [campaignId],
  );
  const row = rows[0];
  if (!row) return null;
  const users = await findAssignedUsersByCampaignIds([campaignId]);
  return mapCampaign(row, users.get(campaignId) ?? []);
}

export async function findCampaignByIdForUpdate(
  connection: PoolConnection,
  campaignId: number,
): Promise<PortalCampaign | null> {
  const [rows] = await connection.execute<CampaignRow[]>(
    `${CAMPAIGN_SELECT} WHERE campaigns.id = ? LIMIT 1 FOR UPDATE`,
    [campaignId],
  );
  const row = rows[0];
  if (!row) return null;
  const [userRows] = await connection.execute<UserRow[]>(
    `SELECT users.id, users.client_id, users.email, users.first_name,
      users.last_name, users.status
     FROM portal_user_campaigns AS assignments
     INNER JOIN portal_users AS users ON users.id = assignments.user_id
     WHERE assignments.campaign_id = ?
     ORDER BY users.first_name ASC, users.last_name ASC`,
    [campaignId],
  );
  return mapCampaign(row, userRows.map(mapUser));
}

export async function insertCampaign(
  connection: PoolConnection,
  input: CampaignMutationInput,
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO portal_campaigns (client_id, name, code, description, status)
     VALUES (?, ?, ?, ?, ?)`,
    [input.clientId, input.name, input.code, input.description, input.status],
  );
  return result.insertId;
}

export async function updateCampaignById(
  connection: PoolConnection,
  campaignId: number,
  input: CampaignMutationInput,
): Promise<void> {
  await connection.execute(
    `UPDATE portal_campaigns SET client_id = ?, name = ?, code = ?,
      description = ?, status = ? WHERE id = ?`,
    [input.clientId, input.name, input.code, input.description, input.status, campaignId],
  );
}

export async function updateCampaignStatus(
  connection: PoolConnection,
  campaignId: number,
  status: CampaignStatus,
): Promise<void> {
  await connection.execute('UPDATE portal_campaigns SET status = ? WHERE id = ?', [status, campaignId]);
}

export async function replaceCampaignUsers(
  connection: PoolConnection,
  campaignId: number,
  userIds: number[],
): Promise<void> {
  await connection.execute('DELETE FROM portal_user_campaigns WHERE campaign_id = ?', [campaignId]);
  if (!userIds.length) return;
  const placeholders = userIds.map(() => '(?, ?)').join(', ');
  const values = userIds.flatMap((userId) => [userId, campaignId]);
  await connection.query(
    `INSERT INTO portal_user_campaigns (user_id, campaign_id) VALUES ${placeholders}`,
    values,
  );
}

export async function isActiveClient(clientId: number): Promise<boolean> {
  const [rows] = await db.execute<CountRow[]>(
    `SELECT COUNT(*) AS total FROM portal_clients WHERE id = ? AND status = 'active'`,
    [clientId],
  );
  return Number(rows[0]?.total ?? 0) === 1;
}

export async function countValidUsers(clientId: number, userIds: number[]): Promise<number> {
  if (!userIds.length) return 0;
  const placeholders = userIds.map(() => '?').join(', ');
  const [rows] = await db.query<CountRow[]>(
    `SELECT COUNT(*) AS total FROM portal_users
     WHERE client_id = ? AND role <> 'super_admin'
       AND id IN (${placeholders})`,
    [clientId, ...userIds],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function getCampaignFormOptions(): Promise<CampaignFormOptions> {
  const [[clients], [users]] = await Promise.all([
    db.query<ClientRow[]>(
      `SELECT id, name, code, status FROM portal_clients ORDER BY name ASC`,
    ),
    db.query<UserRow[]>(
      `SELECT id, client_id, email, first_name, last_name, status
       FROM portal_users WHERE client_id IS NOT NULL
         AND role <> 'super_admin'
       ORDER BY first_name ASC, last_name ASC, id ASC`,
    ),
  ]);
  return {
    clients: clients.map((row) => ({
      id: Number(row.id), name: row.name, code: row.code, status: row.status,
    })),
    users: users.map((row) => ({ ...mapUser(row), clientId: Number(row.client_id) })),
  };
}

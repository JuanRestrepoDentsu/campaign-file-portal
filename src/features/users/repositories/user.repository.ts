import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';

import type {
  CreateUserMutation,
  PaginatedUsers,
  PortalUser,
  PortalUserRole,
  PortalUserStatus,
  UserBusinessInput,
  UserCampaignSummary,
  UserFormOptions,
  UserListFilters,
} from '@/features/users/types/user';
import { db } from '@/shared/database/mysql';

export type {
  PortalUserRole,
  PortalUserStatus,
} from '@/features/users/types/user';

export type AuthenticatedPortalUser = {
  id: number;
  cognitoSub: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: PortalUserRole;
  status: PortalUserStatus;
  client: {
    id: number;
    name: string;
    code: string;
  } | null;
  campaigns: UserCampaignSummary[];
};

interface UserRow extends RowDataPacket {
  id: number;
  cognito_sub: string;
  email: string;
  first_name: string;
  last_name: string | null;
  role: PortalUserRole;
  status: PortalUserStatus;
  client_id: number | null;
  client_name: string | null;
  client_code: string | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface CampaignRow extends RowDataPacket {
  id: number;
  name: string;
  code: string;
  client_id?: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface ClientRow extends RowDataPacket {
  id: number;
  name: string;
  code: string;
}

function mapUser(row: UserRow, campaigns: UserCampaignSummary[]): PortalUser {
  return {
    id: Number(row.id),
    cognitoSub: row.cognito_sub,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    status: row.status,
    client:
      row.client_id && row.client_name && row.client_code
        ? {
            id: Number(row.client_id),
            name: row.client_name,
            code: row.client_code,
          }
        : null,
    campaigns,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildFilters(filters: UserListFilters): {
  sql: string;
  values: Array<string | number>;
} {
  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (filters.search) {
    conditions.push(`(
      users.email LIKE ? OR
      users.first_name LIKE ? OR
      users.last_name LIKE ?
    )`);
    const term = `%${filters.search}%`;
    values.push(term, term, term);
  }

  if (filters.role !== 'all') {
    conditions.push('users.role = ?');
    values.push(filters.role);
  }

  if (filters.status !== 'all') {
    conditions.push('users.status = ?');
    values.push(filters.status);
  }

  if (filters.clientId !== null) {
    conditions.push('users.client_id = ?');
    values.push(filters.clientId);
  }

  return {
    sql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

async function findCampaignsByUserIds(
  userIds: number[],
): Promise<Map<number, UserCampaignSummary[]>> {
  const result = new Map<number, UserCampaignSummary[]>();

  if (userIds.length === 0) {
    return result;
  }

  const placeholders = userIds.map(() => '?').join(', ');
  const [rows] = await db.query<
    Array<CampaignRow & { user_id: number }>
  >(
    `
      SELECT
        assignments.user_id,
        campaigns.id,
        campaigns.name,
        campaigns.code
      FROM portal_user_campaigns AS assignments
      INNER JOIN portal_campaigns AS campaigns
        ON campaigns.id = assignments.campaign_id
      WHERE assignments.user_id IN (${placeholders})
      ORDER BY campaigns.name ASC
    `,
    userIds,
  );

  for (const row of rows) {
    const campaigns = result.get(Number(row.user_id)) ?? [];
    campaigns.push({
      id: Number(row.id),
      name: row.name,
      code: row.code,
    });
    result.set(Number(row.user_id), campaigns);
  }

  return result;
}

export async function findUsers(
  filters: UserListFilters,
): Promise<PaginatedUsers> {
  const where = buildFilters(filters);
  const [countRows] = await db.execute<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM portal_users AS users
      ${where.sql}
    `,
    where.values,
  );
  const totalItems = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const offset = (page - 1) * filters.pageSize;

  const [rows] = await db.query<UserRow[]>(
    `
      SELECT
        users.id,
        users.cognito_sub,
        users.email,
        users.first_name,
        users.last_name,
        users.role,
        users.status,
        users.client_id,
        clients.name AS client_name,
        clients.code AS client_code,
        users.last_login_at,
        users.created_at,
        users.updated_at
      FROM portal_users AS users
      LEFT JOIN portal_clients AS clients
        ON clients.id = users.client_id
      ${where.sql}
      ORDER BY users.first_name ASC, users.last_name ASC, users.id ASC
      LIMIT ? OFFSET ?
    `,
    [...where.values, filters.pageSize, offset],
  );

  const campaignMap = await findCampaignsByUserIds(
    rows.map((row) => Number(row.id)),
  );

  return {
    items: rows.map((row) =>
      mapUser(row, campaignMap.get(Number(row.id)) ?? []),
    ),
    pagination: { page, pageSize: filters.pageSize, totalItems, totalPages },
    filters,
  };
}

async function findUserRow(
  executor: Pick<PoolConnection, 'execute'> | typeof db,
  userId: number,
  forUpdate = false,
): Promise<UserRow | null> {
  const [rows] = await executor.execute<UserRow[]>(
    `
      SELECT
        users.id,
        users.cognito_sub,
        users.email,
        users.first_name,
        users.last_name,
        users.role,
        users.status,
        users.client_id,
        clients.name AS client_name,
        clients.code AS client_code,
        users.last_login_at,
        users.created_at,
        users.updated_at
      FROM portal_users AS users
      LEFT JOIN portal_clients AS clients
        ON clients.id = users.client_id
      WHERE users.id = ?
      LIMIT 1
      ${forUpdate ? 'FOR UPDATE' : ''}
    `,
    [userId],
  );
  return rows[0] ?? null;
}

async function findCampaignsWithConnection(
  connection: PoolConnection,
  userId: number,
): Promise<UserCampaignSummary[]> {
  const [rows] = await connection.execute<CampaignRow[]>(
    `
      SELECT campaigns.id, campaigns.name, campaigns.code
      FROM portal_campaigns AS campaigns
      INNER JOIN portal_user_campaigns AS assignments
        ON assignments.campaign_id = campaigns.id
      WHERE assignments.user_id = ?
      ORDER BY campaigns.name ASC
    `,
    [userId],
  );
  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    code: row.code,
  }));
}

export async function findUserById(userId: number): Promise<PortalUser | null> {
  const row = await findUserRow(db, userId);
  if (!row) return null;
  const campaigns = await findCampaignsByUserIds([userId]);
  return mapUser(row, campaigns.get(userId) ?? []);
}

export async function findUserByIdForUpdate(
  connection: PoolConnection,
  userId: number,
): Promise<PortalUser | null> {
  const row = await findUserRow(connection, userId, true);
  if (!row) return null;
  return mapUser(row, await findCampaignsWithConnection(connection, userId));
}

export async function findUserByCognitoSub(
  cognitoSub: string,
): Promise<AuthenticatedPortalUser | null> {
  const [rows] = await db.execute<UserRow[]>(
    `
      SELECT
        users.id,
        users.cognito_sub,
        users.email,
        users.first_name,
        users.last_name,
        users.role,
        users.status,
        users.client_id,
        clients.name AS client_name,
        clients.code AS client_code,
        users.last_login_at,
        users.created_at,
        users.updated_at
      FROM portal_users AS users
      LEFT JOIN portal_clients AS clients ON clients.id = users.client_id
      WHERE users.cognito_sub = ?
      LIMIT 1
    `,
    [cognitoSub],
  );
  const row = rows[0];
  if (!row) return null;
  const campaigns = await findCampaignsByUserIds([Number(row.id)]);
  const user = mapUser(row, campaigns.get(Number(row.id)) ?? []);
  return {
    id: user.id,
    cognitoSub: user.cognitoSub,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    client: user.client,
    campaigns: user.campaigns,
  };
}

export async function insertUser(
  connection: PoolConnection,
  input: CreateUserMutation,
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
      INSERT INTO portal_users (
        cognito_sub, client_id, email, first_name, last_name, role, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.cognitoSub,
      input.clientId,
      input.email,
      input.firstName,
      input.lastName,
      input.role,
      input.status,
    ],
  );
  return result.insertId;
}

export async function updateUserBusinessData(
  connection: PoolConnection,
  userId: number,
  input: UserBusinessInput,
): Promise<void> {
  await connection.execute(
    `
      UPDATE portal_users
      SET first_name = ?, last_name = ?, role = ?, client_id = ?
      WHERE id = ?
    `,
    [input.firstName, input.lastName, input.role, input.clientId, userId],
  );
}

export async function replaceUserCampaigns(
  connection: PoolConnection,
  userId: number,
  campaignIds: number[],
): Promise<void> {
  await connection.execute(
    'DELETE FROM portal_user_campaigns WHERE user_id = ?',
    [userId],
  );
  if (campaignIds.length === 0) return;
  const placeholders = campaignIds.map(() => '(?, ?)').join(', ');
  const values = campaignIds.flatMap((campaignId) => [userId, campaignId]);
  await connection.query(
    `INSERT INTO portal_user_campaigns (user_id, campaign_id) VALUES ${placeholders}`,
    values,
  );
}

export async function updateUserStatus(
  connection: PoolConnection,
  userId: number,
  status: PortalUserStatus,
): Promise<void> {
  await connection.execute(
    'UPDATE portal_users SET status = ? WHERE id = ?',
    [status, userId],
  );
}

export async function updateUserLastLogin(userId: number): Promise<void> {
  await db.execute(
    'UPDATE portal_users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?',
    [userId],
  );
}

export async function activateInvitedUserByCognitoSub(
  cognitoSub: string,
): Promise<void> {
  await db.execute(
    `
      UPDATE portal_users
      SET status = 'active'
      WHERE cognito_sub = ? AND status = 'invited'
    `,
    [cognitoSub],
  );
}

export async function isActiveClient(clientId: number): Promise<boolean> {
  const [rows] = await db.execute<CountRow[]>(
    `SELECT COUNT(*) AS total FROM portal_clients WHERE id = ? AND status = 'active'`,
    [clientId],
  );
  return Number(rows[0]?.total ?? 0) === 1;
}

export async function countValidCampaigns(
  clientId: number,
  campaignIds: number[],
): Promise<number> {
  if (campaignIds.length === 0) return 0;
  const placeholders = campaignIds.map(() => '?').join(', ');
  const [rows] = await db.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM portal_campaigns
      WHERE client_id = ? AND status = 'active' AND id IN (${placeholders})
    `,
    [clientId, ...campaignIds],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function getUserFormOptions(): Promise<UserFormOptions> {
  const [[clients], [campaigns]] = await Promise.all([
    db.query<ClientRow[]>(
      `SELECT id, name, code FROM portal_clients WHERE status = 'active' ORDER BY name ASC`,
    ),
    db.query<CampaignRow[]>(
      `
        SELECT id, client_id, name, code
        FROM portal_campaigns
        WHERE status = 'active'
        ORDER BY name ASC
      `,
    ),
  ]);
  return {
    clients: clients.map((row) => ({
      id: Number(row.id),
      name: row.name,
      code: row.code,
    })),
    campaigns: campaigns.map((row) => ({
      id: Number(row.id),
      clientId: Number(row.client_id),
      name: row.name,
      code: row.code,
    })),
  };
}

import type { RowDataPacket } from 'mysql2';

import { db } from '@/shared/database/mysql';

export type PortalUserRole =
  | 'super_admin'
  | 'client_admin'
  | 'client_user';

export type PortalUserStatus =
  | 'invited'
  | 'active'
  | 'blocked'
  | 'inactive';

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

  campaigns: Array<{
    id: number;
    name: string;
    code: string;
  }>;
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
}

interface CampaignRow extends RowDataPacket {
  id: number;
  name: string;
  code: string;
}

export async function findUserByCognitoSub(
  cognitoSub: string,
): Promise<AuthenticatedPortalUser | null> {
  const [userRows] = await db.execute<UserRow[]>(
    `
      SELECT
        users.id,
        users.cognito_sub,
        users.email,
        users.first_name,
        users.last_name,
        users.role,
        users.status,

        clients.id AS client_id,
        clients.name AS client_name,
        clients.code AS client_code

      FROM portal_users AS users

      LEFT JOIN portal_clients AS clients
        ON clients.id = users.client_id

      WHERE users.cognito_sub = ?
      LIMIT 1
    `,
    [cognitoSub],
  );

  const row = userRows[0];

  if (!row) {
    return null;
  }

  const [campaignRows] = await db.execute<CampaignRow[]>(
    `
      SELECT
        campaigns.id,
        campaigns.name,
        campaigns.code

      FROM portal_campaigns AS campaigns

      INNER JOIN portal_user_campaigns AS assignments
        ON assignments.campaign_id = campaigns.id

      WHERE assignments.user_id = ?
        AND campaigns.status = 'active'

      ORDER BY campaigns.name ASC
    `,
    [row.id],
  );

  return {
    id: row.id,
    cognitoSub: row.cognito_sub,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    status: row.status,

    client:
      row.client_id &&
      row.client_name &&
      row.client_code
        ? {
            id: row.client_id,
            name: row.client_name,
            code: row.client_code,
          }
        : null,

    campaigns: campaignRows.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      code: campaign.code,
    })),
  };
}

export async function updateUserLastLogin(
  userId: number,
): Promise<void> {
  await db.execute(
    `
      UPDATE portal_users
      SET last_login_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    [userId],
  );
}
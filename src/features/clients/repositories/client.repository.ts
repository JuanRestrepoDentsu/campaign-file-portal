import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';

import type {
  ClientListFilters,
  ClientMutationInput,
  ClientStatus,
  PaginatedClients,
  PortalClient,
} from '@/features/clients/types/client';
import {
  db,
} from '@/shared/database/mysql';

interface ClientRow
  extends RowDataPacket {
  id: number;
  name: string;
  code: string;
  status: ClientStatus;
  created_at: Date;
  updated_at: Date;
}

interface CountRow
  extends RowDataPacket {
  total: number;
}

function mapClient(
  row: ClientRow,
): PortalClient {
  return {
    id: Number(row.id),
    name: row.name,
    code: row.code,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildFilters(
  filters: ClientListFilters,
): {
  sql: string;
  values: Array<
    string | number
  >;
} {
  const conditions: string[] = [];
  const values: Array<
    string | number
  > = [];

  if (filters.search) {
    conditions.push(
      '(name LIKE ? OR code LIKE ?)',
    );

    const term =
      `%${filters.search}%`;

    values.push(term, term);
  }

  if (filters.status !== 'all') {
    conditions.push(
      'status = ?',
    );

    values.push(filters.status);
  }

  return {
    sql:
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '',
    values,
  };
}

export async function findClients(
  filters: ClientListFilters,
): Promise<PaginatedClients> {
  const where =
    buildFilters(filters);

  const [countRows] =
    await db.execute<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM portal_clients
        ${where.sql}
      `,
      where.values,
    );

  const totalItems = Number(
    countRows[0]?.total ?? 0,
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalItems /
        filters.pageSize,
    ),
  );

  const page = Math.min(
    filters.page,
    totalPages,
  );

  const offset =
    (page - 1) *
    filters.pageSize;

  const [rows] =
    await db.query<ClientRow[]>(
      `
        SELECT
          id,
          name,
          code,
          status,
          created_at,
          updated_at
        FROM portal_clients
        ${where.sql}
        ORDER BY name ASC, id ASC
        LIMIT ? OFFSET ?
      `,
      [
        ...where.values,
        filters.pageSize,
        offset,
      ],
    );

  return {
    items: rows.map(mapClient),
    pagination: {
      page,
      pageSize: filters.pageSize,
      totalItems,
      totalPages,
    },
    filters: {
      search: filters.search,
      status: filters.status,
    },
  };
}

export async function findClientById(
  clientId: number,
): Promise<PortalClient | null> {
  const [rows] =
    await db.execute<ClientRow[]>(
      `
        SELECT
          id,
          name,
          code,
          status,
          created_at,
          updated_at
        FROM portal_clients
        WHERE id = ?
        LIMIT 1
      `,
      [clientId],
    );

  return rows[0]
    ? mapClient(rows[0])
    : null;
}

export async function findClientByIdForUpdate(
  connection: PoolConnection,
  clientId: number,
): Promise<PortalClient | null> {
  const [rows] =
    await connection.execute<
      ClientRow[]
    >(
      `
        SELECT
          id,
          name,
          code,
          status,
          created_at,
          updated_at
        FROM portal_clients
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [clientId],
    );

  return rows[0]
    ? mapClient(rows[0])
    : null;
}

export async function insertClient(
  connection: PoolConnection,
  input: ClientMutationInput,
): Promise<number> {
  const [result] =
    await connection.execute<
      ResultSetHeader
    >(
      `
        INSERT INTO portal_clients (
          name,
          code,
          status
        )
        VALUES (?, ?, ?)
      `,
      [
        input.name,
        input.code,
        input.status,
      ],
    );

  return result.insertId;
}

export async function updateClientById(
  connection: PoolConnection,
  clientId: number,
  input: ClientMutationInput,
): Promise<void> {
  await connection.execute(
    `
      UPDATE portal_clients
      SET
        name = ?,
        code = ?,
        status = ?
      WHERE id = ?
    `,
    [
      input.name,
      input.code,
      input.status,
      clientId,
    ],
  );
}
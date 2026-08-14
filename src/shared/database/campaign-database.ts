import mysql from 'mysql2/promise';
import { env } from '@/shared/config/env';

const pools = new Map<string, mysql.Pool>();

export function assertDatabaseName(code: string): string {
  if (!/^[A-Z0-9]+(?:[_-][A-Z0-9]+)*$/i.test(code)) {
    throw new Error('El código de campaña no es un nombre de base seguro.');
  }

  return code.toLowerCase();
}

export function getCampaignDatabase(code: string): mysql.Pool {
  const database = assertDatabaseName(code);
  const existing = pools.get(database);
  if (existing) return existing;
  const pool = mysql.createPool({
    host: env.DB_HOST, port: env.DB_PORT, user: env.DB_USER,
    password: env.DB_PASSWORD, database, waitForConnections: true,
    connectionLimit: 5, queueLimit: 0, charset: 'utf8mb4', timezone: 'Z',
    enableKeepAlive: true,
  });
  pools.set(database, pool);
  return pool;
}

export function quoteIdentifier(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error('Identificador SQL inválido.');
  return `\`${value}\``;
}

import mysql from 'mysql2/promise';

import { env } from '@/shared/config/env';

const globalForMySQL = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    charset: 'utf8mb4',
    timezone: 'Z',

    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

export const db =
  globalForMySQL.mysqlPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalForMySQL.mysqlPool = db;
}
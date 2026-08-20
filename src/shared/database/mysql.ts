import mysql from 'mysql2/promise';

import { databaseEnv } from '@/shared/config/database-env';

const globalForMySQL = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: databaseEnv.DB_HOST,
    port: databaseEnv.DB_PORT,
    database: databaseEnv.DB_NAME,
    user: databaseEnv.DB_USER,
    password: databaseEnv.DB_PASSWORD,

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

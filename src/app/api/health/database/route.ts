import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

import { db } from '@/lib/database/mysql';

export async function GET() {
  try {
    const [rows] = await db.query<(RowDataPacket & {
      databaseName: string;
      currentTime: Date;
    })[]>(
      `
        SELECT
          DATABASE() AS databaseName,
          UTC_TIMESTAMP() AS currentTime
      `,
    );

    return NextResponse.json({
      healthy: true,
      database: rows[0]?.databaseName,
      currentTime: rows[0]?.currentTime,
    });
  } catch (error) {
    console.error('Database health error:', error);

    return NextResponse.json(
      {
        healthy: false,
        message: 'No fue posible conectar con la base de datos.',
      },
      { status: 500 },
    );
  }
}
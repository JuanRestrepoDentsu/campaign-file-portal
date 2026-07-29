import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.delete('access_token');
  cookieStore.delete('id_token');
  cookieStore.delete('refresh_token');
  cookieStore.delete('cognito_challenge_session');
  cookieStore.delete('cognito_challenge_username');

  return NextResponse.json({
    success: true,
  });
}
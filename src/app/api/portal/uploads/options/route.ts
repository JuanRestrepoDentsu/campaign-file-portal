import { NextResponse } from 'next/server';
import { findAccessibleCampaigns } from '@/features/uploads/repositories/upload.repository';
import { authorizeApiRoles } from '@/shared/auth/api-authorization';

export async function GET(){const auth=await authorizeApiRoles(['super_admin','client_admin','client_user']);if(!auth.authorized)return auth.response;return NextResponse.json({campaigns:await findAccessibleCampaigns(auth.user)});}

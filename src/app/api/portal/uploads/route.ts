import { NextResponse } from 'next/server';
import { findUploads } from '@/features/uploads/repositories/upload.repository';
import { uploadListSchema } from '@/features/uploads/schemas/upload.schema';
import { authorizeApiRoles } from '@/shared/auth/api-authorization';

export async function GET(request:Request){const auth=await authorizeApiRoles(['super_admin','client_admin','client_user']);if(!auth.authorized)return auth.response;const url=new URL(request.url);const parsed=uploadListSchema.safeParse({page:url.searchParams.get('page')??undefined,pageSize:url.searchParams.get('pageSize')??undefined});if(!parsed.success)return NextResponse.json({message:'Parámetros inválidos.'},{status:400});const result=await findUploads(auth.user,parsed.data.page,parsed.data.pageSize);return NextResponse.json({...result,page:parsed.data.page,pageSize:parsed.data.pageSize});}

import { NextResponse } from 'next/server';
import { campaignIdSchema } from '@/features/uploads/schemas/upload.schema';
import { uploadErrorResponse } from '@/features/uploads/http/upload-response';
import { UploadServiceError } from '@/features/uploads/errors/upload-service-error';
import { findAccessibleCampaign } from '@/features/uploads/repositories/upload.repository';
import { inspectDatabase } from '@/features/uploads/services/schema-inspection';
import { authorizeApiRoles } from '@/shared/auth/api-authorization';

export async function GET(_request:Request,{params}:{params:Promise<{campaignId:string}>}){const auth=await authorizeApiRoles(['super_admin','client_admin','client_user']);if(!auth.authorized)return auth.response;try{const id=campaignIdSchema.parse((await params).campaignId);const campaign=await findAccessibleCampaign(auth.user,id);if(!campaign)throw new UploadServiceError('CAMPAIGN_NOT_AVAILABLE','La campaña no está disponible.',403);const catalog=await inspectDatabase(campaign.code,id);if(auth.user.role==='client_user'){if(!catalog.configurations.length)throw new UploadServiceError('CONFIGURATION_REQUIRED','Un administrador debe configurar primero esta campaña.',409);const allowed=new Set(catalog.configurations.map(config=>config.targetTable));catalog.tables=catalog.tables.filter(table=>allowed.has(table.table))}return NextResponse.json(catalog);}catch(error){const known=uploadErrorResponse(error);if(known)return known;console.error('Inspect campaign schema error:',error);return NextResponse.json({message:'No fue posible consultar el esquema de la campaña.'},{status:500});}}

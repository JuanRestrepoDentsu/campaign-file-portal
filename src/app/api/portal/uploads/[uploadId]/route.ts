import { NextResponse } from 'next/server';
import { UploadServiceError } from '@/features/uploads/errors/upload-service-error';
import { uploadErrorResponse } from '@/features/uploads/http/upload-response';
import { findUpload } from '@/features/uploads/repositories/upload.repository';
import { uploadIdSchema } from '@/features/uploads/schemas/upload.schema';
import { authorizeApiRoles } from '@/shared/auth/api-authorization';

export async function GET(_request:Request,{params}:{params:Promise<{uploadId:string}>}){const auth=await authorizeApiRoles(['super_admin','client_admin','client_user']);if(!auth.authorized)return auth.response;try{const id=uploadIdSchema.parse((await params).uploadId);const upload=await findUpload(auth.user,id);if(!upload)throw new UploadServiceError('UPLOAD_NOT_FOUND','La carga no existe.',404);return NextResponse.json({upload});}catch(error){return uploadErrorResponse(error)??NextResponse.json({message:'No fue posible consultar la carga.'},{status:500});}}

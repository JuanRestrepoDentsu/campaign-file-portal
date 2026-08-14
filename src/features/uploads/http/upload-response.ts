import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { UploadServiceError } from '@/features/uploads/errors/upload-service-error';

export function uploadErrorResponse(error:unknown):NextResponse|null{
  if(error instanceof UploadServiceError)return NextResponse.json({code:error.code,message:error.message},{status:error.status});
  if(error instanceof ZodError)return NextResponse.json({message:'Los datos enviados no son válidos.',errors:error.flatten().fieldErrors},{status:400});
  return null;
}

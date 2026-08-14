'use client';
import {useEffect} from 'react';import {useRouter} from 'next/navigation';
const active=new Set(['uploading','uploaded','queued_validation','validating','queued_processing','processing']);
export function UploadAutoRefresh({status}:{status:string}){const router=useRouter();useEffect(()=>{if(!active.has(status))return;const timer=window.setInterval(()=>router.refresh(),5000);return()=>window.clearInterval(timer)},[router,status]);return null}

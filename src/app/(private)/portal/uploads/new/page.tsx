import Link from 'next/link';
import { UploadWizard } from '@/features/uploads/components/upload-wizard';
import { getRemoteUploadCampaigns } from '@/shared/api/portal-data';
import { requireRole } from '@/shared/auth/authorization';

export default async function NewUploadPage(){await requireRole(['super_admin','client_admin','client_user']);const campaigns=await getRemoteUploadCampaigns();return <main className="px-6 py-8 lg:px-8"><div className="mx-auto max-w-3xl"><Link href="/portal/uploads" className="text-sm font-medium text-slate-600">← Volver al historial</Link><h1 className="mt-5 text-3xl font-semibold">Cargar archivo CSV</h1><p className="mt-2 mb-6 text-slate-600">Selecciona la campaña, revisa el esquema real y valida el archivo antes de actualizar datos.</p>{campaigns.length?<UploadWizard campaigns={campaigns}/>:<div className="rounded-xl border bg-white p-6 text-slate-600">No tienes campañas activas disponibles.</div>}</div></main>}

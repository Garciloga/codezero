import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import {notFound} from 'next/navigation';
import {createAdminSupabase} from '../../../lib/admin';
import {workspaceEnabled} from '../../../lib/workspace-sandbox';
import {certificatePublicView} from '../../../lib/certificate-policy';
export const dynamic='force-dynamic';
export async function generateMetadata() { return translatedMetadata({title:'Verificación de certificado',robots:{index:false,follow:false}}); }
export default async function VerifyCertificate({params}:{params:Promise<{token:string}>}){
 const {token}=await params;if(!workspaceEnabled()||!/^[a-f0-9]{64}$/.test(token))notFound();
 const {data,error}=await createAdminSupabase().from('certificate_publications').select('public_id,display_name,title,issued_on,status').eq('public_id',token).eq('status','verified').maybeSingle();
 if(error||!data)notFound();
 const record=certificatePublicView({publicId:data.public_id,displayName:data.display_name,routeTitle:data.title,issuedOn:data.issued_on,status:data.status,accountId:''});
 return <LocalizedContent><main className="wrap"><section className="card" style={{maxWidth:720,margin:'60px auto',textAlign:'center'}}><span className="pill">EMITIDO POR GARCILOGA</span><h1>Certificado verificado</h1><h2><span translate="no">{record.displayName}</span></h2><p>{record.routeTitle}</p><p>Fecha de emisión: {record.issuedOn}</p><p>Este registro confirma que Garciloga emitió el certificado mostrado. Es una constancia de formación y no una acreditación oficial de un puesto profesional.</p></section></main></LocalizedContent>;
}


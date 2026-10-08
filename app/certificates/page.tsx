import { translatedMetadata } from '../../lib/localization/metadata';
import LocalizedDate from '../components/localization/date';
import LocalizedContent from "../components/localization/server";
import Link from 'next/link';
import {redirect,notFound} from 'next/navigation';
import {workspaceEnabled} from '../../lib/workspace-sandbox';
import {workspaceUser} from '../../lib/workspace-server';
import CertificateSharing from '../components/certificate-sharing';
export const dynamic='force-dynamic';
export async function generateMetadata() { return translatedMetadata({title:'Mis certificados',robots:{index:false,follow:false}}); }
export default async function Certificates(){if(!workspaceEnabled())notFound();const session=await workspaceUser();if(!session)redirect('/login');
 const [{data:certificates,error},{data:publications,error:publicationError}]=await Promise.all([session.supabase.from('certificates').select('id,title,certificate_type,issued_at').eq('user_id',session.user.id).order('issued_at',{ascending:false}),session.supabase.from('certificate_publications').select('certificate_id,public_id,status').eq('user_id',session.user.id)]);
 if(error||publicationError)throw Error('CERTIFICATES_UNAVAILABLE');return <LocalizedContent><main className="wrap"><h1>Mis certificados</h1><p>Incluidos al aprobar; no hay cargo adicional por emisión. Tus documentos ya emitidos se conservan al cambiar de plan. Publicar el enlace es opcional.</p>{!certificates?.length&&<p>Todavía no tienes certificados emitidos. Completa las lecciones, exámenes y proyectos requeridos.</p>}{certificates?.map(cert=>{const publication=publications?.find(x=>x.certificate_id===cert.id);return <article className="card" key={cert.id} style={{marginBottom:20}}><span className="pill">EMITIDO POR CODEZERO</span><h2>{cert.title}</h2><p><span translate="no">{session.profile.full_name||'Estudiante Garciloga'}</span></p><p>Fecha: <LocalizedDate value={cert.issued_at} /></p><p className="muted">Constancia de formación. No es un título con reconocimiento oficial ni garantiza empleo.</p><CertificateSharing certificateId={cert.id} displayName={session.profile.full_name||'Estudiante Garciloga'} initialPath={publication?.status==='verified'?'/verify/'+publication.public_id:null}/>{cert.certificate_type==='codezero-complete'&&<Link href="/certificate">Ver documento del programa</Link>}</article>})}<Link className="btn secondary" href="/dashboard">Volver a Mi Garciloga</Link></main></LocalizedContent>;
}


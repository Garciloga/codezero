import {redirect} from 'next/navigation';
import Link from 'next/link';
import {getServerUser} from '../../lib/supabase-server';
import {publishedWeeklyCases} from '../../lib/weekly-cases';
import {isUuid} from '../../lib/workspace-sandbox';
import LocalizedContent from '../components/localization/server';
export default async function WeeklyCases({searchParams}:{searchParams:Promise<{organization_id?:string}>}){if(!(await getServerUser()).data.user)redirect('/login');const q=await searchParams,org=isUuid(q.organization_id)?q.organization_id:null;return <LocalizedContent><main className="wrap"><h1>Archivo de casos</h1><p>Casos sintéticos de Cuenta Faro para practicar decisiones, procesos y programación.</p>{publishedWeeklyCases().map(c=><article className="card" key={c.key}><h2>{c.title}</h2><p>{c.lesson}</p><Link prefetch={false} className="btn" href={`/role-training?activity=${c.key}${org?'&organization_id='+org:''}`}>Resolver el caso</Link></article>)}</main></LocalizedContent>;}

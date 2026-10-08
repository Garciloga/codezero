import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getServerUser} from '../../lib/supabase-server';
import {RELEASE_NOTES} from '../../lib/release-notes';
import LocalizedContent from '../components/localization/server';
export default async function News(){if(!(await getServerUser()).data.user)redirect('/login');return <LocalizedContent><main className="wrap"><h1>Novedades</h1><p>Lo que ya está disponible en Garciloga.</p>{RELEASE_NOTES.map(n=><article className="card" key={n.id}><time dateTime={n.date}>{n.date}</time> · <span className="pill">{n.tag}</span><h2>{n.title}</h2><p>{n.body}</p></article>)}<Link prefetch={false} href="/roadmap">Ver próximos pasos</Link></main></LocalizedContent>;}

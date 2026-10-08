import PublicHeader from '../components/public-header';
import {translatedMetadata} from '../../lib/localization/metadata';
import {publicMetadata} from '../../lib/public-metadata';
export async function generateMetadata(){return translatedMetadata(publicMetadata('Novedades','Lo que ya está disponible en Garciloga.','/news'));}
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getServerUser} from '../../lib/supabase-server';
import {RELEASE_NOTES} from '../../lib/release-notes';
import LocalizedContent from '../components/localization/server';
export default async function News(){return <LocalizedContent><div className="public-site"><PublicHeader authenticated={Boolean((await getServerUser()).data.user)}/><main className="wrap"><h1>Novedades</h1><p>Lo que ya está disponible en Garciloga.</p>{RELEASE_NOTES.map(n=><article className="card" key={n.id}><time dateTime={n.date}>{n.date}</time> · <span className="pill">{n.tag}</span><h2>{n.title}</h2><p>{n.body}</p></article>)}<Link prefetch={false} href="/roadmap">Ver próximos pasos</Link></main></div></LocalizedContent>;}


import { translatedMetadata } from '../../lib/localization/metadata';
import LocalizedContent from "../components/localization/server";
import Link from 'next/link';import {redirect} from 'next/navigation';
import {workspaceUser} from '../../lib/workspace-server';import TutorChat from '../components/tutor-chat';
export async function generateMetadata() { return translatedMetadata({title:'Tutor IA',robots:{index:false,follow:false}}); }
export default async function TutorPage(){
 const session=await workspaceUser();if(!session)redirect('/login');
 const {data,error}=await session.supabase.from('lessons').select('id,title').eq('status','published').order('id').limit(500);
 const model=process.env.OPENAI_MODEL??'gpt-6-luna';
 const ready=Boolean(process.env.OPENAI_API_KEY)
  && model==='gpt-6-luna';
 return <LocalizedContent><main className="wrap"><span className="pill">APRENDE CON CONTEXTO</span><h1>Tutor IA</h1><p>Explicaciones breves, ejemplos y preguntas para comprobar tu comprensión. Las lecciones se habilitan según tu plan y el avance aprobado.</p><TutorChat lessons={error?[]:data??[]} ready={ready}/><p><Link href="/dashboard" className="btn secondary">Volver a Mi Garciloga</Link></p></main></LocalizedContent>;
}


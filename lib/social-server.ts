import 'server-only';
import {redirect,notFound} from 'next/navigation';
import {workspaceEnabled} from './workspace-sandbox';
import {workspaceUser} from './workspace-server';
import {createAdminSupabase} from './admin';

export async function socialSession(moderator=false){
 if(!workspaceEnabled())notFound();
 const session=await workspaceUser();if(!session)redirect('/login');
 if(!session.user.email_confirmed_at)redirect('/profile');
 if(moderator&&!['owner','admin'].includes(session.profile.role))notFound();
 return {...session,admin:createAdminSupabase(),moderator:['owner','admin'].includes(session.profile.role)};
}
export type CommunityPost={id:string;parent_id:string|null;title:string;body:string;category:string;status:string;locked:boolean;created_at:string;alias:string;own:boolean};
export function workflowMessage(result?:string){
 return result==='saved'?'Cambio guardado.':result==='pending'?'Tu publicación está pendiente de revisión.':result==='failed'?'No se pudo completar. Revisa los datos, la disponibilidad y tus permisos.':null;
}

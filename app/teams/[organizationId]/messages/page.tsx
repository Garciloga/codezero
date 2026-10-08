import {randomUUID} from 'node:crypto';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {companyContext} from '../../../../lib/company-server';
import {isUuid} from '../../../../lib/workspace-sandbox';
import LocalizedContent from '../../../components/localization/server';
export default async function CompanyMessages({params,searchParams}:{params:Promise<{organizationId:string}>,searchParams:Promise<{team?:string;result?:string}>}){
 const {organizationId:org}=await params,query=await searchParams,team=query.team||null;
 if(team&&!isUuid(team))notFound();const session=await companyContext(org);if(!session)notFound();
 const {data:teams,error}=await session.supabase.from('organization_teams').select('id,name').eq('organization_id',org).order('name');if(error)throw Error('COMPANY_DATA_UNAVAILABLE');if(team&&!teams?.some(t=>t.id===team))notFound();
 let messagesQuery=session.supabase.from('organization_messages').select('id,body,author_id,created_at,deleted_at').eq('organization_id',org).order('created_at',{ascending:false}).limit(100);
 messagesQuery=team?messagesQuery.eq('team_id',team):messagesQuery.is('team_id',null);const {data:messages,error:messageError}=await messagesQuery;if(messageError)throw Error('MESSAGES_UNAVAILABLE');
 const {data:authors}=await session.supabase.from('organization_memberships').select('user_id,display_name').eq('organization_id',org).eq('active',true);
 const hidden=<><input type="hidden" name="organization_id" value={org}/><input type="hidden" name="team_id" value={team??''}/></>;
 return <LocalizedContent><main className="wrap"><h1>Comunicador de compañía</h1><p translate="no">{session.company.name}</p><nav aria-label="Canales"><Link href={`/teams/${org}/messages`}>Avisos de compañía</Link>{teams?.map(t=><span key={t.id}> · <Link href={`?team=${t.id}`} translate="no">{t.name}</Link></span>)}</nav><p>Mensajes de práctica y coordinación, sin datos sensibles. Solo se muestran canales permitidos. El historial visible cubre 90 días; los mensajes antiguos se depuran al enviar uno nuevo. Puedes escribir emojis directamente.</p>
 {query.result&&<p role="status">{query.result==='saved'?'Cambios guardados.':'No se pudo guardar. Comprueba tus permisos y el contrato Enterprise vigente.'}</p>}
 {(team||session.manager)&&<form action="/api/company/messages" method="post">{hidden}<input type="hidden" name="action" value="send"/><input type="hidden" name="request_id" value={randomUUID()}/><label>{team?'Mensaje al equipo':'Aviso a toda la compañía'}<textarea name="body" maxLength={4000} rows={4} required/></label><button className="btn">Enviar mensaje</button></form>}
 <Link href={'?'+(team?'team='+team:'')}>Actualizar mensajes</Link><ol>{[...(messages??[])].reverse().map(m=><li key={m.id}><strong translate="no">{authors?.find(a=>a.user_id===m.author_id)?.display_name??'Miembro de tu equipo'}</strong> · <time>{m.created_at.slice(0,16).replace('T',' ')}</time>{m.deleted_at?<p>Mensaje eliminado.</p>:<p translate="no" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{m.body}</p>}{!m.deleted_at&&(m.author_id===session.user.id||session.manager)&&<form action="/api/company/messages" method="post">{hidden}<input type="hidden" name="action" value="remove"/><input type="hidden" name="message_id" value={m.id}/><button className="btn secondary">Eliminar mensaje</button></form>}</li>)}</ol>{!messages?.length&&<p>No hay mensajes disponibles en este canal.</p>}
 </main></LocalizedContent>;
}

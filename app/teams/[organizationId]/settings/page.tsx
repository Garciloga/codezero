import {notFound} from 'next/navigation';
import Link from 'next/link';
import {companyContext,companyCapacity} from '../../../../lib/company-server';
import {createAdminSupabase} from '../../../../lib/admin';
import CompanyBrandEditor from '../../../components/enterprise/company-brand-editor';
import LocalizedContent from '../../../components/localization/server';
export default async function CompanySettings({params,searchParams}:{params:Promise<{organizationId:string}>,searchParams:Promise<{result?:string}>}){
 const {organizationId:org}=await params,session=await companyContext(org);if(!session)notFound();
 const [{data:teams,error:teamError},{data:members,error:memberError},{data:grants,error:grantError},{data:teamMembers,error:teamMembersError},capacity]=await Promise.all([
 session.supabase.from('organization_teams').select('id,name').eq('organization_id',org).order('name'),
 session.supabase.from('organization_memberships').select('user_id,display_name,role,can_brand').eq('organization_id',org).eq('active',true).order('display_name'),
 session.supabase.from('organization_team_grants').select('team_id,user_id,can_view,can_invite').eq('organization_id',org),
 session.supabase.from('organization_team_members').select('team_id,user_id').eq('organization_id',org),companyCapacity(org)]);
 if(teamError||memberError||grantError||teamMembersError)throw Error('COMPANY_DATA_UNAVAILABLE');
 const hidden=(action:string)=><><input type="hidden" name="action" value={action}/><input type="hidden" name="organization_id" value={org}/></>;
 return <LocalizedContent><main className="wrap"><h1>Compañía y equipos de trabajo</h1><p translate="no">{session.company.name}</p><Link href={`/teams/${org}`}>Volver a mi compañía</Link><p>Cupo contratado: {capacity.contract?.seat_limit??0}. Miembros e invitaciones reservadas: {capacity.used}. Disponible: {capacity.available}.</p><p>Una persona usa un asiento por compañía aunque esté en varios equipos. Las invitaciones vigentes reservan un asiento; revocarlas o dejarlas expirar libera esa reserva.</p>{(await searchParams).result&&<p role="status">{(await searchParams).result==='saved'?'Cambios guardados.':'No se pudo guardar. Revisa tus permisos y los datos.'}</p>}
 {session.canBrand&&<CompanyBrandEditor org={org}/>}
 {session.manager&&<><section className="card"><h2>Crear equipo interno</h2><form action="/api/company/manage" method="post">{hidden('team')}<label>Nombre del equipo<input name="name" minLength={2} maxLength={120} required/></label><button className="btn">Crear equipo</button></form></section>
 {teams?.map(team=><section className="card" key={team.id}><h2 translate="no">{team.name}</h2><p>El permiso de ver este equipo se concede a una persona y no abre acceso al resto de su equipo. Invitar permite incorporar colaboradores; elevar roles sigue reservado a Dueño/Admin.</p>{members?.map(member=>{const grant=grants?.find(g=>g.team_id===team.id&&g.user_id===member.user_id),belongs=teamMembers?.some(m=>m.team_id===team.id&&m.user_id===member.user_id);return <form action="/api/company/manage" method="post" key={member.user_id}>{hidden('team')}<input type="hidden" name="team_id" value={team.id}/><input type="hidden" name="user_id" value={member.user_id}/><strong translate="no">{member.display_name}</strong><label><input name="member" type="checkbox" value="1" defaultChecked={belongs}/>Pertenece al equipo</label><label><input name="can_view" type="checkbox" value="1" defaultChecked={grant?.can_view}/>Puede ver este equipo</label><label><input name="can_invite" type="checkbox" value="1" defaultChecked={grant?.can_invite}/>Puede invitar a este equipo</label><button className="btn secondary">Guardar permisos</button></form>;})}</section>)}
 <section className="card"><h2>Permiso de personalizar marca</h2>{members?.map(m=><form key={m.user_id} action="/api/company/manage" method="post">{hidden('brand_permission')}<input type="hidden" name="user_id" value={m.user_id}/><span translate="no">{m.display_name}</span><label><input name="enabled" value="1" type="checkbox" defaultChecked={m.can_brand}/>Puede editar logo e imagen</label><button className="btn secondary">Guardar permiso</button></form>)}</section></>}
 {!session.manager&&<section className="card"><h2>Mis equipos</h2><ul>{teams?.map(t=><li key={t.id} translate="no">{t.name}</li>)}</ul><p>Solo ves equipos permitidos. Los datos de otras compañías permanecen separados.</p></section>}
 </main></LocalizedContent>;
}

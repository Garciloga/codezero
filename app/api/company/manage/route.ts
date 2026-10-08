import {deliverCompanyInvitation} from "../../../../lib/company-invitation-delivery";
import {NextResponse} from 'next/server';
import {workspaceUser} from '../../../../lib/workspace-server';
import {createAdminSupabase} from '../../../../lib/admin';
import {boundedForm} from '../../../../lib/bounded-form';
import {isUuid,trustedWorkspaceMutation} from '../../../../lib/workspace-sandbox';
import {consumeRateLimit} from '../../../../lib/rate-limit';
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL))return new Response(null,{status:403});
 const session=await workspaceUser();if(!session)return new Response(null,{status:401});
 const rate=await consumeRateLimit('company-manage:'+session.user.id,30,600);if(!rate.allowed)return new Response(null,{status:429});
 let form:FormData;try{form=await boundedForm(req,12000);}catch{return new Response(null,{status:400});}
 const action=String(form.get('action')),org=String(form.get('organization_id')??'');
 const admin=createAdminSupabase();let result;
 if(action==='contract_create'||action==='contract_update'){
 if(!['owner','admin'].includes(session.profile.role))return new Response(null,{status:403});
 const seats=Number(form.get('seats')),until=String(form.get('valid_until')??''),plan=String(form.get('plan')??'');
 if(!Number.isSafeInteger(seats)||seats<1||seats>100000||!Number.isFinite(Date.parse(until))||!['starter','pro','enterprise'].includes(plan))return new Response(null,{status:400});
 const fields={p_actor:session.user.id,p_reference:String(form.get('reference')??'').trim(),p_seats:seats,p_plan:plan,p_until:new Date(until).toISOString()};
 if(action==='contract_create')result=await admin.rpc('provision_company_contract',{...fields,p_name:String(form.get('name')??'').trim(),p_owner_email:String(form.get('owner_email')??'').trim().toLowerCase()});
 else {if(!isUuid(org))return new Response(null,{status:400});result=await admin.rpc('set_company_contract',{...fields,p_org:org,p_active:form.get('active')==='1'});}
 return NextResponse.redirect(new URL('/admin/companies?result='+(result.error?'failed':'saved'),process.env.NEXT_PUBLIC_APP_URL??req.url),303);
 }
 if(!isUuid(org))return new Response(null,{status:400});
 const nullable=(key:string)=>{const v=String(form.get(key)??'');if(v&&!isUuid(v))throw Error('INVALID_ID');return v||null;};
 try{
 if(action==='invite'){
 result=await admin.rpc('create_company_invitation',{p_org:org,p_actor:session.user.id,p_email:String(form.get('email')??'').trim().toLowerCase(),p_role:String(form.get('role')??'learner'),p_reports:nullable('reports_to'),p_team:nullable('team_id')});
 if(result.error)return Response.json({error:'INVITATION_FAILED',detail:'Comprueba permisos, contrato vigente, cupo disponible y correo.'},{status:409});
 const delivery=await deliverCompanyInvitation(result.data,session.user.id);
 return NextResponse.redirect(new URL(`/admin/companies/${org}/invite?invitation=${result.data}&result=${delivery}`,process.env.NEXT_PUBLIC_APP_URL??req.url),303);
 }
 if(action==='team')result=await admin.rpc('configure_company_team',{p_org:org,p_actor:session.user.id,p_team:nullable('team_id'),p_name:String(form.get('name')??'').trim(),p_user:nullable('user_id'),p_member:form.get('member')==='1',p_view:form.get('can_view')==='1',p_invite:form.get('can_invite')==='1'});
 else if(action==='revoke')result=await admin.rpc('revoke_company_invitation',{p_org:org,p_actor:session.user.id,p_invite:nullable('invitation_id')});
 else if(action==='brand_permission')result=await admin.rpc('set_company_brand_permission',{p_org:org,p_actor:session.user.id,p_target:nullable('user_id'),p_enabled:form.get('enabled')==='1'});
 else return new Response(null,{status:400});
 }catch{return new Response(null,{status:400});}
 return NextResponse.redirect(new URL(`/teams/${org}/settings?result=${result.error?'failed':'saved'}`,process.env.NEXT_PUBLIC_APP_URL??req.url),303);
}

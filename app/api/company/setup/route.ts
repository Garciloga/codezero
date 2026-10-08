import {deliverCompanyInvitation} from '../../../../lib/company-invitation-delivery';
import {workspaceUser} from '../../../../lib/workspace-server';
import {createAdminSupabase,requireAdmin} from '../../../../lib/admin';
import {trustedWorkspaceMutation,isUuid} from '../../../../lib/workspace-sandbox';
import {boundedForm} from '../../../../lib/bounded-form';
import {consumeRateLimit} from '../../../../lib/rate-limit';
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req))return new Response(null,{status:403});const session=await workspaceUser();if(!session)return new Response(null,{status:401});try{await requireAdmin(session.user.id);}catch{return new Response(null,{status:403});}
 if(!(await consumeRateLimit('company-setup:'+session.user.id,30,600)).allowed)return new Response(null,{status:429});let f:FormData;try{f=await boundedForm(req,12000);}catch{return new Response(null,{status:400});}
 const admin=createAdminSupabase(),action=String(f.get('action'));let org=String(f.get('organization_id')??''),step=Math.max(1,Math.min(4,Number(f.get('step'))||1)),failed=false;
 if(action==='create'){const seats=Number(f.get('seats')),until=String(f.get('valid_until')),plan=String(f.get('plan'));if(!Number.isSafeInteger(seats)||seats<1||seats>100000||!Number.isFinite(Date.parse(until))||!['starter','pro','enterprise'].includes(plan))return new Response(null,{status:400});const result=await admin.rpc('provision_company_contract',{p_actor:session.user.id,p_name:String(f.get('name')).trim(),p_owner_email:String(f.get('owner_email')).trim().toLowerCase(),p_reference:String(f.get('reference')).trim(),p_seats:seats,p_plan:plan,p_until:new Date(until).toISOString()});failed=Boolean(result.error);if(!failed){org=result.data;step=2;}}
 else {if(!isUuid(org))return new Response(null,{status:400});const {data:company}=await admin.from('organizations').select('id').eq('id',org).eq('active',true).maybeSingle();if(!company)return new Response(null,{status:404});
 const reports=String(f.get('reports_to')??'')||null;if(reports&&!isUuid(reports))return new Response(null,{status:400});
 if(action==='member'){const target=String(f.get('user_id'));if(!isUuid(target))return new Response(null,{status:400});failed=Boolean((await admin.rpc('setup_company_member',{p_org:org,p_actor:session.user.id,p_target:target,p_role:String(f.get('role')),p_reports:reports,p_job_title:String(f.get('job_title')??'').trim()})).error);}
 else if(action==='invite'){const result=await admin.rpc('create_company_invitation',{p_org:org,p_actor:session.user.id,p_email:String(f.get('email')).trim().toLowerCase(),p_role:String(f.get('role')),p_reports:reports,p_team:null});failed=Boolean(result.error);if(!failed)await deliverCompanyInvitation(result.data,session.user.id);}
 else if(action==='advance')step=Math.min(4,step+1);else return new Response(null,{status:400});}
 if(isUuid(org)&&!failed){const result=await admin.from('organization_setup_drafts').upsert({organization_id:org,operator_id:session.user.id,step,updated_at:new Date().toISOString()});failed=Boolean(result.error);}
 return Response.redirect(new URL(`/admin/companies/setup?${isUuid(org)?'organization_id='+org+'&':''}step=${step}&result=${failed?'failed':'saved'}`,req.url),303);
}

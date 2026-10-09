import {boundedForm} from '../../../lib/bounded-form';
import {roleTrainingEnabled,roleTrainingSession} from '../../../lib/role-training-server';
import {trustedWorkspaceMutation,isUuid} from '../../../lib/workspace-sandbox';
import {createAdminSupabase} from '../../../lib/admin';
import {positionItem,positionGrade} from '../../../lib/position-curriculum';
import {consumeRateLimit} from '../../../lib/rate-limit';
export async function POST(req:Request){
 if(!roleTrainingEnabled())return new Response(null,{status:404});
 if(!trustedWorkspaceMutation(req))return new Response(null,{status:403});
 const session=await roleTrainingSession();if(!session)return new Response(null,{status:401});
 const rate=await consumeRateLimit('position:'+session.user.id,40,600);if(!rate.allowed)return new Response(null,{status:429});
 let f:FormData;try{f=await boundedForm(req,60000);}catch{return new Response(null,{status:413});}
 const org=String(f.get('organization_id')??'')||null;if(org&&!isUuid(org))return new Response(null,{status:400});
 const admin=createAdminSupabase(),action=f.get('action');let result='saved',attempt='';
 if(action==='position'){
  if(f.get('position')!=='customer_success')return new Response(null,{status:400});
  const {error}=await admin.rpc('set_training_position',{p_actor:session.user.id,p_user:session.user.id,p_org:org,p_position:'customer_success'});if(error)result='blocked';
 }else if(action==='submit'){
  const item=positionItem(String(f.get('item')??'')),id=f.get('request_id');if(!item||!isUuid(id))return new Response(null,{status:400});
  const answers=item.decisions.map((_,i)=>{const v=f.get('q_'+i);return typeof v==='string'&&/^[0-9]$/.test(v)?Number(v):NaN;});
  try{positionGrade(item,answers);}catch{return new Response(null,{status:400});}
  const draft=String(f.get('draft')??'').trim(),assistance=String(f.get('assistance')??'guided');if(draft.length>24000||!['guided','independent'].includes(assistance)||(!['exam','diagnostic'].includes(item.type)&&draft.length<(item.type==='project'?300:120)))return new Response(null,{status:400});
  const {data,error}=await admin.rpc('submit_position_practice',{p_actor:session.user.id,p_activity_key:item.key,p_request:id,p_org:org,p_draft:draft,p_answers:answers,p_assistance:assistance});
  result=error?'blocked':String(data);attempt=error||result==='limit'?'':'&attempt='+id;
  return Response.redirect(new URL('/positions?item='+item.key+'&result='+result+attempt+(org?'&organization_id='+org:''),req.url),303);
 }else return new Response(null,{status:400});
 return Response.redirect(new URL('/positions?result='+result+(org?'&organization_id='+org:''),req.url),303);
}

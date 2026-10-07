import {boundedForm} from "../../../lib/bounded-form";
import {workspaceUser} from '../../../lib/workspace-server';
import {workspaceEnabled,trustedWorkspaceMutation,isUuid} from '../../../lib/workspace-sandbox';
import {hasCustomerSuccessCourse,CS_COURSE_UNITS} from '../../../lib/customer-success-course';
import {gradeCustomerSuccessExam} from '../../../lib/customer-success-exam';
import {createAdminSupabase} from '../../../lib/admin';
import {consumeRateLimit} from '../../../lib/rate-limit';
export async function POST(req:Request){
 if(!workspaceEnabled())return new Response(null,{status:404});if(!trustedWorkspaceMutation(req))return new Response(null,{status:403});
 const session=await workspaceUser();if(!session)return Response.json({error:'UNAUTHENTICATED'},{status:401});if(!hasCustomerSuccessCourse(session.profile))return Response.json({error:'PLAN_REQUIRED'},{status:403});
 const rate=await consumeRateLimit('cs-course:'+session.user.id,20,600);if(!rate.allowed)return Response.json({error:'RATE_LIMITED'},{status:429});
 if(Number(req.headers.get('content-length')??0)>70000)return new Response(null,{status:413});
 let form:FormData;try{form=await boundedForm(req,70000);}catch{return new Response(null,{status:413});}const action=String(form.get('action'));const admin=createAdminSupabase();let result;
 if(action==='unit'){
  const unitRaw=form.get('unit'),choiceRaw=form.get('choice');const unit=typeof unitRaw==='string'&&/^[0-7]$/.test(unitRaw)?Number(unitRaw):NaN,choice=typeof choiceRaw==='string'&&/^[0-1]$/.test(choiceRaw)?Number(choiceRaw):NaN,draft=String(form.get('draft')??'').trim();
  if(!Number.isInteger(unit)||unit<0||unit>=8||!Number.isInteger(choice)||choice<0||choice>=CS_COURSE_UNITS[unit].choices.length||draft.length<80||draft.length>4000)return Response.json({error:'INVALID_ACTIVITY'},{status:400});
  result=await admin.rpc('save_cs_course_unit',{p_user:session.user.id,p_unit:unit,p_choice:choice,p_draft:draft});
 }else if(action==='exam'||action==='project'){
  const id=form.get('request_id');if(!isUuid(id))return Response.json({error:'INVALID_REQUEST'},{status:400});
  if(action==='exam'){
   let grade;try{grade=gradeCustomerSuccessExam(Array.from({length:8},(_,i)=>{const raw=form.get('q_'+i);return typeof raw==='string'&&/^[0-2]$/.test(raw)?Number(raw):null}));}catch{return Response.json({error:'INVALID_ANSWERS'},{status:400});}
   result=await admin.rpc('submit_cs_course_exam',{p_user:session.user.id,p_id:id,p_score:grade.score});
  }else{
   const draft=String(form.get('draft')??'').trim();if(draft.length<300||draft.length>16000)return Response.json({error:'INVALID_PROJECT'},{status:400});
   result=await admin.rpc('submit_cs_course_project',{p_user:session.user.id,p_id:id,p_draft:draft});
  }
 }else return Response.json({error:'INVALID_ACTION'},{status:400});
 if(result.error)return Response.json({error:'COURSE_SAVE_FAILED'},{status:409});
 const status=result.data==='limit'?'limit':action==='unit'?'saved':action==='project'?'submitted':result.data;
 return Response.redirect(new URL('/customer-success?result='+status,req.url),303);
}

import {mixedReleaseEnabled,mixedArtifacts} from '../../../../lib/mixed-role-server';
import {roleTrainingSession} from '../../../../lib/role-training-server';
import {MIXED_UNITS} from '../../../../lib/mixed-role-content';
import {findTrainingActivity,gradeTrainingDecisions} from '../../../../lib/role-training-content';
import {createAdminSupabase} from '../../../../lib/admin';
import {hasCustomerSuccessCourse} from '../../../../lib/customer-success-course';
import {trustedWorkspaceMutation,isUuid} from '../../../../lib/workspace-sandbox';
import {boundedForm} from '../../../../lib/bounded-form';
import {validScores} from '../../../../lib/competency-matrix';
import {TOOL_FIELDS} from '../../../../lib/mixed-role-scenarios';
import {consumeRateLimit} from '../../../../lib/rate-limit';
export async function POST(req:Request){
 if(!await mixedReleaseEnabled())return new Response(null,{status:404});
 if(!trustedWorkspaceMutation(req))return new Response(null,{status:403});
 const session=await roleTrainingSession();if(!session)return new Response(null,{status:401});
 if(!hasCustomerSuccessCourse(session.profile))return new Response(null,{status:403});
 if(!(await consumeRateLimit('mixed-training:'+session.user.id,40,600)).allowed)return new Response(null,{status:429});
 let f:FormData;try{f=await boundedForm(req,60000);}catch{return new Response(null,{status:413});}
 const key=String(f.get('step')),unit=MIXED_UNITS.find(u=>u.steps.some(s=>s.key===key)),step=unit?.steps.find(s=>s.key===key);
 const request=f.get('request_id'),org=String(f.get('organization_id')??'')||null;
 if(!step||!unit||!isUuid(request)||org&&!isUuid(org))return new Response(null,{status:400});
 const source=findTrainingActivity(step.sourceKey)!;
 const answers=source.decisions.map((_,i)=>Number(f.get('decision_'+i)));
 if(source.decisions.some((_,i)=>!f.has('decision_'+i)))return new Response(null,{status:400});
 try{if(source.decisions.length)gradeTrainingDecisions(source,answers);}catch{return new Response(null,{status:400});}
 const scores=Object.fromEntries(source.competencies.map(k=>[k,f.has('score_'+k)?Number(f.get('score_'+k)):NaN]));
 if(!validScores(scores))return new Response(null,{status:400});
 const draft=String(f.get('draft')??'').trim(),assistance=String(f.get('assistance'));
 if(draft.length<120||draft.length>12000||!['guided','independent'].includes(assistance))return new Response(null,{status:400});
 const code=String(f.get('code')??'');
 if(code.length>7000)return new Response(null,{status:400});
 const index=unit.steps.indexOf(step),previous=String(f.get('previous_submission')??'');
 const history=await mixedArtifacts(session.user.id,org)??[];
 const prior=index>0?history.find(a=>a.step_key===unit.steps[index-1].key):null;
 if(index>0&&(!prior||prior.submission_id!==previous))return Response.json({error:'MIXED_PREVIOUS_CHANGED'},{status:409});
 const toolFields=Object.fromEntries((TOOL_FIELDS[step.category??'']??[]).map((label,i)=>[label,String(f.get('tool_'+i)??'').trim()]));
 if(step.format==='simulation'&&Object.values(toolFields).some(v=>!v||v.length>600))return new Response(null,{status:400});
 const output=String(f.get('runtime_output')??''),runtimeStatus=String(f.get('runtime_status')??'');
 if(output.length>4096||runtimeStatus&&!['complete','error','timeout','cancelled'].includes(runtimeStatus))return new Response(null,{status:400});
 if(['python','sql'].includes(step.format)&&(!code.trim()||!runtimeStatus))return new Response(null,{status:400});
 const payload={version:'mixed-v1',unit:unit.key,company:unit.company,step:key,code,fields:toolFields,previous_submission:prior?.submission_id??null,output,runtime_status:runtimeStatus};
 const {error}=await createAdminSupabase().rpc('submit_mixed_training',{p_actor:session.user.id,p_step:key,p_request:request,p_org:org,p_payload:payload,p_draft:draft,p_scores:scores,p_assistance:assistance,p_auto_results:answers.map((v,i)=>v===source.decisions[i].correct?1:0)});
 if(error)return Response.json({error:'MIXED_SAVE_FAILED'},{status:409});
 return Response.redirect(new URL('/role-training/mixed?unit='+unit.key+'&step='+encodeURIComponent(key)+'&result=saved'+(org?'&organization_id='+org:''),req.url),303);
}

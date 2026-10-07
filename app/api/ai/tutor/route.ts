import {createHash} from 'node:crypto';
import {workspaceUser} from '../../../../lib/workspace-server';
import {trustedWorkspaceMutation,isUuid} from '../../../../lib/workspace-sandbox';
import {consumeRateLimit} from '../../../../lib/rate-limit';
import {parseTutorInput,loadTutorContext,buildTutorDraft,TutorContextError} from '../../../../lib/tutor-context';
import {tutorContextStore} from '../../../../lib/tutor-context-server';
import {productionTutorStore} from '../../../../lib/tutor-production-store';
import {runControlledTutor} from '../../../../lib/tutor-controlled-run';
export const maxDuration=30;
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req))return Response.json({error:'INVALID_ORIGIN'},{status:403});
 const session=await workspaceUser();if(!session)return Response.json({error:'UNAUTHENTICATED'},{status:401});
 const apiKey=process.env.OPENAI_API_KEY;
 if(!apiKey || (process.env.OPENAI_MODEL??'gpt-6-luna')!=='gpt-6-luna')return Response.json({error:'AI_TUTOR_NOT_CONFIGURED'},{status:503});
 const rate=await consumeRateLimit('ai:'+session.user.id,10,60);if(!rate.allowed)return Response.json({error:'RATE_LIMITED'},{status:429});
 let body;try{body=await req.json();}catch{return Response.json({error:'INVALID_REQUEST'},{status:400});}
 if(!body||!isUuid(body.requestId)||Object.keys(body).sort().join(',')!=='lessonId,question,requestId')return Response.json({error:'INVALID_REQUEST'},{status:400});
 const input=parseTutorInput({lessonId:body.lessonId,question:body.question});if(!input)return Response.json({error:'INVALID_QUESTION'},{status:400});
 try{
  const context=await loadTutorContext(tutorContextStore(session.supabase,session.user.id,session.profile),input.lessonId);
  const draft=buildTutorDraft(context,input.question);
  const fingerprint=createHash('sha256').update(JSON.stringify({lessonId:input.lessonId,draft})).digest('hex');
  const result=await runControlledTutor(productionTutorStore(session.user.id,fingerprint),{
   async complete(request,signal){
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},body:JSON.stringify({...request,model:'gpt-6-luna',reasoning:{effort:'low'}})});
    if(!response.ok)throw Error('PROVIDER_ERROR');
    const data=await response.json(),usage=data.usage;
    const valid=usage&&Number.isSafeInteger(usage.input_tokens)&&usage.input_tokens>=0&&Number.isSafeInteger(usage.output_tokens)&&usage.output_tokens>=0;
    // Conservative standard-rate estimate includes cache-write premium; no invoice claim.
    const actual=valid?Math.ceil(usage.input_tokens*.125+usage.output_tokens*.5):undefined;
    return{response:data,actualMicroUsd:actual};
   }
  },{id:body.requestId,boundMicroUsd:5000,providerReady:true,draft});
  if(result.status==='complete')return Response.json({answer:result.answer});
  return Response.json({error:result.status},{status:result.status==='pending_or_previously_processed'?409:503});
 }catch(error){
  if(error instanceof TutorContextError)return Response.json({error:error.code},{status:403});
  const message=error instanceof Error?error.message:'';
  return Response.json({error:message.includes('AI_QUERY_LIMIT_REACHED')?'AI_QUERY_LIMIT_REACHED':message.includes('RECONCILIATION_REQUIRED')?'AI_USAGE_PENDING':'AI_TEMPORARILY_UNAVAILABLE'},{status:message.includes('AI_QUERY_LIMIT_REACHED')?429:503});
 }
}

import {NextResponse} from "next/server";
import {workspaceUser} from "../../../../lib/workspace-server";
import {workspaceSandboxEnabled,trustedWorkspaceMutation,isUuid} from "../../../../lib/workspace-sandbox";
import {draftCourseAssignmentsEnabled} from "../../../../lib/draft-course-assignment-policy";
import {boundedForm} from "../../../../lib/bounded-form";
import {createAdminSupabase} from "../../../../lib/admin";
import {consumeRateLimit} from "../../../../lib/rate-limit";

export async function POST(req:Request){
 if(!workspaceSandboxEnabled()||!draftCourseAssignmentsEnabled())return new Response(null,{status:404});
 if(!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL))return new Response(null,{status:403});
 const ctx=await workspaceUser();if(!ctx)return new Response(null,{status:401});
 const rate=await consumeRateLimit("draft-review:"+ctx.user.id,20,600);
 if(!rate.allowed)return new Response(null,{status:429});
 let f:FormData;try{f=await boundedForm(req,6000);}catch{return new Response(null,{status:413});}
 const decision=String(f.get("decision_id")??"");
 const scoreKeys=["accuracy","analysis","decisions","privacy","evidence"] as const;
 const values=scoreKeys.map(k=>Number(f.get("score_"+k)));
 const critical=f.get("critical_error")==="on",feedback=String(f.get("feedback")??"").trim();
 if(!isUuid(decision)||values.some(n=>!Number.isInteger(n)||n<0||n>4)||feedback.length<40||feedback.length>3000)
  return new Response(null,{status:400});
 const admin=createAdminSupabase();
 const {data,error}=await admin.rpc("review_draft_course_decision",{
  p_actor:ctx.user.id,p_decision:decision,
  p_accuracy:values[0],p_analysis:values[1],p_decisions:values[2],
  p_privacy:values[3],p_evidence:values[4],p_critical_error:critical,p_feedback:feedback
 });
 if(error||!data)return Response.json({error:"DRAFT_REVIEW_NOT_ACCEPTED",message:"Revisa alcance, evidencia y estado de la entrega."},{status:409});
 const {data:entry}=await admin.from("organization_course_decision_drafts").select("organization_id,user_id").eq("id",decision).maybeSingle();
 if(!entry||!isUuid(entry.organization_id)||!isUuid(entry.user_id))return new Response(null,{status:503});
 return NextResponse.redirect(new URL("/teams/"+entry.organization_id+"/person/"+entry.user_id+"?draft_review="+data,process.env.NEXT_PUBLIC_APP_URL??req.url),303);
}

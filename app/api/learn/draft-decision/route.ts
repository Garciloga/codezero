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
 const rate=await consumeRateLimit("draft-decision:"+ctx.user.id,16,600);
 if(!rate.allowed)return new Response(null,{status:429});
 let f:FormData;try{f=await boundedForm(req,8000);}catch{return new Response(null,{status:413});}
 const assignment=String(f.get("assignment_id")??"");
 const level=Number(f.get("level")),unit=Number(f.get("unit")),phase=Number(f.get("phase"));
 const choice=String(f.get("option_key")??"");
 const reasoning=String(f.get("reasoning")??"").trim(),evidence=String(f.get("evidence_reference")??"").trim();
 if(!isUuid(assignment)||![level,unit,phase].every(Number.isInteger)||level<1||level>15||unit<1||unit>6||phase<1||phase>3
 ||!["a","b","c"].includes(choice)||reasoning.length<220||reasoning.length>6000||evidence.length<8||evidence.length>300)
  return new Response(null,{status:400});
 const {data,error}=await createAdminSupabase().rpc("submit_draft_course_decision",{
  p_actor:ctx.user.id,p_assignment:assignment,p_level:level,p_unit:unit,p_phase:phase,
  p_option:choice,p_reasoning:reasoning,p_evidence_reference:evidence
 });
 if(error||!data)return Response.json({error:"DRAFT_DECISION_NOT_ACCEPTED",message:"Verifica asignación, secuencia, permisos y estado de revisión."},{status:409});
 return NextResponse.redirect(new URL("/learn/draft-progress?submitted=1",process.env.NEXT_PUBLIC_APP_URL??req.url),303);
}

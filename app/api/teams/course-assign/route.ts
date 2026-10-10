import {NextResponse} from "next/server";
import {workspaceUser} from "../../../../lib/workspace-server";
import {workspaceSandboxEnabled,trustedWorkspaceMutation,isUuid} from "../../../../lib/workspace-sandbox";
import {boundedForm} from "../../../../lib/bounded-form";
import {createAdminSupabase} from "../../../../lib/admin";
import {draftCourseAssignmentsEnabled,validDraftAssignment} from "../../../../lib/draft-course-assignment-policy";
import {consumeRateLimit} from "../../../../lib/rate-limit";
export async function POST(req:Request){
 if(!workspaceSandboxEnabled()||!draftCourseAssignmentsEnabled())return new Response(null,{status:404});
 if(!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL))return new Response(null,{status:403});
 const ctx=await workspaceUser();if(!ctx)return new Response(null,{status:401});
 const rate=await consumeRateLimit("course-assign:"+ctx.user.id,10,600);if(!rate.allowed)return new Response(null,{status:429});
 let form:FormData;try{form=await boundedForm(req,4096);}catch{return new Response(null,{status:413});}
 const org=String(form.get("organization_id")??""),target=String(form.get("user_id")??""),team=String(form.get("team_id")??"");
 const course=String(form.get("course_key")??""),competency=String(form.get("competency")??""),emphasis=String(form.get("emphasis")??""),due=String(form.get("due_at")??"");
 if(!isUuid(org)||(target&&!isUuid(target))||(team&&!isUuid(team))||(!target&&!team)||!validDraftAssignment({course,competency,emphasis,dueAt:due}))return new Response(null,{status:400});
 const {data:own,error:err}=await ctx.supabase.from("organization_memberships").select("role").eq("organization_id",org).eq("user_id",ctx.user.id).eq("active",true).maybeSingle();
 if(err||!own||!["owner","admin","manager","supervisor"].includes(own.role))return new Response(null,{status:403});
 const {data,error}=await createAdminSupabase().rpc("assign_draft_learning_route",{p_org:org,p_actor:ctx.user.id,p_user:target||null,p_team:team||null,p_course:course,p_competency:competency,p_emphasis:emphasis,p_due:due});
 if(error||!data)return new Response(null,{status:403});
 return NextResponse.redirect(new URL("/teams/"+org+(target?"/person/"+target:"/assign")+"?draft_assignment=prepared",process.env.NEXT_PUBLIC_APP_URL??req.url),303);
}

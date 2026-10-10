import {getServerUser} from "../../../../../lib/supabase-server";
import {requireOwner,createAdminSupabase} from "../../../../../lib/admin";
import {isTrustedBrowserRequest} from "../../../../../lib/security";
import {consumeRateLimit} from "../../../../../lib/rate-limit";
import {positionProgram} from "../../../../../lib/position-curriculum";
import {editorialFingerprint} from "../../../../../lib/editorial-review";
export async function POST(req:Request){
 if(!isTrustedBrowserRequest(req))return new Response("Invalid origin",{status:403});
 const {data:{user}}=await getServerUser();if(!user)return new Response("Unauthorized",{status:401});
 try{await requireOwner(user.id);}catch{return new Response("Forbidden",{status:403});}
 const limit=await consumeRateLimit("editorial:"+user.id,40,600);if(!limit.allowed)return new Response("Too many requests",{status:429});
 const size=Number(req.headers.get("content-length")??0);if(size>4000)return new Response("Request too large",{status:413});
 let form:FormData;try{form=await req.formData();}catch{return new Response("Bad form",{status:400});}
 const key=String(form.get("program")??""),lessonKey=String(form.get("lesson")??"");
 const state=String(form.get("state")??""),hash=String(form.get("hash")??""),note=String(form.get("note")??"").trim();
 if(!["reviewed","observation"].includes(state)||key.length>80||lessonKey.length>150||note.length>500)return new Response("Invalid review",{status:400});
 if(state==="observation"&&note.length<5)return new Response("An observation requires a note",{status:400});
 const program=positionProgram(key),lesson=program?.lessons.find(x=>x.key===lessonKey);
 if(!lesson)return new Response("Unknown lesson",{status:404});
 const liveHash=editorialFingerprint(lesson);
 if(hash!==liveHash)return new Response("The content changed: refresh before reviewing",{status:409});
 const admin=createAdminSupabase();
 const {error}=await admin.from("owner_lesson_editorial_reviews").upsert({
   program_key:key,lesson_key:lessonKey,content_hash:liveHash,state,note:state==="observation"?note:null,
   reviewed_by:user.id,reviewed_at:new Date().toISOString()
 },{onConflict:"program_key,lesson_key"});
 if(error)return new Response("Review not saved",{status:503});
 return Response.redirect(new URL("/admin/curriculum/reviews?program="+encodeURIComponent(key)+"#"+encodeURIComponent(lessonKey),req.url),303);
}

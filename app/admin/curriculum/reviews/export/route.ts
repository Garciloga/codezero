import {getServerUser} from "../../../../../lib/supabase-server";
import {requireOwner,createAdminSupabase} from "../../../../../lib/admin";
import {positionProgram} from "../../../../../lib/position-curriculum";
import {editorialFingerprint} from "../../../../../lib/editorial-review";
import {localeContext} from "../../../../../lib/localization/server";
export async function GET(req:Request){
 const {data:{user}}=await getServerUser();if(!user)return new Response("Unauthenticated",{status:401});
 try{await requireOwner(user.id);}catch{return new Response("Forbidden",{status:403});}
 const program=positionProgram(new URL(req.url).searchParams.get("program"));
 if(!program)return new Response("Unknown program",{status:404});
 const {data,error}=await createAdminSupabase().from("owner_lesson_editorial_reviews").select("lesson_key,content_hash,state,note").eq("program_key",program.key).eq("state","observation").limit(500);
 if(error)return new Response("Unavailable",{status:503});
 const {locale}=await localeContext(),esc=(value:string)=>{const safe=/^[=+@\-\t\r]/.test(value)?"'"+value:value;return '"'+safe.replaceAll('"','""')+'"';};
 const rows=[["program","level","lesson_key","lesson_title","state","note"]];
 for(const row of data??[]){const lesson=program.lessons.find(x=>x.key===row.lesson_key);if(!lesson||editorialFingerprint(lesson)!==row.content_hash)continue;
   rows.push([program.key,String(lesson.level),lesson.key,lesson.title[locale]||lesson.title.es,"observation",row.note??""]);}
 const csv="\uFEFF"+rows.map(r=>r.map(esc).join(",")).join("\r\n")+"\r\n";
 return new Response(csv,{status:200,headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="garciloga-editorial-'+program.key+'.csv"',"Cache-Control":"private, no-store"}});
}

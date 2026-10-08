import {randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {createServerSupabase,getServerUser} from "../../../../lib/supabase-server";
import {createAdminSupabase} from "../../../../lib/admin";
import {isTrustedBrowserRequest} from "../../../../lib/security";
import {consumeRateLimit} from "../../../../lib/rate-limit";
import {boundedForm} from "../../../../lib/bounded-form";
import {MAX_PHOTO_BYTES,PHOTO_BUCKET,normalizeProfilePhoto} from "../../../../lib/profile-photo";
export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
export async function GET() {
  const {data:{user}}=await getServerUser();
  if(!user) return new Response(null,{status:401,headers});
  const supabase=await createServerSupabase();
  const {data,error}=await supabase.storage.from(PHOTO_BUCKET).download(`${user.id}/avatar.webp`);
  if(error || !data) return new Response(null,{status:404,headers});
  return new Response(await data.arrayBuffer(),{headers:{...headers,"Content-Type":"image/webp"}});
}
async function mutate(req:Request,remove:boolean) {
  if(!isTrustedBrowserRequest(req)) return NextResponse.json({error:"FORBIDDEN"},{status:403,headers});
  const {data:{user}}=await getServerUser();
  if(!user) return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers});
  const rate=await consumeRateLimit(`profile-photo:${user.id}`,10,600);
  if(!rate.allowed) return NextResponse.json({error:"RATE_LIMITED"},{status:429,headers:{...headers,"Retry-After":String(rate.retry_after_seconds)}});
  const supabase=await createServerSupabase();
  const path=`${user.id}/avatar.webp`;
  let version:string|null=null;
  if(remove) {
    const {error}=await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    if(error) return NextResponse.json({error:"STORAGE_UNAVAILABLE"},{status:503,headers});
  } else {
    if(Number(req.headers.get("content-length"))>MAX_PHOTO_BYTES+65536) return NextResponse.json({error:"INVALID_PHOTO"},{status:413,headers});
    let photo:Buffer;
    try {
      const form=await boundedForm(req,MAX_PHOTO_BYTES+65536);const file=form.get("photo");
      if(!(file instanceof File) || file.size>MAX_PHOTO_BYTES) throw new Error("INVALID_PHOTO");
      photo=await normalizeProfilePhoto(new Uint8Array(await file.arrayBuffer()),file.type);
    } catch {return NextResponse.json({error:"INVALID_PHOTO"},{status:400,headers});}
    const {error}=await supabase.storage.from(PHOTO_BUCKET).upload(path,photo,{contentType:"image/webp",upsert:true,cacheControl:"0"});
    if(error) return NextResponse.json({error:"STORAGE_UNAVAILABLE"},{status:503,headers});
    version=randomUUID();
  }
  // Match the existing profile update API: validated session, server-only client, own ID only.
  const {error}=await createAdminSupabase().from("profiles").update({avatar_version:version,updated_at:new Date().toISOString()}).eq("id",user.id);
  if(error) return NextResponse.json({error:"PROFILE_UNAVAILABLE"},{status:503,headers});
  return NextResponse.json({version},{headers});
}
export async function POST(req:Request){return mutate(req,false);}
export async function DELETE(req:Request){return mutate(req,true);}

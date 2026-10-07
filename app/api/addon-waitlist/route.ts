import { workspaceUser } from "../../../lib/workspace-server";
import { workspaceEnabled, trustedWorkspaceMutation } from "../../../lib/workspace-sandbox";
import { ADDON_OFFERS } from "../../../lib/modular-offers";
export async function POST(req: Request) {
 const reply = (body: object,status: number) => Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
 if (!workspaceEnabled() || process.env.CODEZERO_MODULAR_PREVIEW !== "1") return reply({error:"No disponible"},404);
 if (!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL)) return reply({error:"Origen no permitido"},403);
 const session=await workspaceUser(); if(!session)return reply({error:"Inicia sesión con una cuenta activa"},401);
 const raw=await req.text(); if(raw.length>500)return reply({error:"Solicitud demasiado grande"},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:"JSON inválido"},400);}
 if(!body || Object.keys(body).sort().join(",")!=="interested,key" || typeof body.interested!=="boolean" || !ADDON_OFFERS.some(offer=>offer.key===body.key))return reply({error:"Módulo inválido"},400);
 if(body.interested){
  const {data:offer,error}=await session.supabase.from("addons").select("key,status").eq("key",body.key).single();
  if(error)return reply({error:"Catálogo no disponible"},503);
  if(offer?.status!=="coming_soon")return reply({error:"La lista de espera de este módulo está cerrada"},409);
  const saved=await session.supabase.from("addon_waitlist").upsert({user_id:session.user.id,addon_key:body.key},{onConflict:"user_id,addon_key",ignoreDuplicates:true});
  if(saved.error)return reply({error:"No se pudo guardar tu interés"},503);
 }else{
  const removed=await session.supabase.from("addon_waitlist").delete().eq("user_id",session.user.id).eq("addon_key",body.key);
  if(removed.error)return reply({error:"No se pudo retirar tu interés"},503);
 }
 return reply({interested:body.interested},200);
}

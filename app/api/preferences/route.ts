import { NextResponse } from "next/server";
import { workspaceUser } from "../../../lib/workspace-server";
import { trustedWorkspaceMutation, workspaceEnabled } from "../../../lib/workspace-sandbox";
import { validAppearance } from "../../../lib/user-appearance";
export async function POST(req: Request) {
  if (!workspaceEnabled()) return new Response(null,{status:404});
  if (!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL)) return new Response(null,{status:403});
  const context = await workspaceUser();
  if (!context) return new Response(null,{status:401});
  let value: unknown;
  try {value = await req.json();} catch {return new Response(null,{status:400});}
  if (!validAppearance(value)) return new Response(null,{status:400});
  const {error} = await context.supabase.from("user_preferences").upsert({user_id:context.user.id,mode:value.mode,accent:value.accent,colors:value.colors ?? {},updated_at:new Date().toISOString()});
  return NextResponse.json(error ? {saved:false} : {saved:true},{status:error?503:200,headers:{"Cache-Control":"private, no-store"}});
}

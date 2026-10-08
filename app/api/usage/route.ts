import {createServerSupabase} from '../../../lib/supabase-server';
import {createAdminSupabase} from '../../../lib/admin';
import {trustedWorkspaceMutation,workspaceEnabled} from '../../../lib/workspace-sandbox';
import {supportSession} from '../../../lib/support-session';
import {boundedJson} from '../../../lib/bounded-json';
import {consumeRateLimit} from '../../../lib/rate-limit';
import {validUsageBatch} from '../../../lib/platform-usage';
const headers = {'Cache-Control':'private, no-store'};
export async function POST(req:Request) {
  if (!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL)) return new Response(null,{status:403,headers});
  if (!workspaceEnabled()) return new Response(null,{status:404,headers});
  if (await supportSession()) return new Response(null,{status:204,headers});
  const {data:{user}} = await (await createServerSupabase()).auth.getUser();
  if (!user) return new Response(null,{status:401,headers});
  let batch:unknown;
  try {batch = await boundedJson(req,1024);} catch {return new Response(null,{status:400,headers});}
  if (!validUsageBatch(batch)) return new Response(null,{status:400,headers});
  try {
    const admin=createAdminSupabase();
    const {data:profile,error:profileError}=await admin.from('profiles').select('role,status,deleted_at').eq('id',user.id).maybeSingle();
    if (profileError) return new Response(null,{status:503,headers});
    if (!profile || profile.status !== 'active' || profile.deleted_at) return new Response(null,{status:403,headers});
    if (profile.role === 'owner') return new Response(null,{status:204,headers});
    if (!(await consumeRateLimit('platform-usage:'+user.id,60,60)).allowed) return new Response(null,{status:429,headers});
    const {error}=await admin.rpc('record_platform_usage',{p_user:user.id,p_batch:batch.id,p_section:batch.section,p_clicks:batch.clicks,p_visits:batch.visits});
    return new Response(null,{status:error?503:204,headers});
  } catch {return new Response(null,{status:503,headers});}
}

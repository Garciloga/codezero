import { workspaceEnabled } from './workspace-sandbox.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
export async function loadWorkspaceSession(env:Record<string,string|undefined>,create:()=>Promise<SupabaseClient>){
 if(!workspaceEnabled(env))return null;
 const supabase=await create();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)return null;
 const {data:profile,error:profileError}=await supabase.from('profiles').select('id,status,role,full_name,plan_name').eq('id',user.id).single();
 if(profileError||profile?.status!=='active'||profile.id!==user.id)return null;
 return {supabase,user,profile};
}

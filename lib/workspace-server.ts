import "server-only";
import { createServerSupabase } from "./supabase-server";
import { workspaceSandboxEnabled } from "./workspace-sandbox";
export async function workspaceUser() {
  if (!workspaceSandboxEnabled()) return null;
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id,status,role,full_name,plan_name").eq("id",user.id).single();
  if (profileError || profile?.status !== "active") return null;
  return { supabase, user, profile };
}

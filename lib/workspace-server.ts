import "server-only";
import { createServerSupabase } from "./supabase-server";
import { loadWorkspaceSession } from "./workspace-session";
export async function workspaceUser() {
  return loadWorkspaceSession(process.env,createServerSupabase);
}

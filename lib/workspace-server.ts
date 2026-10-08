import "server-only";
import { createServerSupabase } from "./supabase-server";
import {effectiveLearningPlan} from "./company-learning-server";
import { loadWorkspaceSession } from "./workspace-session";
export async function workspaceUser() {
  const session=await loadWorkspaceSession(process.env,createServerSupabase);
  if(session)session.profile={...session.profile,plan_name:await effectiveLearningPlan(session.user.id,session.profile.plan_name??'free')};
  return session;
}

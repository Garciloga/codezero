import "server-only";
import { createServerSupabase } from "./supabase-server";
import { createAdminSupabase } from "./admin";
import { isCareerLabOwner } from "./career-lab-access";

export async function careerLabOwner() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  const { data: profile, error: profileError } = await createAdminSupabase()
    .from("profiles").select("role,status").eq("id", user.id).single();
  return !profileError && isCareerLabOwner(profile);
}

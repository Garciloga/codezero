import "server-only";
import { createServerSupabase } from "./supabase-server";
import { isCareerLabOwner } from "./career-lab-access";

export async function careerLabOwner() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  // Read only the verified user's own profile through the existing SELECT RLS.
  // This guard does not need a service credential or permission to bypass RLS.
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role,status").eq("id", user.id).single();
  return !profileError && isCareerLabOwner(profile);
}

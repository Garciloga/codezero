import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase, getServerUser } from "./supabase-server";
import { createAdminSupabase } from "./admin";
import { workspaceEnabled, isUuid } from "./workspace-sandbox";
import { readWorkspacePages } from "./workspace-pages";
import {
  summarizePerson,
  type Member,
  type Assignment,
  type Evidence,
  type LearningError,
} from "./organization-metrics";
export const accountNavigation = cache(async () => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await getServerUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,plan_name,status,role")
    .eq("id", user.id)
    .maybeSingle();
  const memberships = workspaceEnabled()
    ? ((
        await supabase
          .from("organization_memberships")
          .select("organization_id,role,display_name,job_title")
          .eq("user_id", user.id)
          .eq("active", true)
      ).data ?? [])
    : [];
  const organizations = memberships.length
    ? ((
        await supabase
          .from("organizations")
          .select("id,name")
          .eq("active", true)
          .in(
            "id",
            memberships.map((m) => m.organization_id),
          )
      ).data ?? [])
    : [];
  const choices = memberships
    .map((m) => ({
      ...m,
      name: organizations.find((o) => o.id === m.organization_id)?.name,
    }))
    .filter((m) => m.name);
  const selected = (await cookies()).get("codezero_organization")?.value;
  return {
    user,
    profile,
    organizations: choices,
    organization:
      choices.find((m) => m.organization_id === selected) ?? choices[0] ?? null,
  };
});
export async function organizationView(
  org: string,
  allowed: readonly string[] = [
    "owner",
    "admin",
    "manager",
    "supervisor",
    "learner",
  ],
) {
  if (!isUuid(org) || !workspaceEnabled()) return null;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await getServerUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.status !== "active") return null;
  const { data: own } = await supabase
    .from("organization_memberships")
    .select(
      "organization_id,user_id,display_name,role,reports_to,active,job_title",
    )
    .eq("organization_id", org)
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (!own || !allowed.includes(own.role)) return null;
  const { data: organization } = await supabase
    .from("organizations")
    .select("id,name")
    .eq("id", org)
    .eq("active", true)
    .maybeSingle();
  if (!organization) return null;
  const [members, assignments, evidence, errors, directory, levels] =
    await Promise.all([
      readWorkspacePages<Member>((a, b) =>
        supabase
          .from("organization_memberships")
          .select("user_id,display_name,role,reports_to,active,job_title")
          .eq("organization_id", org)
          .eq("active", true)
          .order("user_id")
          .range(a, b),
      ),
      readWorkspacePages<Assignment>((a, b) =>
        supabase
          .from("learning_assignments")
          .select(
            "user_id,activity_key,activity_type,activity_id,title,competency",
          )
          .eq("organization_id", org)
          .order("user_id")
          .order("activity_key")
          .range(a, b),
      ),
      readWorkspacePages<Evidence>((a, b) =>
        supabase
          .from("learning_evidence")
          .select("user_id,activity_key,completed,score")
          .eq("organization_id", org)
          .order("user_id")
          .order("activity_key")
          .range(a, b),
      ),
      readWorkspacePages<LearningError>((a, b) =>
        supabase
          .from("learning_errors")
          .select("user_id,activity_key,category")
          .eq("organization_id", org)
          .order("user_id")
          .order("activity_key")
          .range(a, b),
      ),
      createAdminSupabase().rpc("workspace_directory", {
        p_org: org,
        p_actor: user.id,
      }),
      createAdminSupabase().rpc("workspace_current_levels", {
        p_org: org,
        p_actor: user.id,
      }),
    ]);
  if (
    [members, assignments, evidence, errors, directory, levels].some(
      (r) => r.error,
    )
  )
    throw new Error("TEAM_DATA_UNAVAILABLE");
  const people = (members.data ?? []).map((member) =>
    summarizePerson(
      member,
      assignments.data ?? [],
      evidence.data ?? [],
      errors.data ?? [],
      levels.data?.find(
        (l: { user_id: string; current_level: number }) =>
          l.user_id === member.user_id,
      )?.current_level ?? null,
    ),
  );
  return {
    supabase,
    user,
    own: own as Member,
    organization,
    people,
    directory: directory.data as Member[],
  };
}
export async function requireOrganization(
  org: string,
  allowed: readonly string[],
) {
  const data = await organizationView(org, allowed);
  if (!data) redirect("/dashboard");
  return data;
}

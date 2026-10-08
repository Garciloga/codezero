import { redirect } from "next/navigation";
import { requireOrganization } from "../../../lib/organization-server";
export default async function TeamHome({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const { organizationId } = await params;
  const d = await requireOrganization(organizationId, [
    "owner",
    "admin",
    "manager",
    "supervisor",
    "learner",
  ]);
  const { result } = await searchParams;
  redirect(
    `/teams/${organizationId}/${d.own.role === "learner" ? "tasks" : "people"}${result ? "?result=" + encodeURIComponent(result) : ""}`,
  );
}

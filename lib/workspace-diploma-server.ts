import "server-only";
import { workspaceEnabled } from "./workspace-sandbox";
import { createAdminSupabase } from "./admin";
/** Optional award side effect must never roll back an already saved assessment. */
export async function maybeIssueWorkspaceDiploma(userId: string, level: number) {
  if (!workspaceEnabled()) return;
  try {
    await createAdminSupabase().rpc("issue_workspace_diploma",{p_user:userId,p_level:level});
  } catch { /* Can be retried privately through /api/diplomas/issue. */ }
}

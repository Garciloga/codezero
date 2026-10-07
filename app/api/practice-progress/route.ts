import { workspaceUser } from "../../../lib/workspace-server";
import { trustedWorkspaceMutation, workspaceEnabled } from "../../../lib/workspace-sandbox";
import { validPracticeProgress } from "../../../lib/practice-progress";
export async function POST(req: Request) {
  const reply = (body: object, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (!workspaceEnabled() || (process.env.CODEZERO_PRACTICE_PREVIEW !== "1" && process.env.CODEZERO_ENVIRONMENT !== "production")) return reply({ error: "No disponible" },404);
  if (!trustedWorkspaceMutation(req, process.env.NEXT_PUBLIC_APP_URL)) return reply({ error: "Origen no permitido" },403);
  const session = await workspaceUser();
  if (!session) return reply({ error: "Inicia sesión con una cuenta activa" },401);
  const text = await req.text();
  if (text.length > 5000) return reply({ error: "Solicitud demasiado grande" },413);
  let body;
  try { body = JSON.parse(text); } catch { return reply({ error: "JSON inválido" },400); }
  if (!body || !validPracticeProgress(body.progress) || !Number.isSafeInteger(body.revision) || body.revision < 0 || Object.keys(body).sort().join(",") !== "progress,revision") return reply({ error: "Progreso inválido" },400);
  const { data, error } = await session.supabase.rpc("save_private_practice_progress", { p_progress: body.progress, p_revision: body.revision });
  if (error) return reply({ error: error.code === "PT409" ? "Otra pestaña guardó cambios. Recarga antes de guardar." : "No se pudo guardar; conserva esta página abierta." },error.code === "PT409" ? 409 : 503);
  return reply({ revision: data },200);
}

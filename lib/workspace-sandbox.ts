type SandboxEnvironment = { [key: string]: string | undefined };
const PRODUCTION_REF = "kwfzhpapvpdatdfwhouf";
/** Review pages remain confined to their explicitly selected sandbox. */
export function workspaceSandboxEnabled(env: SandboxEnvironment = process.env): boolean {
  if (env.CODEZERO_WORKSPACE_SANDBOX !== "1" || env.CODEZERO_ENVIRONMENT !== "sandbox" || env.VERCEL_ENV === "production") return false;
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const ref = env.CODEZERO_SANDBOX_PROJECT_REF;
    if (ref === "local") return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && ["http:","https:"].includes(url.protocol);
    return Boolean(ref && /^[a-z]{20}$/.test(ref) && ref !== PRODUCTION_REF && url.protocol === "https:" && url.hostname === `${ref}.supabase.co`);
  } catch { return false; }
}
export function trustedWorkspaceMutation(req: Request, appUrl?: string) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try { return origin === new URL(req.url).origin || Boolean(appUrl && origin === new URL(appUrl).origin); }
  catch { return false; }
}
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
export function isTestInvitationEmail(email: string) {
  return /^[a-z0-9._+-]+@codezero\.example\.test$/.test(email);
}

/** Production activation is separate from review flags and validates the database target. */
export function workspaceProductionEnabled(env: SandboxEnvironment = process.env): boolean {
  if (env.CODEZERO_WORKSPACE_PRODUCTION !== "1" || env.CODEZERO_ENVIRONMENT !== "production" || env.VERCEL_ENV !== "production") return false;
  try { return new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin === `https://${PRODUCTION_REF}.supabase.co`; }
  catch { return false; }
}
export function workspaceEnabled(env: SandboxEnvironment = process.env): boolean {
  return workspaceSandboxEnabled(env) || workspaceProductionEnabled(env);
}
export function workspaceWaitlistEnabled(env: SandboxEnvironment = process.env): boolean {
  return workspaceProductionEnabled(env) || (workspaceSandboxEnabled(env) && env.CODEZERO_MODULAR_PREVIEW === "1");
}
export function validInvitationEmail(email: string): boolean {
  return email.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

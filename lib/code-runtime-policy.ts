/** Local review only. Never infer a trusted origin from request/forwarded headers. */
export function codeRuntimeConfiguration(env: Record<string, string | undefined>) {
  if (env.CODEZERO_PRACTICE_PREVIEW !== "1" || env.CODEZERO_CODE_RUNTIME !== "1"
    || env.CODEZERO_ENVIRONMENT !== "sandbox" || env.VERCEL_ENV === "production") return null;
  try {
    const app = new URL(env.NEXT_PUBLIC_APP_URL ?? "");
    const runtime = new URL(env.CODEZERO_CODE_RUNTIME_ORIGIN ?? "");
    const local = (url: URL) => ["localhost", "127.0.0.1"].includes(url.hostname)
      && url.protocol === "http:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash;
    // Different hostname as well as origin: cookies are not isolated by port.
    if (!local(app) || !local(runtime) || app.hostname === runtime.hostname || !app.port || !runtime.port) return null;
    if (env.NEXT_PUBLIC_SUPABASE_URL?.toLowerCase().includes("kwfzhpapvpdatdfwhouf")) return null;
    return { appOrigin: app.origin, runtimeOrigin: runtime.origin };
  } catch { return null; }
}

export function boundedRuntimeResult(data: unknown, id: string) {
  if (!data || typeof data !== "object") return null;
  const value = data as Record<string, unknown>;
  if (value.id !== id || value.type !== "result" || typeof value.status !== "string" || !["complete", "error", "timeout", "cancelled"].includes(value.status)
    || typeof value.stdout !== "string" || typeof value.error !== "string" || value.stdout.length > 4096 || value.error.length > 600) return null;
  return { status: String(value.status), stdout: value.stdout, error: value.error, truncated: value.truncated === true };
}

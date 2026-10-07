export const LIMITS = Object.freeze({ code: 8000, output: 4096, error: 600, rows: 50, loadMs: 25000, runMs: 3000 });
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validRun(message) {
  return Boolean(message && message.type === "run" && typeof message.id === "string" && UUID.test(message.id)
    && ["python", "sql"].includes(message.language) && typeof message.code === "string"
    && message.code.trim().length > 0 && message.code.length <= LIMITS.code);
}
export function boundedText(value, size) { return String(value ?? "").slice(0, size); }
export function localRuntimeConfig(env) {
  if (env.CODEZERO_ENVIRONMENT !== "sandbox" || env.VERCEL_ENV === "production") return null;
  try {
    const app = new URL(env.CODEZERO_RUNTIME_PARENT ?? "");
    const runtime = new URL(env.CODEZERO_CODE_RUNTIME_ORIGIN ?? "");
    const local = url => url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)
      && url.port && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash;
    if (!local(app) || !local(runtime) || app.hostname === runtime.hostname) return null;
    return { appOrigin: app.origin, runtimeOrigin: runtime.origin, host: runtime.hostname, port: Number(runtime.port) };
  } catch { return null; }
}

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { localRuntimeConfig } from "./protocol.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const py = resolve(root, "node_modules/pyodide");
const sql = resolve(root, "node_modules/@sqlite.org/sqlite-wasm/dist");
const resources = new Map([
  ["/frame.mjs", [resolve(root, "frame.mjs"), "text/javascript"]],
  ["/worker.mjs", [resolve(root, "worker.mjs"), "text/javascript"]],
  ["/protocol.mjs", [resolve(root, "protocol.mjs"), "text/javascript"]],
  ...["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"].map(name => [`/pyodide/${name}`, [resolve(py, name), name.endsWith(".wasm") ? "application/wasm" : name.endsWith(".zip") ? "application/zip" : name.endsWith(".json") ? "application/json" : "text/javascript"]]),
  ...["index.mjs", "sqlite3.wasm"].map(name => [`/sqlite/${name}`, [resolve(sql, name), name.endsWith(".wasm") ? "application/wasm" : "text/javascript"]]),
]);

export function runtimeHeaders(config) {
  return {
    "Content-Security-Policy": ["default-src 'none'", `script-src ${config.runtimeOrigin} 'wasm-unsafe-eval'`,
      `worker-src blob: ${config.runtimeOrigin}`, `connect-src ${config.runtimeOrigin}`, `frame-ancestors ${config.appOrigin}`,
      "base-uri 'none'", "form-action 'none'", "object-src 'none'", "img-src 'none'"].join("; "),
    "Access-Control-Allow-Origin": "*", // Opaque iframe/module workers, never credentials.
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Cache-Control": "no-store", "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  };
}

export function createRuntimeServer(config) {
  return createServer(async (req, res) => {
    const headers = runtimeHeaders(config);
    const end = (status, body = "") => { res.writeHead(status, { ...headers, "Content-Type": "text/plain; charset=utf-8" }); res.end(body); };
    if (req.headers.host !== new URL(config.runtimeOrigin).host) return end(421);
    if (!["GET", "HEAD"].includes(req.method)) return end(405);
    // Exact asset allowlist. No query strings, body processing, path traversal, redirects or request logs.
    if (!req.url || req.url.includes("?") || req.url.includes("%") || req.url.includes("\\")) return end(404);
    if (req.url === "/frame") {
      const document = '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Motor de práctica aislado</title></head><body><p>Motor de práctica con datos ficticios.</p><script type="module" src="'+config.runtimeOrigin+'/frame.mjs" data-parent="'+config.appOrigin+'"></script></body></html>';
      res.writeHead(200, { ...headers, "Content-Type": "text/html; charset=utf-8" });
      return res.end(req.method === "HEAD" ? "" : document);
    }
    const resource = resources.get(req.url);
    if (!resource) return end(404);
    try {
      const bytes = await readFile(resource[0]);
      res.writeHead(200, { ...headers, "Content-Type": resource[1], "Content-Length": bytes.length });
      res.end(req.method === "HEAD" ? undefined : bytes);
    } catch { end(503, "Instala las dependencias fijadas del motor de pruebas."); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const config = localRuntimeConfig(process.env);
  if (!config) throw new Error("El motor solo admite pruebas locales en hosts separados; revisa su configuración.");
  createRuntimeServer(config).listen(config.port, config.host, () => console.log("Motor local de práctica listo."));
}

import { LIMITS, UUID, validRun, boundedText } from "./protocol.mjs";

const channel = new URLSearchParams(location.hash.slice(1)).get("channel");
const parentOrigin = document.querySelector("script[data-parent]")?.dataset.parent;
let current = null;
const send = message => parent.postMessage({ ...message, channel }, parentOrigin);
function finish(status, stdout = "", error = "", truncated = false) {
  if (!current) return;
  const { id, worker, blobUrl, timer } = current;
  clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(blobUrl); current = null;
  send({ type: "result", id, status, stdout: boundedText(stdout, LIMITS.output), error: boundedText(error, LIMITS.error), truncated });
}

if (UUID.test(channel ?? "") && parent !== window && parentOrigin) {
  window.addEventListener("message", event => {
    if (event.source !== parent || event.origin !== parentOrigin || event.data?.channel !== channel) return;
    const message = event.data;
    if (message.type === "cancel" && current?.id === message.id) return finish("cancelled", "", "Ejecución detenida.");
    if (!validRun(message) || current) return;
    const moduleUrl = new URL("./worker.mjs", import.meta.url).href;
    const blobUrl = URL.createObjectURL(new Blob([`import ${JSON.stringify(moduleUrl)};`], { type: "text/javascript" }));
    let worker;
    try { worker = new Worker(blobUrl, { type: "module" }); }
    catch { URL.revokeObjectURL(blobUrl); return send({ type: "result", id: message.id, status: "error", stdout: "", error: "Este navegador no pudo iniciar el motor aislado.", truncated: false }); }
    current = { id: message.id, worker, blobUrl, phase: "loading", timer: setTimeout(() => finish("timeout", "", "No se pudo cargar el motor a tiempo."), LIMITS.loadMs) };
    worker.onmessage = ({ data }) => {
      if (!current || data?.id !== current.id) return;
      if (data.type === "running" && current.phase === "loading") {
        current.phase = "running"; clearTimeout(current.timer);
        current.timer = setTimeout(() => finish("timeout", "", "Se alcanzó el límite de 3 segundos. Revisa bucles o consultas largas."), LIMITS.runMs);
        send({ type: "running", id: current.id });
      } else if (data.type === "result" && ["complete", "error"].includes(data.status)) {
        finish(data.status, data.stdout, data.error, data.truncated === true);
      }
    };
    worker.onerror = event => { event.preventDefault(); console.warn("Fallo de carga del motor aislado:", boundedText(event.message, 500)); finish("error", "", "El motor no pudo ejecutar esta práctica. Puedes reintentar."); };
    worker.postMessage(message);
  });
  send({ type: "frame_ready" });
}
window.addEventListener("pagehide", () => { if (current) { clearTimeout(current.timer); current.worker.terminate(); URL.revokeObjectURL(current.blobUrl); } });

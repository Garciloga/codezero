import { LIMITS, validRun, boundedText } from "./protocol.mjs";

const base = new URL(".", import.meta.url).href;
function executeStatements(sqlite, db, sql, onRow = () => {}) {
  let remaining = sql;
  while (remaining.trim()) {
    const statement = db.prepare(remaining);
    try {
      const consumed = sqlite.capi.sqlite3_sql(statement.pointer);
      if (typeof consumed !== "string" || !consumed.length || !remaining.startsWith(consumed)) throw new Error("No se pudo interpretar esta sentencia SQL.");
      remaining = remaining.slice(consumed.length);
      while (statement.step()) onRow(statement.get({}));
    } finally { statement.finalize(); }
  }
}
let started = false;
globalThis.onmessage = async ({ data }) => {
  if (started || !validRun(data)) return;
  started = true;
  let stdout = ""; let truncated = false; let finished = false;
  const send = (status, error = "") => { if (finished) return; finished = true; globalThis.postMessage({ type: "result", id: data.id, status, stdout, error: boundedText(error, LIMITS.error), truncated }); };
  const append = text => {
    if (finished) return;
    const next = String(text) + "\n";
    if (stdout.length + next.length > LIMITS.output) {
      stdout = (stdout + next).slice(0, LIMITS.output); truncated = true;
      send("error", "Se alcanzó el límite de salida de la práctica."); globalThis.close(); return;
    }
    stdout += next;
  };
  try {
    if (data.language === "python") {
      const { loadPyodide } = await import(base + "pyodide/pyodide.mjs");
      const pyodide = await loadPyodide({ indexURL: base + "pyodide/", stdout: () => {}, stderr: () => {} });
      pyodide.setStdout({ batched: append });
      pyodide.setStderr({ batched: append });
      pyodide.setStdin({ stdin: () => null });
      globalThis.postMessage({ type: "running", id: data.id });
      // No automatic packages/import installation. Standard library only; no app context is passed.
      await pyodide.runPythonAsync(data.code);
    } else {
      const { default: sqlite3InitModule } = await import(base + "sqlite/index.mjs");
      const sqlite = await sqlite3InitModule({ print: () => {}, printErr: () => {} });
      const db = new sqlite.oo1.DB(":memory:", "c");
      try {
        executeStatements(sqlite, db, "CREATE TABLE cuentas(id INTEGER PRIMARY KEY,nombre TEXT,estado TEXT,asientos INTEGER); INSERT INTO cuentas VALUES(1,'Faro','activo',3),(2,'Nube','inactivo',2),(3,'Puente','activo',5);");
        sqlite.capi.sqlite3_limit(db.pointer, sqlite.capi.SQLITE_LIMIT_LENGTH, LIMITS.output);
        sqlite.capi.sqlite3_limit(db.pointer, sqlite.capi.SQLITE_LIMIT_SQL_LENGTH, LIMITS.code);
        sqlite.capi.sqlite3_limit(db.pointer, sqlite.capi.SQLITE_LIMIT_COLUMN, 64);
        let rows = 0;
        globalThis.postMessage({ type: "running", id: data.id });
        executeStatements(sqlite, db, data.code, row => {
          if (++rows > LIMITS.rows) { truncated = true; throw new Error("Se alcanzó el límite de 50 filas. Agrega LIMIT a la consulta."); }
          append(JSON.stringify(row, (_, value) => typeof value === "bigint" ? value.toString() : value));
        });
        if (!rows) append("Consulta ejecutada sin filas de resultado; los datos se reinician en cada ejecución.");
      } finally { db.close(); }
    }
    send("complete");
  } catch (error) { send("error", error?.message ?? "No se pudo ejecutar el código."); }
};

/** Original fictional practice. Never a source of exam scores or entitlements. */
export type PracticeKind = "order_steps" | "fill_blank" | "find_error" | "predict_output";
export type Skill = "logic" | "python" | "sql" | "apis" | "security" | "communication";
export type PracticeActivity = {
  id: string; level: number; kind: PracticeKind; skill: Skill; title: string;
  prompt: string; options?: readonly string[]; answer: string | readonly string[];
  explanation: string; evidence: string;
};
export const PRACTICE_ACTIVITIES: readonly PracticeActivity[] = [
  { id: "handoff", level: 1, kind: "order_steps", skill: "logic", title: "Prepara un onboarding",
    prompt: "Ordena las acciones para iniciar una implementación con un cliente.",
    options: ["Acordar una prueba de aceptación", "Identificar el objetivo y a su responsable", "Probar con datos ficticios", "Configurar la integración"],
    answer: ["1", "0", "3", "2"], explanation: "Primero define el resultado, después cómo comprobarlo; configura y prueba antes de operar con datos reales.", evidence: "Checklist con objetivo, responsable y criterio de aceptación." },
  { id: "python-output", level: 2, kind: "predict_output", skill: "python", title: "Predice una salida de Python",
    prompt: 'activos = [True, False, True]\nprint(sum(activos))\n\n¿Qué número se imprime?',
    answer: "2", explanation: "True suma 1 y False suma 0. Dos cuentas están activas.", evidence: "Explicación del resultado y un caso con todas las cuentas inactivas." },
  { id: "python-error", level: 3, kind: "find_error", skill: "python", title: "Detecta un error de tipos",
    prompt: 'asientos = "5"\ntotal = asientos * 99\n\n¿Por qué no se obtiene el importe numérico esperado?',
    options: ["El número 99 no es válido", "La cadena se repite; hay que validar y convertir asientos a entero", "Multiplicar exige una API", "Hay que agregar un cero al resultado"],
    answer: "1", explanation: "Multiplicar una cadena por un entero repite el texto. Valida la entrada y conviértela antes de calcular.", evidence: "Corrección y prueba con una entrada no numérica." },
  { id: "sql-filter", level: 6, kind: "fill_blank", skill: "sql", title: "Completa una consulta SQL",
    prompt: "SELECT nombre FROM cuentas ___ estado = 'activo';\n\nCompleta la palabra que filtra filas.",
    answer: "WHERE", explanation: "WHERE filtra filas. Para comprobarlo usa una cuenta activa y otra inactiva.", evidence: "Consulta y comparación del resultado con el conjunto de datos." },
  { id: "support-note", level: 8, kind: "find_error", skill: "communication", title: "Mejora un reporte al cliente",
    prompt: "La integración respondió 401. ¿Qué mensaje permite avanzar sin pedir secretos?",
    options: ["Envíame tu contraseña", "Todo está roto; espera", "La autorización fue rechazada; revisaremos la vigencia y los permisos, sin compartir tokens. Próxima actualización a las 16:00", "Publica el token para que todos puedan probar"],
    answer: "2", explanation: "Un reporte útil distingue el síntoma de la causa, protege secretos e incluye la siguiente acción y actualización.", evidence: "Resumen de impacto, hipótesis, responsable y siguiente actualización." },
  { id: "safe-webhook", level: 14, kind: "order_steps", skill: "security", title: "Procesa un webhook de forma segura",
    prompt: "Ordena el procesamiento del evento antes de causar efectos en un sistema.",
    options: ["Aplicar el cambio una sola vez", "Verificar firma y antigüedad sobre el cuerpo original", "Registrar o encolar de forma durable", "Comprobar si el ID del evento ya fue procesado"],
    answer: ["1", "3", "2", "0"], explanation: "Rechaza eventos no auténticos y duplicados antes de realizar efectos. El registro y la deduplicación deben ser atómicos en un sistema real.", evidence: "Pruebas de firma inválida, evento repetido y recuperación ante fallos." },
];

export function gradePractice(activity: PracticeActivity, input: unknown): boolean {
  if (activity.kind === "order_steps") {
    return Array.isArray(input) && Array.isArray(activity.answer) && input.length === activity.answer.length
      && new Set(input).size === input.length && input.every((value, index) => typeof value === "string" && value === activity.answer[index]);
  }
  if (typeof input !== "string" || input.length > 200 || typeof activity.answer !== "string") return false;
  const normalized = input.trim();
  return activity.kind === "fill_blank" ? normalized.toUpperCase() === activity.answer.toUpperCase() : normalized === activity.answer;
}

export const SKILL_LABELS: Record<Skill, string> = {
  logic: "Proceso y lógica", python: "Python", sql: "SQL", apis: "APIs", security: "Seguridad", communication: "Comunicación con el cliente",
};
export const TARGET_ROLES = [
  { id: "technical_cs", label: "Customer Success técnico", skills: ["logic", "apis", "communication"] },
  { id: "support", label: "Soporte técnico", skills: ["python", "apis", "communication"] },
  { id: "integrations", label: "Integraciones", skills: ["sql", "apis", "security"] },
] as const;

export type LabRequest = { method: string; path: string; token: string; body: string; resolution: string };
export type ApiLab = { id: string; level: number; title: string; task: string; method: string; path: string;
  token: string; payload: Record<string, unknown>; fault: string; choices: readonly string[]; resolution: string;
  explanation: string; evidence: string };
export const API_LABS: readonly ApiLab[] = [
  { id: "api-11", level: 11, title: "Entrega de webhook rechazada", task: "Consulta la entrega evt_demo_01 y diagnostica su fallo.", method: "GET", path: "/demo/deliveries/evt_demo_01", token: "demo_reader", payload: {},
    fault: "401 · invalid_signature: la firma se calculó sobre JSON reformateado", choices: ["Reintentar sin cambiar nada", "Validar firma sobre el cuerpo original y comprobar la clave de prueba", "Desactivar la verificación"], resolution: "1",
    explanation: "La firma se verifica sobre los bytes originales. Reintentar una firma inválida no la corrige; nunca se elimina la verificación.", evidence: "Causa, corrección y pruebas de firma válida/inválida." },
  { id: "api-12", level: 12, title: "OAuth sin alcance suficiente", task: 'Solicita la sincronización de contactos con {"scope":"contacts:read"}.', method: "POST", path: "/demo/sync", token: "demo_reader", payload: { scope: "contacts:read" },
    fault: "403 · insufficient_scope: la conexión no tiene contacts:read", choices: ["Solicitar consentimiento para el alcance mínimo y renovar la autorización", "Pedir todos los permisos de administrador", "Registrar la contraseña del cliente"], resolution: "0",
    explanation: "La identidad puede ser válida y carecer del alcance necesario. Usa consentimiento y privilegio mínimo; no compartas credenciales.", evidence: "Permiso requerido y prueba de rechazo sin ese permiso." },
  { id: "api-13", level: 13, title: "Mapeo entre CRM y facturación", task: 'Valida {"external_id":"crm_42","amount_cents":14900,"currency":"MXN"}.', method: "POST", path: "/demo/invoices/validate", token: "demo_reader", payload: { external_id: "crm_42", amount_cents: 14900, currency: "MXN" },
    fault: "422 · mapping_missing: crm_42 no tiene customer_id de facturación", choices: ["Crear una factura por cada reintento", "Cambiar de moneda para continuar", "Establecer un mapeo único y validar unidades e idempotencia"], resolution: "2",
    explanation: "Una integración necesita IDs estables, reglas de unidades y protección frente a duplicados. No adivines la cuenta de destino.", evidence: "Tabla de correspondencias y prueba que impide facturas duplicadas." },
  { id: "api-14", level: 14, title: "Límite de frecuencia", task: "Consulta la cola de sincronización y analiza cómo recuperarla.", method: "GET", path: "/demo/sync/status", token: "demo_reader", payload: {},
    fault: "429 · Retry-After: 30; hay eventos pendientes en una cola durable", choices: ["Reintentar en un bucle sin espera", "Respetar Retry-After, aplicar backoff con jitter y conservar idempotencia", "Eliminar la cola y dar todo por completado"], resolution: "1",
    explanation: "Respeta la espera indicada, limita reintentos y conserva los eventos e IDs. Al agotar intentos, registra y escala el error.", evidence: "Plan de reintentos, alerta y recuperación sin duplicados." },
  { id: "api-15", level: 15, title: "Defensa de una integración", task: 'Revisa {"event_id":"evt_demo_99","deliveries":2,"effects":2}.', method: "POST", path: "/demo/integration/review", token: "demo_reader", payload: { event_id: "evt_demo_99", deliveries: 2, effects: 2 },
    fault: "409 · duplicate_effect: un evento produjo dos efectos", choices: ["Deduplicar de forma atómica por ID y probar redelivery y recuperación", "Aumentar el timeout", "Marcar el segundo efecto como correcto"], resolution: "0",
    explanation: "La redelivery puede ser normal; el efecto duplicado no. Demuestra unicidad atómica, recuperación y un runbook para reparar el caso.", evidence: "Prueba de entrega repetida, registro de efectos y runbook." },
];

/** No fetch, eval, URLs or credentials from users: a deliberately local protocol simulation. */
export function simulateApi(lab: ApiLab, req: LabRequest) {
  if (![req.method, req.path, req.token, req.body, req.resolution].every(value => typeof value === "string") || req.body.length > 4000)
    return { status: 400, output: "Solicitud inválida o demasiado larga", diagnosed: false };
  if (req.path !== lab.path) return { status: 404, output: "Endpoint ficticio no encontrado", diagnosed: false };
  if (req.method !== lab.method) return { status: 405, output: `Método permitido: ${lab.method}`, diagnosed: false };
  if (req.token !== lab.token) return { status: 401, output: "Usa únicamente el token ficticio demo_reader", diagnosed: false };
  let payload: unknown;
  try { payload = JSON.parse(req.body); } catch { return { status: 400, output: "El cuerpo debe ser JSON válido", diagnosed: false }; }
  if (!payload || Array.isArray(payload) || typeof payload !== "object" || Object.keys(payload).length !== Object.keys(lab.payload).length
    || Object.entries(lab.payload).some(([key, value]) => (payload as Record<string, unknown>)[key] !== value))
    return { status: 422, output: "Comprueba el contrato de campos y unidades del caso", diagnosed: false };
  // HTTP 200 is the simulator report; the inner failure is the observed delivery, not a successful repair.
  return { status: 200, output: lab.fault, diagnosed: req.resolution === lab.resolution };
}

export function skillPracticeCoverage(passedIds: readonly string[], roleId: string) {
  const role = TARGET_ROLES.find(item => item.id === roleId);
  if (!role) return [];
  const passed = new Set(passedIds);
  return role.skills.map(skill => {
    const ids = skill === "apis" ? API_LABS.map(lab => lab.id) : PRACTICE_ACTIVITIES.filter(item => item.skill === skill).map(item => item.id);
    return { skill, practiced: ids.filter(id => passed.has(id)).length, total: ids.length };
  });
}

export function weeklyPracticePlan(passedIds: readonly string[], roleId: string, startDay: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDay)) return [];
  const start = new Date(`${startDay}T12:00:00Z`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== startDay) return [];
  return skillPracticeCoverage(passedIds, roleId).filter(item => item.practiced < item.total).slice(0, 3).map((item, index) => {
    const date = new Date(start); date.setUTCDate(date.getUTCDate() + index + 1);
    return { skill: item.skill, day: date.toISOString().slice(0, 10), task: `Practicar ${SKILL_LABELS[item.skill]} y explicar el resultado`, owner: "Yo", evidence: "Resultado, explicación y un caso de fallo" };
  });
}

export const ONBOARDING_TASKS = [
  "Define el puesto que quieres explorar", "Haz una práctica de lógica", "Explica una salida de Python",
  "Detecta y documenta un error", "Escribe una consulta SQL", "Diagnostica una entrega de API", "Revisa tus brechas y fija tu siguiente meta",
] as const;

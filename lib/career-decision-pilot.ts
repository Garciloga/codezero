export type PilotNodeKey = "rule" | "rule_support" | "server" | "server_support" | "tests" | "test_support" | "reflection" | "complete";
export type PilotCheck = "rule" | "server" | "tests";
export type PilotChoice = {
  key: string;
  text: string;
  consequence: string;
  next: PilotNodeKey;
  check?: PilotCheck;
};
export type PilotNode = { title: string; scenario: string; question: string; choices: PilotChoice[] };

// Closed synthetic decisions only. Nothing is submitted, scored for affinity or persisted.
export const DECISION_PILOT: Record<PilotNodeKey, PilotNode> = {
  rule: {
    title: "Definir la regla antes de cambiar el formulario",
    scenario: "En un formulario ficticio, el correo es obligatorio. Hoy permite enviar el campo vacío. Vas a decidir cómo corregirlo; no necesitas escribir código todavía.",
    question: "¿Qué cambio propones primero?",
    choices: [
      { key: "hide", text: "Ocultar el botón cuando el campo está vacío.", consequence: "El botón puede ocultarse, pero eso no define ni verifica la regla para otros envíos. Un usuario también necesita saber qué corregir. Puedes reforzar la diferencia entre interfaz y validación.", next: "rule_support" },
      { key: "define", text: "Definir correo obligatorio, rechazar vacío y explicar el error junto al campo.", consequence: "La regla define qué se acepta. El mensaje ayuda a corregir el dato y la validación verifica la regla. Ahora falta decidir dónde comprobarla.", next: "server", check: "rule" },
      { key: "accept", text: "Aceptar el vacío y pedir el correo más adelante.", consequence: "Eso cambiaría el requisito del caso. Si el correo es obligatorio, aceptar el vacío no corrige el fallo. Antes de programar conviene distinguir una corrección de un cambio de producto.", next: "rule_support" },
    ],
  },
  rule_support: {
    title: "Refuerzo: la interfaz y la regla son distintas",
    scenario: "La interfaz ayuda a introducir datos. La regla dice si esos datos son aceptables. Ocultar un botón puede ayudar visualmente, pero el sistema aún debe comprobar el correo recibido.",
    question: "¿Cómo quieres continuar?",
    choices: [
      { key: "retry", text: "Volver a decidir la regla.", consequence: "Volverás al problema inicial con esta distinción. Puedes cambiar tu respuesta; el intento anterior no te bloquea.", next: "rule" },
      { key: "explore", text: "Explorar primero la validación del servidor.", consequence: "Explorarás otra parte del problema. La comprobación de la regla queda pendiente y podrás retomarla al final.", next: "server" },
    ],
  },
  server: {
    title: "Una petición evita el formulario",
    scenario: "El navegador ya muestra un error si falta el correo. Ahora llega al servidor una petición directa con el campo vacío, sin pasar por ese formulario.",
    question: "¿Qué debe hacer el servidor?",
    choices: [
      { key: "trust", text: "Confiar en que el navegador ya validó el dato.", consequence: "La petición directa no pasó por la validación del navegador. Confiar en ella permitiría aceptar el vacío. Puedes revisar dónde termina la ayuda de la interfaz.", next: "server_support" },
      { key: "validate", text: "Comprobar la regla y rechazar el correo vacío antes de guardar.", consequence: "El servidor verifica el dato que recibe, aunque el navegador haya sido omitido. El rechazo debe explicar el campo que falla sin guardar una entrada inválida.", next: "tests", check: "server" },
      { key: "placeholder", text: "Rellenarlo con un correo inventado y guardarlo.", consequence: "Un valor inventado ocultaría el error y no representaría la entrada solicitada. En este caso debe rechazarse el vacío y pedir una corrección, no fabricar información.", next: "server_support" },
    ],
  },
  server_support: {
    title: "Refuerzo: validar lo que realmente llega",
    scenario: "El navegador puede avisar antes del envío. El servidor necesita comprobar su propia entrada antes de guardarla. En este caso, vacío significa rechazo; los demás datos del formulario pueden conservarse para corregir el correo.",
    question: "¿Qué práctica te interesa ahora?",
    choices: [
      { key: "retry", text: "Reintentar la decisión del servidor.", consequence: "Volverás a la petición directa para aplicar el criterio. No se han guardado datos del caso.", next: "server" },
      { key: "explore", text: "Explorar pruebas que descubran este fallo.", consequence: "Elegirás pruebas para el problema. La comprobación del servidor permanece pendiente si aún no la aplicaste.", next: "tests" },
    ],
  },
  tests: {
    title: "Comprobar la corrección con casos diferentes",
    scenario: "Tienes una propuesta de validación. Debes comprobar qué acepta y rechaza tanto al usar el formulario como al enviar una petición directa. La regla del caso también exige un formato de correo válido.",
    question: "¿Qué conjunto de pruebas aporta más evidencia?",
    choices: [
      { key: "happy", text: "Enviar solo un correo válido desde el formulario.", consequence: "Eso prueba un caso permitido, pero no el fallo original ni una petición directa. Puede funcionar y seguir aceptando entradas vacías por otra vía.", next: "test_support" },
      { key: "matrix", text: "Probar vacío, formato inválido y correo válido; incluir peticiones directas al servidor.", consequence: "Los casos permitidos y rechazados contrastan la regla. La petición directa comprueba que el servidor también la aplica. Además debes verificar el mensaje y que el dato inválido no se guarde.", next: "reflection", check: "tests" },
      { key: "visual", text: "Comprobar solamente que el botón cambia de color.", consequence: "El color es una señal visual y no demuestra validación ni rechazo en el servidor. Una prueba debe observar el comportamiento definido por la regla.", next: "test_support" },
    ],
  },
  test_support: {
    title: "Refuerzo: una prueba necesita una expectativa",
    scenario: "Escribe entrada → resultado esperado: vacío → rechazo; formato inválido → rechazo; correo válido → aceptación. Repite casos directos al servidor para comprobar que no depende del formulario. Son datos inventados y resultados esperados, no peticiones ejecutadas aquí.",
    question: "Elige tu próximo paso.",
    choices: [
      { key: "retry", text: "Reintentar la selección de pruebas.", consequence: "Volverás a elegir los casos con una expectativa explícita para cada entrada.", next: "tests" },
      { key: "server", text: "Repasar primero la decisión del servidor.", consequence: "Revisarás por qué hace falta rechazar una entrada inválida en el servidor antes de volver a las pruebas.", next: "server" },
    ],
  },
  reflection: {
    title: "Reflexión: explica la corrección",
    scenario: "Repasa mentalmente: ¿qué regla definiste, qué ocurre si alguien evita el formulario y qué prueba descubre el fallo? Puedes responder fuera de esta pantalla; aquí no recibimos texto ni entregas.",
    question: "¿Qué quieres hacer ahora?",
    choices: [
      { key: "rule", text: "Reforzar la regla y el mensaje al usuario.", consequence: "Volverás a la primera decisión. Las comprobaciones ya revisadas permanecen durante esta sesión sin duplicarse.", next: "rule" },
      { key: "server", text: "Revisar la validación del servidor.", consequence: "Volverás a la petición directa y podrás explicar el límite entre interfaz y servidor.", next: "server" },
      { key: "finish", text: "Cerrar este recorrido de prueba.", consequence: "El recorrido queda explorado en esta sesión. Revisa qué comprobaciones están pendientes; cerrarlo no certifica dominio ni modifica la afinidad.", next: "complete" },
    ],
  },
  complete: { title: "Recorrido de prueba explorado", scenario: "Puedes volver a las decisiones, elegir otra misión o reiniciar. Este piloto verifica comprensión con opciones cerradas; no ejecuta ni evalúa código.", question: "", choices: [] },
};

export const PILOT_CHECK_LABELS: Record<PilotCheck, string> = {
  rule: "Regla y mensaje al usuario", server: "Validación en el servidor", tests: "Casos de prueba",
};
export type PilotState = {
  node: PilotNodeKey;
  checks: PilotCheck[];
  feedback: PilotChoice | null;
  back: PilotNodeKey[];
  history: { node: PilotNodeKey; choice: string; consequence: string }[];
};
export type PilotAction = { type: "answer"; choice: string } | { type: "continue" } | { type: "back" } | { type: "restart" };
export function startDecisionPilot(): PilotState {
  return { node: "rule", checks: [], feedback: null, back: [], history: [] };
}
export function transitionDecisionPilot(state: PilotState, action: PilotAction): PilotState {
  if (action.type === "restart") return startDecisionPilot();
  if (action.type === "back") {
    const previous = state.back.at(-1);
    return previous ? { ...state, node: previous, feedback: null, back: state.back.slice(0, -1) } : state;
  }
  if (action.type === "continue") {
    if (!state.feedback) return state;
    return { ...state, node: state.feedback.next, feedback: null, back: [...state.back, state.node].slice(-20) };
  }
  if (action.type !== "answer" || state.feedback) return state;
  const choice = DECISION_PILOT[state.node].choices.find(option => option.key === action.choice);
  if (!choice) return state;
  return {
    ...state, feedback: choice,
    checks: choice.check ? [...new Set([...state.checks, choice.check])] : state.checks,
    history: [...state.history, { node: state.node, choice: choice.text, consequence: choice.consequence }].slice(-30),
  };
}

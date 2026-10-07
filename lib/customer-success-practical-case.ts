/** Entirely fictional, local educational case. No scoring, purchases or persistence. */
export const CS_CASE_METRICS = [
  { week: 1, activeUsers: 12, reportsDelivered: 1, preparationDays: 5 },
  { week: 2, activeUsers: 18, reportsDelivered: 1, preparationDays: 5 },
  { week: 3, activeUsers: 21, reportsDelivered: 1, preparationDays: 4.8 },
  { week: 4, activeUsers: 21, reportsDelivered: 1, preparationDays: 3 },
] as const;
export type CsCaseStage = {
  key: string; title: string; goal: string; context: string; task: string;
  template: string; example: string; review: readonly string[];
  choices: readonly { key: string; label: string; feedback: string }[];
};
export const CS_CASE_STAGES = [
  {
    "key": "handoff",
    "title": "1 · Traspaso comercial",
    "goal": "Detectar vacíos antes de comprometer implementación.",
    "context": "La venta prometió un reporte semanal, pero no documentó fuente, responsable ni criterio de exactitud. La cuenta renueva en 40 días.",
    "task": "Completa el handoff, identifica tres preguntas pendientes y decide quién valida cada compromiso.",
    "template": "Objetivo del cliente:\nAlcance confirmado:\nPromesa pendiente de validar:\nFuente de datos y responsable:\nRiesgos:\nPreguntas / responsable / siguiente revisión:",
    "example": "Resultado buscado: reducir preparación del reporte de 5 a 2 días. Confirmado: existe exportación CSV. Pendiente: no consta integración automática. AE valida alcance; responsable de datos del cliente valida fuente; CS registra riesgo y coordina kickoff.",
    "review": [
      "Distingue vendido, confirmado y pendiente.",
      "No convierte una promesa verbal en capacidad disponible.",
      "Define responsable y siguiente paso para cada vacío."
    ],
    "choices": [
      {
        "key": "promise",
        "label": "Confirmar la integración automática para no retrasar el kickoff.",
        "feedback": "Mantienes el calendario, pero introduces un compromiso sin respaldo. Verifica alcance y capacidad antes de confirmarlo; puede cambiar el plan de primer valor."
      },
      {
        "key": "clarify",
        "label": "Hacer el kickoff con vacíos explícitos y responsables para validarlos.",
        "feedback": "Puedes avanzar en objetivos y roles sin ocultar dependencias. El inicio no implica aceptación de la integración; acuerda qué información desbloquea el siguiente paso."
      }
    ]
  },
  {
    "key": "success_plan",
    "title": "2 · Plan de éxito",
    "goal": "Conectar un objetivo de negocio con una evidencia observable.",
    "context": "El cliente quiere preparar su reporte en dos días. El sponsor nuevo aún no confirmó si mantiene ese objetivo.",
    "task": "Define resultado, adopción y primer valor como métricas distintas; prepara una pregunta para el sponsor.",
    "template": "Objetivo y quién lo confirma:\nResultado / fórmula / baseline / meta:\nAdopción del flujo clave:\nPrimer valor verificable:\nResponsable / fecha / evidencia:\nSupuestos pendientes:",
    "example": "Resultado: días laborables desde cierre de datos hasta reporte aprobado; baseline 5, meta 2, pendiente validación del sponsor. Adopción: analistas que completan el flujo, no solo acceden. Primer valor: un reporte reconciliado y aprobado con datos ficticios.",
    "review": [
      "Incluye baseline, ventana y quién valida.",
      "No usa logins como sustituto de resultado.",
      "Marca la meta como pendiente si falta acuerdo."
    ],
    "choices": [
      {
        "key": "logins",
        "label": "Usar más accesos semanales como objetivo principal.",
        "feedback": "Los accesos muestran actividad, pero no prueban rapidez ni exactitud del reporte. Úsalos como señal complementaria y valida la tarea que genera valor."
      },
      {
        "key": "result",
        "label": "Acordar tiempo y exactitud del reporte con el sponsor.",
        "feedback": "La medición representa el problema del cliente. Define cuándo empieza y termina el tiempo, qué datos se comparan y quién acepta el resultado."
      }
    ]
  },
  {
    "key": "onboarding",
    "title": "3 · Onboarding y primer valor",
    "goal": "Ordenar dependencias y comprobar una tarea útil.",
    "context": "Capacitación terminada; importación automática pendiente. CSV es una alternativa permitida, pero requiere conciliación.",
    "task": "Diseña un recorrido de primer valor con entrada, responsable, control de exactitud y aceptación.",
    "template": "Flujo de primer valor:\nDatos de prueba:\nDependencias / responsable:\nAlternativa temporal / límites:\nValidación:\nAceptación del cliente:\nPendientes para CS:",
    "example": "Importar un CSV ficticio de una semana, revisar duplicados y conciliar totales con la fuente. Un analista prepara y el responsable de datos acepta. El flujo manual no reemplaza la integración prometida; registrar dependencia y seguimiento.",
    "review": [
      "La capacitación no se presenta como aceptación automática.",
      "La alternativa es permitida y sus límites visibles.",
      "Hay evidencia del flujo y responsable de aceptación."
    ],
    "choices": [
      {
        "key": "finish",
        "label": "Cerrar onboarding porque todos asistieron a la capacitación.",
        "feedback": "Asistencia no prueba que puedan completar el flujo. Puedes reconocer capacitación terminada y mantener primer valor o integración como hitos pendientes."
      },
      {
        "key": "temporary",
        "label": "Probar un reporte conciliado con CSV y mantener pendiente la integración.",
        "feedback": "Puede entregar valor antes, si el cliente acepta el flujo temporal. Documenta esfuerzo manual, controles y criterio para migrar a la integración."
      }
    ]
  },
  {
    "key": "adoption",
    "title": "4 · Adopción y resultados",
    "goal": "Investigar señales contradictorias sin inventar causalidad.",
    "context": "Los usuarios activos crecen de 12 a 21; el reporte sigue tardando cerca de cinco días y hay registros duplicados.",
    "task": "Formula dos hipótesis, una prueba por hipótesis y una intervención mínima.",
    "template": "Observación:\nHipótesis 1 / evidencia que la confirmaría o descartaría:\nHipótesis 2 / prueba:\nAcción mínima:\nResponsable:\nResultado a revisar:",
    "example": "Observado: más usuarios activos y tiempo estable. Hipótesis: duplicados obligan a conciliar manualmente. Prueba: revisar muestra ficticia y registrar tiempo por etapa. Otra hipótesis: la aprobación tarda; preguntar por cola de revisión. No concluir falta de formación sin evidencia.",
    "review": [
      "Separa datos e hipótesis.",
      "Investiga proceso y calidad, no solo uso.",
      "Define cómo sabrá si la acción funcionó."
    ],
    "choices": [
      {
        "key": "training",
        "label": "Programar capacitación adicional inmediatamente.",
        "feedback": "Puede ayudar si el bloqueo es conocimiento, pero hoy no está demostrado. Identifica la etapa lenta antes de añadir sesiones que podrían no resolver duplicados o aprobaciones."
      },
      {
        "key": "inspect",
        "label": "Revisar calidad de datos y tiempos de cada etapa.",
        "feedback": "Comparar etapas permite encontrar un cuello de botella. Una muestra pequeña orienta; documenta límites y confirma que representa el flujo antes de generalizar."
      }
    ]
  },
  {
    "key": "risk",
    "title": "5 · Riesgo y escalación",
    "goal": "Separar incidente técnico de riesgo de cuenta.",
    "context": "Cambió el sponsor; dos usuarios ven 401 en la exportación. Soporte investiga y la renovación se acerca.",
    "task": "Prepara un ticket técnico y un plan de riesgo de cuenta con responsables distintos.",
    "template": "Riesgo de cuenta / evidencia:\nIncidente técnico / alcance:\nDatos redactados para soporte:\nAlternativa permitida:\nSponsor / responsable comercial / CS:\nPróxima actualización:\nCriterio de recuperación:",
    "example": "Ticket: dos usuarios, operación exportar, error 401, hora y pasos; sin tokens. CS valida prioridades con nuevo sponsor y responsable comercial revisa renovación. Actualizar al cliente en fecha acordada, sin prometer resolución técnica. Recuperación: flujo verificado y plan de valor confirmado.",
    "review": [
      "No incluye credenciales ni datos reales.",
      "Distingue responsable técnico y coordinación de cuenta.",
      "No etiqueta churn seguro por una sola señal."
    ],
    "choices": [
      {
        "key": "ticket_only",
        "label": "Esperar a que soporte cierre el ticket antes de hablar con el sponsor.",
        "feedback": "El incidente necesita soporte, pero el cambio de sponsor y el objetivo siguen sin atenderse. Puedes coordinar ambos frentes en paralelo sin duplicar el diagnóstico técnico."
      },
      {
        "key": "parallel",
        "label": "Coordinar soporte y validar prioridades con el sponsor en paralelo.",
        "feedback": "Mantienes roles claros y atiendes dos riesgos diferentes. Compartir solo evidencia necesaria evita exponer datos o pedir al cliente la misma información varias veces."
      }
    ]
  },
  {
    "key": "business_review",
    "title": "6 · Revisión de resultados",
    "goal": "Convertir evidencia en decisiones y compromisos.",
    "context": "Tras depurar la muestra, el último reporte tardó tres días. Solo hay una medición y faltan datos de las semanas anteriores.",
    "task": "Prepara una revisión ejecutiva de una página: resultado, límites de evidencia, decisiones y próximos pasos.",
    "template": "Objetivo acordado:\nResultado observado / periodo:\nLimitación de evidencia:\nLogros:\nBloqueos:\nDecisión solicitada:\nCompromisos / responsable / revisión:",
    "example": "Un reporte pasó de baseline declarado 5 a 3 días en la muestra; aún no demuestra mejora sostenida ni meta 2 cumplida. Solicitar dos ciclos comparables y confirmar sponsor. Acordar responsable de datos y seguimiento de integración.",
    "review": [
      "No exagera una muestra ni atribuye todo al producto.",
      "Conecta resultados con objetivo.",
      "Incluye decisión y seguimiento, no solo diapositivas."
    ],
    "choices": [
      {
        "key": "declare",
        "label": "Presentar que el cliente ya logró el resultado esperado.",
        "feedback": "Tres días no cumple la meta de dos y una sola observación no demuestra estabilidad. Puedes presentar avance y especificar qué falta para validar el resultado."
      },
      {
        "key": "evidence",
        "label": "Presentar avance parcial y acordar nuevos ciclos comparables.",
        "feedback": "La revisión muestra progreso con sus límites. Define fecha, fuente y quién comprueba los próximos ciclos para que el seguimiento no quede abierto."
      }
    ]
  },
  {
    "key": "renewal",
    "title": "7 · Renovación y expansión",
    "goal": "Preparar la conversación comercial sin sustituir valor por descuento.",
    "context": "El sponsor pide justificar renovación; pregunta por descuento y una ampliación que aún no tiene caso de uso confirmado.",
    "task": "Elabora briefing de renovación y dos alternativas sujetas a autorización comercial.",
    "template": "Valor observado / evidencia:\nPendientes:\nObjeción y causa por validar:\nAlternativa A / límites:\nAlternativa B / límites:\nAprobación requerida:\nSiguiente paso confirmado:",
    "example": "Opción A: mantener alcance y revisar resultado tras dos ciclos. Opción B: ajustar alcance si el proceso cambió, sujeto a revisión comercial. Expansión solo después de validar necesidad y viabilidad. CS aporta contexto; no aprueba descuentos fuera de su autoridad.",
    "review": [
      "Distingue aportar evidencia y aprobar condiciones.",
      "No vende una capacidad inexistente.",
      "Las alternativas responden al problema, no solo a presión por renovar."
    ],
    "choices": [
      {
        "key": "discount",
        "label": "Ofrecer descuento y expansión para conseguir un sí.",
        "feedback": "Puede ocultar el problema de valor y comprometer condiciones sin autorización. Investiga objeción y encaje; negocia solo dentro de las facultades acordadas."
      },
      {
        "key": "align",
        "label": "Validar causa y preparar alternativas con el responsable comercial.",
        "feedback": "Puedes separar precio, alcance y resultado esperado. La decisión comercial y sus condiciones deben quedar confirmadas; no registrar una renovación ganada por interés verbal."
      }
    ]
  },
  {
    "key": "voice_customer",
    "title": "8 · Voz del cliente y cierre del ciclo",
    "goal": "Entregar contexto útil y dar seguimiento sin prometer roadmap.",
    "context": "Tres cuentas ficticias piden exportación automática; una perdió el sponsor, otra ya usa CSV y otra espera más volumen.",
    "task": "Agrupa necesidades por problema y prepara un traspaso a producto con evidencia y seguimiento.",
    "template": "Problema común:\nCasos / contexto / diferencia:\nImpacto y frecuencia:\nAlternativas actuales:\nSolicitud o hipótesis:\nResponsable receptor:\nRespuesta/seguimiento al cliente:",
    "example": "Problema: tiempo de conciliación del reporte, no simplemente 'botón nuevo'. Separar volumen y proceso de cada cuenta. Compartir alternativas CSV y riesgos con producto; pedir evaluación, no prometer fecha. CS comunica respuesta y mantiene plan vigente.",
    "review": [
      "Agrupa problemas sin borrar diferencias de contexto.",
      "No convierte tres solicitudes en demanda universal.",
      "Define receptor y cierre del feedback."
    ],
    "choices": [
      {
        "key": "roadmap",
        "label": "Confirmar que la función llegará el próximo mes.",
        "feedback": "No hay decisión ni fecha aprobada. Una expectativa falsa puede afectar renovación e implementación. Explica el estado de evaluación y la alternativa disponible."
      },
      {
        "key": "synthesize",
        "label": "Enviar problema, evidencia y alternativas, y acordar seguimiento.",
        "feedback": "Producto recibe contexto para priorizar y el cliente sabe qué esperar. El seguimiento debe cerrar el ciclo incluso si la respuesta es no construir ahora."
      }
    ]
  }
] satisfies readonly CsCaseStage[];

export function getCsDecisionFeedback(stageKey: string, choiceKey: string): string | null {
  const stage = CS_CASE_STAGES.find(item => item.key === stageKey);
  return stage?.choices.find(choice => choice.key === choiceKey)?.feedback ?? null;
}

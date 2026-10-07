import type { CareerPositionKey } from "./career-guidance.ts";

/** Editorial synthesis from primary references. Introductory practice, not certification. */
export type RoleWorkflow = {
  title: string; process: string; activities: readonly string[];
  deliverable: string; decision: string; quality: string; source: string;
};
export const ROLE_WORKFLOWS = {
  "developer": {
    "title": "Desarrollador",
    "process": "Requisitos → diseño → implementación → pruebas/revisión → entrega y seguimiento",
    "activities": [
      "Definir criterios de aceptación para un formulario y tres casos límite.",
      "Corregir un fallo reproducible en una rama y justificar el cambio mínimo.",
      "Preparar un PR con pruebas, instrucciones y una opción de reversión."
    ],
    "deliverable": "PR y matriz de pruebas",
    "decision": "¿Entregar rápido o corregir primero un fallo que pierde datos?",
    "quality": "Reproducible, entradas inválidas cubiertas y revisión explícita.",
    "source": "https://docs.github.com/en/pull-requests/get-started/about-pull-requests"
  },
  "tech_support_l1": {
    "title": "Soporte técnico L1",
    "process": "Recepción → clasificación → comprobación inicial → resolución o escalación → cierre",
    "activities": [
      "Clasificar cinco tickets por impacto y urgencia.",
      "Preparar preguntas de diagnóstico sin pedir contraseñas.",
      "Escalar un caso con reproducción y verificar el cierre con el usuario."
    ],
    "deliverable": "Ticket completo y paquete de escalación",
    "decision": "¿Reclasificar urgencia si hay alternativa temporal?",
    "quality": "Prioridad justificada, evidencia mínima y confirmación de recuperación.",
    "source": "https://handbook.gitlab.com/handbook/support/workflows/ticket_lifecycle/"
  },
  "tech_support_l2": {
    "title": "Soporte técnico L2",
    "process": "Reproducción → hipótesis → pruebas controladas → solución temporal → verificación",
    "activities": [
      "Comparar un caso exitoso con uno fallido usando registros redactados.",
      "Construir tres hipótesis y una prueba que pueda descartar cada una.",
      "Documentar una solución temporal y condiciones de escalación a ingeniería."
    ],
    "deliverable": "Árbol de diagnóstico y registro de pruebas",
    "decision": "¿Seguir una hipótesis popular o la evidencia que la contradice?",
    "quality": "Separar observación e inferencia; no repetir pruebas ya descartadas.",
    "source": "https://handbook.gitlab.com/handbook/support/workflows/working-on-tickets/"
  },
  "tech_support_l3": {
    "title": "Soporte técnico L3",
    "process": "Investigación profunda → mitigación → coordinación con ingeniería → causa → prevención",
    "activities": [
      "Reconstruir una cronología con cambios y síntomas.",
      "Contrastar causas y comparar rollback frente a una mitigación acotada.",
      "Preparar postmortem con acciones, responsables y señales preventivas."
    ],
    "deliverable": "Postmortem técnico",
    "decision": "¿Cerrar porque bajaron errores aunque la causa siga incierta?",
    "quality": "Causa respaldada o incertidumbre declarada; mitigación verificable.",
    "source": "https://handbook.gitlab.com/handbook/support/support-incident-response/"
  },
  "customer_support": {
    "title": "Atención al cliente",
    "process": "Entender solicitud → acordar seguimiento → resolver o derivar → confirmar → documentar",
    "activities": [
      "Redactar respuesta con impacto, dos preguntas y siguiente contacto.",
      "Preparar una alternativa ante una exportación urgente fallida.",
      "Convertir la solución confirmada en un artículo breve y claro."
    ],
    "deliverable": "Conversación y artículo de ayuda",
    "decision": "¿Prometer plazo sin evidencia o comprometer la próxima actualización?",
    "quality": "Comunicación comprensible, promesas sostenibles y cierre confirmado.",
    "source": "https://handbook.gitlab.com/handbook/support/workflows/ticket_lifecycle/"
  },
  "onboarding": {
    "title": "Onboarding / Implementación",
    "process": "Traspaso → kickoff → configuración/datos → capacitación → primer valor → transición",
    "activities": [
      "Detectar información faltante en un traspaso comercial.",
      "Diseñar un plan con responsables, dependencias y criterio de aceptación.",
      "Comprobar primer valor y entregar pendientes a Customer Success."
    ],
    "deliverable": "Plan de implementación y acta de aceptación",
    "decision": "¿Lanzar con integración incompleta o acordar un alcance temporal?",
    "quality": "Cliente puede realizar el flujo acordado; asistencia no sustituye resultado.",
    "source": "https://handbook.gitlab.com/handbook/solutions-architects/processes/customer-success-plan/"
  },
  "customer_success": {
    "title": "Customer Success",
    "process": "Objetivos → plan de éxito → adopción → riesgos → revisión de resultados → renovación",
    "activities": [
      "Crear un plan de éxito con resultado, adopción y responsables.",
      "Interpretar señales contradictorias de una cuenta y preparar un plan de recuperación.",
      "Realizar un EBR con evidencia, decisiones y próximos compromisos."
    ],
    "deliverable": "Plan de éxito, evaluación de riesgo y EBR",
    "decision": "¿Uso alto significa valor si el resultado del cliente no mejora?",
    "quality": "Métricas con contexto; riesgos verificados y acciones acordadas.",
    "source": "https://handbook.gitlab.com/handbook/customer-experience/csm/"
  },
  "account_manager": {
    "title": "Account Manager",
    "process": "Revisión de valor → renovación → negociación → acuerdo → expansión pertinente",
    "activities": [
      "Preparar una renovación con historial, objeción y restricciones.",
      "Comparar dos ofertas con límites y contrapartidas sin regalar descuento.",
      "Documentar acuerdos y traspaso de una expansión viable."
    ],
    "deliverable": "Plan de renovación y opciones de negociación",
    "decision": "¿Descuento, menor alcance o plazo distinto según la necesidad?",
    "quality": "Propuesta coherente con valor y aprobación; no inventar compromiso.",
    "source": "https://handbook.gitlab.com/handbook/sales/sales-operating-procedures/retain-and-expand/"
  },
  "key_account_manager": {
    "title": "Key Account Manager",
    "process": "Mapa de actores → plan de cuenta → gobierno → alineación ejecutiva → seguimiento",
    "activities": [
      "Construir mapa de patrocinadores, usuarios, decisores y bloqueadores.",
      "Diseñar un plan de cuenta con objetivos compartidos y riesgos.",
      "Preparar opciones ante prioridades incompatibles de dos áreas."
    ],
    "deliverable": "Plan de cuenta y agenda de gobierno",
    "decision": "¿Escalar al sponsor o resolver primero el desacuerdo entre áreas?",
    "quality": "Relaciones y responsabilidades explícitas; decisiones y seguimiento trazables.",
    "source": "https://handbook.gitlab.com/handbook/customer-experience/account-team/"
  },
  "sdr_bdr": {
    "title": "SDR / BDR",
    "process": "Selección de cuentas → contacto relevante → calificación → reunión → traspaso",
    "activities": [
      "Formular hipótesis de necesidad para tres cuentas ficticias.",
      "Redactar contacto y seguimiento respetando rechazo y preferencias.",
      "Calificar una conversación y producir un traspaso al AE."
    ],
    "deliverable": "Ficha de calificación y traspaso comercial",
    "decision": "¿Interés del contacto demuestra oportunidad o falta validar encaje?",
    "quality": "Sin spam ni oportunidades inventadas; siguiente paso confirmado.",
    "source": "https://handbook.gitlab.com/job-description-library/marketing/sales-development-representative/"
  },
  "account_executive": {
    "title": "Account Executive",
    "process": "Discovery → calificación → solución/propuesta → negociación → decisión → traspaso",
    "activities": [
      "Preparar discovery que distingue problema, comprador y proceso de decisión.",
      "Crear un plan de cierre conjunto con dependencias y riesgos.",
      "Revisar previsión cuando compras o revisión contractual cambian el calendario."
    ],
    "deliverable": "Plan de cierre y resumen de traspaso",
    "decision": "¿Mover fecha en CRM por entusiasmo o por un paso verificable?",
    "quality": "Etapa y fecha sustentadas; alcance y limitaciones comunicados.",
    "source": "https://handbook.gitlab.com/job-description-library/sales/account-executive/"
  },
  "pre_sales": {
    "title": "Preventa",
    "process": "Discovery técnica → diseño de demo → prueba de viabilidad → límites → traspaso",
    "activities": [
      "Mapear una necesidad a capacidades y requisitos reales.",
      "Preparar demo y POC con criterios de éxito y datos ficticios.",
      "Registrar limitaciones, resultados y condiciones para implementación."
    ],
    "deliverable": "Guion de demo y reporte POC",
    "decision": "¿Prometer escala por una demo pequeña o medir antes?",
    "quality": "Capacidades demostradas; supuestos y exclusiones explícitos.",
    "source": "https://handbook.gitlab.com/job-description-library/sales/solutions-architect/"
  },
  "project_manager": {
    "title": "Project Manager",
    "process": "Alcance → planificación → dependencias/riesgos → ejecución/cambios → aceptación/cierre",
    "activities": [
      "Desglosar entregables con responsables y dependencias.",
      "Comparar alternativas ante retraso sin recursos adicionales.",
      "Producir informe de estado, registro de cambios y cierre."
    ],
    "deliverable": "Plan, registro de riesgos y acta de cierre",
    "decision": "¿Reducir alcance, cambiar fecha o aceptar riesgo?",
    "quality": "Cambio aprobado y efecto visible; aceptación verificable.",
    "source": "https://www.onetonline.org/link/details/13-1082.00"
  },
  "administrative_assistant": {
    "title": "Asistente administrativo",
    "process": "Recepción → verificación → registro → coordinación → control y archivo",
    "activities": [
      "Revisar registros ficticios y marcar anomalías antes de fusionar.",
      "Preparar procedimiento con responsables y validación de datos.",
      "Conciliar dos fuentes y registrar qué corrección requiere autorización."
    ],
    "deliverable": "Registro depurado y procedimiento operativo",
    "decision": "¿Corregir un dato discrepante o preservar evidencia hasta validarlo?",
    "quality": "Exactitud, historial y acceso mínimo; no borrar por coincidencia de nombre.",
    "source": "https://www.onetonline.org/link/details/43-6014.00"
  },
  "executive_assistant": {
    "title": "Asistente ejecutivo",
    "process": "Prioridades → agenda/logística → preparación → comunicación → contingencia/seguimiento",
    "activities": [
      "Resolver conflicto de agenda con dependencias y prioridades.",
      "Preparar un briefing con información necesaria y acceso restringido.",
      "Replanificar una reunión y viaje ficticios dejando margen y alternativa."
    ],
    "deliverable": "Agenda, briefing y plan de contingencia",
    "decision": "¿Compartir documentos completos o solo disponibilidad para coordinar?",
    "quality": "Confidencialidad, tiempos realistas y acuerdos confirmados.",
    "source": "https://www.onetonline.org/link/details/43-6011.00"
  },
  "manager_team_lead": {
    "title": "Manager / Team Lead",
    "process": "Objetivos → capacidad → delegación → acompañamiento → revisión/mejora",
    "activities": [
      "Distribuir trabajo según capacidad, urgencia y aprendizaje.",
      "Preparar una conversación de feedback con hechos y apoyo.",
      "Revisar resultados sin premiar sobrecarga ni métricas manipulables."
    ],
    "deliverable": "Plan de equipo y guion de seguimiento",
    "decision": "¿Asignar al más rápido o desarrollar capacidad sostenible?",
    "quality": "Expectativas claras, autonomía proporcional y seguimiento concreto.",
    "source": "https://www.onetonline.org/link/details/11-1021.00"
  }
} satisfies Record<CareerPositionKey, RoleWorkflow>;

/** Templates are editable offline; no professional assessment or submitted data. */
export const ROLE_DELIVERY_TEMPLATES = {
  "developer": [
    "Problema y reproducción",
    "Criterios de aceptación",
    "Cambio mínimo y límites",
    "Pruebas y resultados",
    "Revisión pendiente",
    "Reversión y seguimiento"
  ],
  "tech_support_l1": [
    "Síntoma y alcance",
    "Impacto/urgencia y motivo",
    "Preguntas y evidencia redactada",
    "Comprobación inicial",
    "Responsable de escalación",
    "Confirmación y siguiente actualización"
  ],
  "tech_support_l2": [
    "Observaciones confirmadas",
    "Hipótesis ordenadas",
    "Prueba reversible y resultado esperado",
    "Resultados y descartes",
    "Solución temporal y límites",
    "Escalación/verificación"
  ],
  "tech_support_l3": [
    "Cronología",
    "Síntoma, desencadenante y causa confirmada o pendiente",
    "Evidencia y comparación",
    "Mitigación/reversión",
    "Corrección propuesta",
    "Prevención y responsables"
  ],
  "customer_support": [
    "Impacto reconocido",
    "Datos necesarios",
    "Confirmado y pendiente",
    "Respuesta o alternativa",
    "Próxima actualización",
    "Confirmación y artículo reutilizable"
  ],
  "onboarding": [
    "Objetivo/primer valor",
    "Alcance confirmado",
    "Dependencias y responsables",
    "Datos/configuración y validación",
    "Capacitación con práctica",
    "Aceptación y pendientes de traspaso"
  ],
  "customer_success": [
    "Objetivo acordado",
    "Resultado/baseline/ventana",
    "Adopción del flujo clave",
    "Riesgos y evidencia",
    "Acciones/responsables",
    "Revisión de valor y siguiente decisión"
  ],
  "account_manager": [
    "Resultado y valor observado",
    "Renovación y proceso de decisión",
    "Objeción por validar",
    "Opciones de alcance/precio/plazo",
    "Límites y autorización",
    "Acuerdo y siguiente paso"
  ],
  "key_account_manager": [
    "Mapa de actores",
    "Objetivos conjuntos",
    "Plan de cuenta",
    "Riesgos y dependencias",
    "Gobierno/decisiones",
    "Responsables y seguimiento"
  ],
  "sdr_bdr": [
    "Cuenta ficticia y encaje",
    "Hipótesis de necesidad",
    "Mensaje relevante y preferencias de contacto",
    "Calificación confirmada/pendiente",
    "Siguiente paso acordado",
    "Contexto para AE"
  ],
  "account_executive": [
    "Problema y valor",
    "Comprador y criterios",
    "Proceso de decisión",
    "Propuesta y límites",
    "Riesgos/plan de cierre",
    "Previsión sustentada y handoff"
  ],
  "pre_sales": [
    "Necesidad y requisitos",
    "Capacidad disponible/limitación",
    "Caso de demo",
    "Criterios POC y datos ficticios",
    "Resultados y evidencia",
    "Condiciones para implementación"
  ],
  "project_manager": [
    "Alcance y aceptación",
    "Entregables/dependencias",
    "Responsables y capacidad",
    "Riesgos y alternativas",
    "Cambio propuesto/aprobación",
    "Estado y cierre"
  ],
  "administrative_assistant": [
    "Registro y fuente ficticia",
    "Regla de validación",
    "Anomalía e identificador",
    "Contraste y autorización",
    "Cambio e historial",
    "Control y archivo"
  ],
  "executive_assistant": [
    "Prioridad y dependencias",
    "Disponibilidad/márgenes",
    "Información mínima y acceso",
    "Opciones de coordinación",
    "Contingencia",
    "Confirmaciones y seguimiento"
  ],
  "manager_team_lead": [
    "Objetivo y resultado esperado",
    "Capacidad y restricciones",
    "Delegación/autonomía/apoyo",
    "Feedback con hechos",
    "Riesgos de carga",
    "Seguimiento y ajuste"
  ]
} satisfies Record<CareerPositionKey, readonly string[]>;

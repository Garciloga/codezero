import type {TrainingActivity} from './role-training-content.ts';
export const PRACTICE_EXTENSIONS = [
  {
    "key": "common-priority",
    "title": "Atención y recuperación tras interrupciones",
    "task": "Faro necesita un reporte a las 16:00 UTC. Tienes 90 minutos y recibes tres mensajes: exportación bloqueada para dos usuarios, revisión de formato sin fecha y llamada de seguimiento a las 17:00 UTC. Ordena las tareas por impacto y dependencia, reserva un bloque de concentración de 25 minutos y documenta qué entrega se desplaza. A mitad del bloque llega un error 401: registra dónde te detuviste, la siguiente comprobación y cómo retomas sin perder contexto.",
    "acceptance": "Comprueba: orden justificado, capacidad explícita, punto de reanudación y siguiente actualización. La rapidez y el tiempo frente a pantalla no demuestran atención ni competencia."
  },
  {
    "key": "common-communication",
    "title": "Comunicación asíncrona entre zonas horarias",
    "task": "Faro espera respuesta sobre el reporte. Una persona termina a las 16:00 UTC y otra comienza a las 18:00 UTC. Redacta una actualización que se pueda leer sin reunión: contexto, impacto, hecho confirmado, incertidumbre, enlace al registro y pregunta concreta. Usa fechas y horas UTC, un responsable y un plazo de respuesta. Define cuándo la urgencia exige una llamada y cómo documentar después el acuerdo.",
    "acceptance": "Comprueba: el receptor puede actuar sin pedir contexto; seguimiento y solución tienen fechas distintas cuando corresponde. No interpretes ausencia de respuesta como aprobación."
  },
  {
    "key": "common-documentation",
    "title": "Traspaso remoto y documentación compartida",
    "task": "Prepara el traspaso del reporte de Faro para una ausencia de dos días. Crea un registro canónico con objetivo, versión, estado, pasos comprobados, permisos mínimos, bloqueo, responsable suplente y criterio de cierre. Añade una lista de comprobación para hoja de cálculo, documento compartido y reunión remota. Simula una lectura por alguien que no estuvo presente e identifica tres preguntas que el registro debe resolver. Comparte solo datos ficticios; elimina tokens y enlaces privados.",
    "acceptance": "Comprueba: una fuente canónica, enlaces sin secretos, suplencia y aceptación verificables. No dupliques el archivo para cada persona ni uses presencia en línea como medida de desempeño."
  },
  {
    "key": "common-planning",
    "title": "Acuerdos de trabajo remoto y seguimiento",
    "task": "Diseña una semana remota para Faro: dos entregas, una dependencia de soporte y una revisión de calidad. Declara disponibilidad y límites, bloques de concentración, ventanas de colaboración, pausas y protocolo ante desconexión. Registra en una hoja de cálculo tarea, responsable, fecha UTC, estado, bloqueo y evidencia de aceptación. Si se pierde conectividad antes de la revisión, acuerda un canal alternativo y actualiza el compromiso sin inventar una entrega completada.",
    "acceptance": "Comprueba: plan dentro de capacidad, dependencias visibles y recuperación acordada. Evalúa resultados documentados; no instales vigilancia ni recopiles datos personales del hogar."
  },
  {
    "key": "solutions-project-1",
    "title": "Proyecto de integración: contrato y conciliación",
    "task": "Faro necesita conciliar una exportación de CRM con un registro ficticio de facturación. Usa el fixture de contrato: define columnas, tipos, moneda, clave única, versión y permisos mínimos. Mapea account_id a customer_id, separa faltantes y duplicados y conserva filas rechazadas con motivo. Entrega contrato, tabla de conciliación y pruebas de coincidencia, duplicado, dato faltante y recurso no autorizado. Las respuestas API son archivos locales: no conectes productos ni envíes solicitudes reales.",
    "acceptance": "Aceptación: F-01 coincide por 1200 MXN; F-02 se rechaza por moneda ausente; F-03 queda sin factura; la segunda fila F-01 se registra como duplicado. No conviertas ausencia en cero ni mezcles monedas."
  },
  {
    "key": "solutions-project-2",
    "title": "Proyecto de integración: webhook e idempotencia",
    "task": "Faro recibe un webhook que deja de sincronizar. Reproduce el fixture de eventos y logs sin red. Define identidad del evento, validación del JSON y de la firma simulada, deduplicación, reintentos limitados y conciliación tras un timeout. Entrega pseudocódigo o código, tabla de eventos aceptados y rechazados, pruebas y escalación redactada. Una firma indicada como válida en el fixture es un supuesto de prueba; no implementa ni verifica criptografía real.",
    "acceptance": "Aceptación: evt-01 produce un solo efecto aunque llegue dos veces; evt-02 se rechaza por firma simulada inválida; evt-03 se rechaza por JSON incompleto. Un timeout no autoriza duplicar el efecto; consulta el registro local antes de reintentar."
  },
  {
    "key": "solutions-project-3",
    "title": "Proyecto de integración: recuperación y traspaso",
    "task": "Faro necesita recuperar un lote parcialmente importado. Usa el fixture de recuperación: conserva el último punto confirmado, concilia origen y destino, aplica solo pendientes y documenta un rollback reversible en la simulación. Entrega runbook, tabla antes/después, criterio de reapertura, mensaje al cliente y handoff remoto con responsable y hora UTC. Incluye prueba de fallo a mitad de lote y segundo intento sin duplicados; no modifiques sistemas reales.",
    "acceptance": "Aceptación: la fila 1 ya existe y no se repite; la fila 2 se recupera; la fila 3 permanece rechazada por moneda ausente. El cierre exige conciliación y aceptación del responsable, no solo ausencia de errores."
  }
] as const;
export const INTEGRATION_FIXTURES = {
  "contract": {
    "company": "Faro",
    "simulation": true,
    "crm": [
      {
        "account_id": "F-01",
        "amount": 1200,
        "currency": "MXN"
      },
      {
        "account_id": "F-01",
        "amount": 1200,
        "currency": "MXN"
      },
      {
        "account_id": "F-02",
        "amount": 500,
        "currency": null
      },
      {
        "account_id": "F-03",
        "amount": 700,
        "currency": "MXN"
      }
    ],
    "billing": [
      {
        "customer_id": "F-01",
        "amount": 1200,
        "currency": "MXN"
      }
    ],
    "responses": [
      {
        "resource": "allowed-report",
        "status": 200
      },
      {
        "resource": "outside-scope",
        "status": 403
      }
    ]
  },
  "webhook": {
    "company": "Faro",
    "simulation": true,
    "events": [
      {
        "event_id": "evt-01",
        "signature_valid": true,
        "body": {
          "account_id": "F-01",
          "amount": 1200,
          "currency": "MXN"
        }
      },
      {
        "event_id": "evt-01",
        "signature_valid": true,
        "body": {
          "account_id": "F-01",
          "amount": 1200,
          "currency": "MXN"
        }
      },
      {
        "event_id": "evt-02",
        "signature_valid": false,
        "body": {
          "account_id": "F-02"
        }
      },
      {
        "event_id": "evt-03",
        "signature_valid": true,
        "body": {
          "amount": 500
        }
      }
    ],
    "logs": [
      {
        "event_id": "evt-01",
        "status": "timeout_after_commit"
      }
    ],
    "ledger": [
      {
        "event_id": "evt-01",
        "effect_id": "effect-01"
      }
    ]
  },
  "recovery": {
    "company": "Faro",
    "simulation": true,
    "source": [
      {
        "row": 1,
        "amount": 1200,
        "currency": "MXN"
      },
      {
        "row": 2,
        "amount": 700,
        "currency": "MXN"
      },
      {
        "row": 3,
        "amount": 500,
        "currency": null
      }
    ],
    "destination": [
      {
        "row": 1,
        "amount": 1200,
        "currency": "MXN"
      }
    ],
    "checkpoint": 1,
    "failure": "connection_lost_after_row_1"
  }
} as const;
export function enrichTrainingActivity(activity:TrainingActivity):TrainingActivity {
 const extension=PRACTICE_EXTENSIONS.find(item=>item.key===activity.key);
 if(!extension)return activity;
 return {...activity,task:extension.task,optionalPractice:[activity.task,...activity.optionalPractice,extension.acceptance],sourceUrls:[...new Set([...activity.sourceUrls,'https://handbook.gitlab.com/handbook/communication/'])]};
}

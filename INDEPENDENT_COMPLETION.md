# CodeZero · trabajo independiente y preparación de lanzamiento

Registro histórico de preparación local. El estado vigente se documenta en LOCALIZATION_RELEASE_20261007.md; las notas de publicación pendiente de este registro no describen producción actual.

Fecha: 7 de octubre de 2026. Rama local: `codex/modular-v2-approved`.

Se completó el trabajo de interfaz, contenido y práctica disponible sin nuevos accesos. Las piezas de IA, evaluaciones y facturación que requieren servicios privilegiados quedan como candidatos aislados y probados; no se presentan como integraciones activas ni como lanzamiento terminado.

## Resultado por bloque

| Bloque | Entregado | Estado real |
| --- | --- | --- |
| Interfaz | Selección visual de tema y cuatro colores, navegación de aprendizaje, menú móvil con cierre/foco, diploma reutilizable e impresión | Implementado localmente |
| Contenido actual | Guías de proceso, actividades, entregables, checklist, aceptación y rúbrica para 16 posiciones; nueve casos completos de CS, soporte e integraciones | Integrado en revisión local; no modifica los cursos publicados |
| Decisiones | Elección de puesto/enfoque, hasta tres prácticas recomendadas con explicación, cambio voluntario y exclusión de muestras ya resueltas | Integrado en práctica; no diagnostica dominio |
| Código | Seis retos Python/SQLite: filtro, suma, conversión inválida y agrupación | Ejecutados en Chromium; runtime exclusivamente local |
| Integridad | Borrador con decisión, prueba, esperado, observado, fallo y herramientas; variantes privadas por intento con proyección pública limitada | Borrador integrado; banco de evaluación todavía sin conectar a exámenes |
| Tutor | Política de presupuesto/idempotencia y orquestador con proveedor simulado, reserva, claim único, rechazo/incompletitud, timeout y conciliación | Candidato sin endpoint ni proveedor real; requiere un store atómico |
| Facturación y certificados | Intenciones de cambio de items, precio vigente, dos fases de Tutor, incluidos Pro, conservación de pagos únicos, elegibilidad y privacidad pública | Candidatos; no actualizan Stripe ni emiten certificados reales |
| Consolidación | Pruebas, bloqueos de entorno, documentación y paquete incremental | Terminado localmente; publicación pendiente |

## Interfaz y pantallas afectadas

- Cabecera pública: controles móviles de 44 px, cierre con Escape y regreso del foco, clic exterior y navegación.
- Perfil: tarjetas de modo del dispositivo, claro y oscuro; cuatro colores con radios nativos. Conserva los ajustes y separación de cuentas existentes. La demostración de visitante solo usa su navegador.
- Mi CodeZero: accesos visuales al camino y al perfil; equipos y práctica solo aparecen cuando el sandbox correspondiente está habilitado. No se añade acceso administrativo.
- El mensaje de regreso de checkout ahora dice que el pago se está verificando; un parámetro de URL no confirma un pago.
- Diploma privado del bloque: usa un documento compartido, conserva la comprobación e identificación de emisión existentes. La muestra imprimible declara que es ficticia.
- `/experience-preview`: revisión anónima de apariencia, casos, decisiones, evidencia y costos de referencia. Exige flag y sandbox válido, bloquea producción y no realiza escritura, cobro o emisión.
- `/practice-preview`: recomendaciones explicadas y selector de seis retos de código; la ejecución conserva el aislamiento y sus límites anteriores.

Los nuevos casos y retos no se agregan a los 11 IDs del contrato `samples-v1`. No se cambian cuotas, calificaciones oficiales, requisitos de aprobación ni el diagnóstico de afinidad. Las rutas futuras siguen como Próximamente con lista de espera.

## Contenido reforzado

Los nueve casos originales cubren tres momentos por objetivo:

| Objetivo | Inicio | Desarrollo | Cierre |
| --- | --- | --- | --- |
| Customer Success técnico | Primer valor medible | Adopción, riesgo y patrocinador | Valor, brecha y renovación |
| Soporte técnico | Impacto, urgencia y alternativa | Hipótesis y escalación sin secretos | Confirmación, reapertura y prevención |
| Integraciones | Contrato, IDs, moneda y unidades | Firma, deduplicación y recuperación | Reintentos, reconciliación y aceptación |

Cada caso incluye hechos ficticios, elección, consecuencia, tres entregables y una variante de fallo. La rúbrica distingue diagnóstico, acción, verificación y comunicación/seguridad, con evidencia observable y revisión humana. Las guías de las otras posiciones conservan sus referencias primarias y permiten revisar proceso y checklist; no se afirma cobertura profesional exhaustiva.

Referencias primarias revisadas: [HubSpot: salud de cuentas](https://knowledge.hubspot.com/help-desk/customize-a-health-score-in-the-customer-success-workspace), [Zendesk: problemas e incidentes](https://support.zendesk.com/hc/en-us/articles/4408835103898-Working-with-problem-and-incident-tickets), [Stripe: webhooks](https://docs.stripe.com/webhooks) e [idempotencia](https://docs.stripe.com/api/idempotent_requests). Los casos y datos fueron escritos para CodeZero; no se copió documentación interna de terceros.

## Controles del Tutor: alcance y condición de activación

`tutor-budget-policy.ts` usa enteros en millonésimas de USD y separa presupuesto de la factura en MXN. Las reservas pendientes cuentan contra consultas y costo. Repetir una clave no permite reenviar. Solo una reserva no enviada se libera; timeout después de enviar mantiene el importe reservado y bloquea nuevos intentos hasta conciliar. El costo real no se recorta artificialmente si supera la reserva; los nuevos intentos quedan bloqueados por el presupuesto.

`tutor-controlled-run.ts` une reserva, claim, proveedor y extracción de respuesta. Las fixtures prueban solicitudes concurrentes con la misma clave, fallo del proveedor, rechazo, uso ausente y timeout con respuesta tardía. Una respuesta sin uso conciliable no se entrega como éxito. El callback de respuesta tardía es una recuperación de mejor esfuerzo; no sustituye un reconciliador durable si el proceso termina.

Antes de activarlo se necesita:

1. Store transaccional con cuenta verificada y periodo de facturación; operaciones atómicas de reserva, claim y settlement. La fixture en memoria no es un store de producción.
2. Límite reservado calculado con el modelo, tokenización, tarifas y parámetros realmente usados. Los importes de las fixtures no son un presupuesto aprobado.
3. Adaptador real con timeouts, medición de tokens y reconciliación durable de llamadas inciertas. Los reintentos no pueden asumir que la llamada anterior fue gratuita.
4. Credencial segura del proveedor y validación con consumo acotado, sin alterar las cuotas actuales sin autorización.

Referencia de costo: GPT-6 Luna Standard, 0.10 USD por millón de entrada y 0.50 USD por millón de salida, revisado el 7 de octubre. Con **20 MXN/USD solo como supuesto**:

| Escenario por usuario/mes | Llamadas | Entrada/salida por llamada | USD | MXN estimados |
| --- | --- | --- | --- | --- |
| Tutor, 100 consultas | 100 | 2,500 / 768 | 0.0634 | 1.27 |
| Simulador, 20 sesiones × 8 turnos | 160 | 3,500 / 1,000 | 0.1360 | 2.72 |
| Simulador amplio, 20 sesiones × 20 turnos | 400 | 10,000 / 1,500 | 0.7000 | 14.00 |

[Tarifas oficiales](https://developers.openai.com/api/docs/models/gpt-6-luna). Son estimaciones de tokens, no mediciones; excluyen impuestos, cambio/comisiones, reintentos, herramientas e infraestructura. El historial e instrucciones deben contarse en la entrada y el razonamiento facturable en la salida. La referencia limita los supuestos de entrada al umbral de 272,000 tokens para no aplicar la tarifa base a contextos más largos.

## Facturación y certificado: candidato sin activación

`modular-billing-policy.ts` devuelve intenciones, no payloads que se envíen a Stripe. Agregar un mensual conserva el ID de suscripción y el item base. Cancelar solo selecciona el item del add-on para la próxima renovación. Los items activos conservan su Price ID e importe. Pro obtiene los incluidos operativos por entitlement, sin crear otro cobro. Las compras únicas pagadas se conservan en Free; registros de propiedad duplicados o ambiguos se rechazan.

La nueva intención de Tutor contiene solo una fase introductoria de $50 y renovación a $100, con los Price IDs existentes que debe resolver y verificar el futuro adaptador. Mantiene todos los otros items. **No migra automáticamente schedules existentes ni cambia el calendario ya contratado**. El paso real de eliminar $75 está pendiente en un sandbox de Stripe y, después, de aprobación de Live.

Riesgo principal: una suscripción con varios productos produce una factura y pago conjuntos. `invoice.payment_failed` no identifica qué add-on falló. La política candidata no degrada el plan base ni inventa un item para cancelar; requiere conciliación y una política aprobada de cobertura/gracia/remediación. [Referencia de Stripe](https://docs.stripe.com/billing/subscriptions/quantities).

El adaptador requiere validar ownership por el grafo de objetos de Stripe y la base de datos, readiness y Prices en servidor, idempotencia durable, eventos duplicados/fuera de orden, prorrateos y los webhooks `customer.subscription.*`, `invoice.paid` e `invoice.payment_failed`, además de pagos asíncronos. Volver de checkout no entrega derechos. La migración de schedules debe preservar descuentos, cantidades, impuestos y periodos del snapshot actual, no inferirlos desde este candidato. [Schedules](https://docs.stripe.com/billing/subscriptions/subscription-schedules).

`certificate-policy.ts` requiere módulo operativo, propiedad, todas las lecciones, examen y proyecto aprobados antes de una emisión transaccional. Su vista pública limita campos y refleja revocación; excluye cuenta, correo y evidencias privadas. Falta un endpoint con token opaco generado criptográficamente, consentimiento, rate limit y almacenamiento/lookup seguro. Los certificados ya emitidos deben conservarse incluso al bajar de plan; un cambio de plan no constituye revocación.

Los precios se mantienen en MXN y el IVA incluido está pendiente de confirmación con contador. Stripe Tax no se habilitó; su registro y configuración necesitan revisión fiscal antes de activación.

## Validación y límites

- **142 pruebas unitarias** aprobadas, incluidas 27 nuevas pruebas de contenido, recomendaciones, evidencia, variantes, presupuesto/orquestación, items, propiedad y certificado.
- **33 comprobaciones PostgreSQL/PGlite** aprobadas sobre los permisos y progreso existentes. No se aplicaron migraciones nuevas al cloud en esta entrega.
- TypeScript y compilación Next.js aprobados.
- Chromium sobre la compilación: temas y persistencia al recargar; contraste mínimo 4.5:1 de texto de botón principal para ocho combinaciones tema/color; móvil de 390 px; menú/Escape/foco/clic exterior/navegación; impresión; casos y recomendaciones; borrador y borrado. No equivale a auditoría completa WCAG.
- Chromium ejecutó los seis retos Python/SQLite y verificó aislamiento de cookies y origen, rechazo de mensajes falsos, bloqueo de solicitudes hacia la app, límites de salida/filas, timeout, cancelación y recuperación.
- Tres verificaciones HTTP reales: la revisión devuelve 404 con el flag apagado, con entorno production y con destino de base no confiable.
- Seguridad: seis reglas Semgrep sobre 19 archivos de aplicación/política y escaneo de secretos sin hallazgos. El alcance no es una certificación de seguridad.

No se repitió la batería Auth/PostgREST cloud de la entrega anterior porque esta entrega no cambia APIs ni migraciones del sandbox. No se declara recorrido completo de alumno/manager autenticado, emisión real, pago real ni respuesta del proveedor. Firefox, WebKit, teléfonos físicos y límite duro de RAM siguen sin verificación.

## Pendientes que necesitan acceso o decisión

1. La clave administrativa del sandbox sigue diferida por Isaac: bloquea pruebas administrativas completas, parte de equipos y emisión real de diplomas/certificados. No se pide de nuevo ni se publica en documentación.
2. Stripe sandbox separado: adaptador, Prices reales, schedules y ciclo de webhooks; luego aprobación explícita para Stripe Live.
3. Credencial de IA y aprobación de consumo: modelo, costo reservado y conciliación real.
4. Política del pago fallido en factura conjunta y confirmación de IVA.
5. Activación en producción y revisión final del alcance público; permanecen sin desplegar.

No se modificaron Stripe Live, producción, Auth, RLS ni cuotas en servicios remotos. Despliegues realizados en esta entrega: **0**. No se reactivaron automatizaciones.

## Reproducción local y entrega

La vista necesita `CODEZERO_EXPERIENCE_PREVIEW=1`, `CODEZERO_WORKSPACE_SANDBOX=1`, `CODEZERO_ENVIRONMENT=sandbox` y un destino validado por `workspaceSandboxEnabled`. El modo local exige `CODEZERO_SANDBOX_PROJECT_REF=local` y URL de Supabase de loopback. El editor usa su runtime de revisión en otro hostname y puerto, según `BROWSER_CODE_RUNTIME.md`.

Comprobaciones: `npm test`, `npm run test:database`, `tsc --noEmit`, `npm run build`; `scripts/experience-browser-check.mjs`, `scripts/experience-guard-check.mjs` y `scripts/browser-practice-check.mjs`. Los scripts de navegador aceptan `CODEZERO_BROWSER_EXECUTABLE`; la revisión usa `CODEZERO_REVIEW_BUILT=1` para una compilación existente. Sus servidores y datos son de prueba.

El paquete `CodeZero_independent_completion.patch` es incremental: se aplica **después de `CodeZero_tutor_read_optimization.patch`**, respetando la cadena anterior. Contiene este documento, cambios de aplicación y comprobaciones; no incluye credenciales, node_modules ni cambios heredados ajenos a esta entrega. No crea commits ni envía cambios a un remoto.


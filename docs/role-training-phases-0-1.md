# Formación por puesto · fases 0 y 1

Entrega aditiva desarrollada en CodeZero Sandbox y autorizada por Isaac para producción el 7 de octubre de 2026 (CDMX). Rama `sandbox/role-training-phases-0-1`, basada en main `8270b935966001ab5ce70af3af687fec74d64bf8`. El programa se publica como piloto editorial; su duración y profundidad no están certificadas con alumnos. El registro de despliegue y versión está en Notion y en `docs/role-training-release.md`.

Isaac aprobó las 29 unidades, trabajo en sandbox y ampliación de horas. Se conserva el alcance de tronco común, Customer Success y manager v1. Otras seis rutas y formación completa de liderazgo quedan fuera. Desarrollar criterio ejecutivo y colaboración en CS prepara para una etapa posterior de liderazgo.

## Duración y producción real

| Bloque | Unidades | Trabajo estimado, incluidas integradoras |
|---|---:|---:|
| Tronco común | 9 | 45 h |
| CS · Fundamentos | 5 | 20 h |
| CS · Operación | 5 | 32 h |
| CS · Dominio | 5 | 36 h |
| CS · Especialista | 5 | 32 h |
| Total | 29 | 165 h |

Cada unidad tiene lección inicial, tres decisiones con feedback, tarea abierta, plantilla, rúbrica, ejemplo y dos ejercicios opcionales de transferencia. Se incorporan 87 decisiones, 29 entregables, ocho episodios canónicos de Faro, cuatro role-plays escritos, tres proyectos, un capstone, cuatro exámenes de cinco decisiones y cuatro reevaluaciones. Son 53 actividades de catálogo; las decisiones son evidencias internas de una actividad, no 87 entregas adicionales.

Las horas incluyen análisis, lectura de referencia, preparación y corrección de entregables, integración de proyectos y práctica independiente. Los 30 días de espera no son horas activas. El contenido inicial no equivale a 165 horas de video ni a profundidad editorial validada. La distribución deberá calibrarse con tiempos y calidad de entregas del piloto.

Fuentes de contenido: caso, datos, etapas y rúbrica ya existentes de Cuenta Faro; lectura primaria del [manual CSM de GitLab](https://handbook.gitlab.com/handbook/customer-experience/csm/). La lectura externa aporta contexto, no autoridad para emitir diplomas del piloto. SQL, APIs e integraciones se enlazan a `/learn/6`, `/learn/8` y `/learn/11`, conservando el acceso original.

## Reutilización y adiciones

Se reutilizan los 16 puestos de `career-role-workflows`, Cuenta Faro y sus ocho etapas, las lecciones CS existentes, la rúbrica canónica de capstone, los roles y permisos jerárquicos, `/teams`, `learning_assignments`, `learning_evidence`, `certificates` y el sistema de sesiones/rate limits. No hay una segunda Cuenta Faro ni sistema de equipos o de cuotas.

Se agregan catálogo de actividades, perfiles de competencia versionados, entregas inmutables e historial de revisiones. `learning_errors` y su resumen anterior se conservan; los nuevos errores críticos quedan asociados al evento de revisión en el historial. El 0–100 histórico sigue en su sección original, sin convertirlo a dominio 0–4. Afinidad, scoring y misiones originales no se modifican.

La matriz separa nivel validado, autoevaluación provisional, rúbrica ponderada y tendencia. Una corrección no duplica una evidencia independiente; las decisiones tienen claves independientes estables y los reenvíos se deduplican por solicitud. La revisión humana prevalece sobre la autoevaluación y conserva errores/correcciones. Los intentos fallidos no acreditan reconocimiento. Pesos 1/3/5/8 por tipo y doble peso para últimos 90 días, sin sustituir la comprobación de autonomía por una media.

Nivel 0 con menos de tres evidencias reconocidas; nivel 1 por reconocimiento; nivel 2 requiere aplicación revisada con apoyo, con autoevaluación guiada mostrada como provisional; nivel 3 exige una entrega independiente revisada con rúbrica ≥3/4, además del mínimo de evidencia. Nivel 4 requiere capstone Admin y reevaluación humana vinculada ≥30 días para la competencia correspondiente. La tendencia requiere tres evidencias en cada ventana de 90 días; en otro caso muestra datos insuficientes.

El diploma nuevo `customer-success-v2` reutiliza `certificates`, mantiene los diplomas v1 y se emite una sola vez por usuario al verificar en servidor capstone independiente aprobado por Admin y nivel 3 en cada competencia de peso Alto del perfil CS vigente. No se emiten diplomas por una autoevaluación. La ruta conserva los derechos Pro/Enterprise y de Admin del CS existente.

Entregables, proyectos y capstone obligatorios incluidos en este piloto no llaman al consumo de cuota de proyectos. Esta regla no cambia cuotas o facturación anteriores. Revisor a volumen queda pendiente de la decisión de Isaac; supervisores y managers ahora pueden calificar proyectos dentro de su alcance, y un flujo opcional permite delegar revisiones específicas. Capstones permanecen en Administración. Esta ampliación fue solicitada expresamente por Isaac después de la entrega inicial.

## Experiencia y permisos

`/role-training` permite practicar y ver la ficha propia; con `organization_id` muestra el mismo cálculo y evidencia que el manager para esa organización. La práctica personal sin organización sigue privada. `/competencies` incorpora el mismo panel según el equipo seleccionado.

`/teams` agrega mapa 0–4 por persona/perfil, brecha común entre personas con evidencia y candidatos a mentor dentro del alcance autorizado. No hay ranking. La ficha ofrece hasta tres fortalezas y tres brechas con referencias a evidencia, errores críticos, tendencia y tres preguntas para el 1:1. Cuando faltan datos no se inventan fortalezas o tendencias.

El manager asigna de una a tres unidades con fecha; el servidor calcula el antes y, tras una revisión humana, el después. Se reutilizan las asignaciones y la auditoría existentes. Cambios de perfil entre snapshots quedan señalados. El colaborador ve ambas mediciones. El aviso visible indica que se mide práctica simulada, no desempeño laboral real.

`/role-training/review` permite a supervisores y managers revisar entregables y proyectos ajenos dentro del alcance, o únicamente los proyectos delegados por un flujo. Capstones solo desde Admin. `/role-training/profiles` permite al dueño ajustar pesos Alto/Medio/Bajo y niveles esperados con una versión nueva. Los cambios usan control de concurrencia. Las lecturas de historial, puestos y versiones se paginan; un fallo no se presenta como cero evidencia.

El piloto nuevo está explícitamente en español (`lang=es-MX`, `translate=no`); las excepciones de traducción están enumeradas por texto/archivo usando el mecanismo existente. No se alteran las traducciones existentes. Traducción editorial del piloto a EN/PT/FR queda pendiente; no se copian textos en español como traducciones falsas.

## Aprobación opcional de proyectos · extensión solicitada

En `/teams` se enlaza `/role-training/approval-flow?organization_id=…`. Pueden configurar supervisores, managers, administradores y dueños de organización; un colaborador únicamente revisa un proyecto si fue seleccionado explícitamente. Se reutilizan los cinco roles reales: owner, admin, manager, supervisor y learner. No se inventan roles ni se cambia su jerarquía general.

Cada flujo define destinatarios por rol, puesto o persona; el buscador muestra nombre y UUID para desambiguar. Las selecciones se suman (OR), incluyendo “todos en mi alcance”. Los mismos criterios eligen revisores. Todo queda limitado a miembros activos de la organización que están dentro del alcance del configurador; el autor de la entrega se excluye siempre.

De uno a ocho pasos, ordenables con Subir/Bajar. Cada paso exige de una a veinte aprobaciones de personas distintas; una persona no cuenta dos veces en el mismo paso. Un único paso permite revisión paralela; varios pasos exigen secuencia. La misma persona puede participar en pasos distintos si así se configura. No existe un quorum global separado: todos los pasos deben cumplir su mínimo.

Prioridad de flujo 1–1000, número menor primero si coinciden reglas. Un empate o un mínimo imposible rechaza el envío de forma atómica y pide al manager corregirlo. Sin flujo aplicable se conserva revisión directa por un líder dentro del alcance o Admin. No se crea un flujo obligatorio ni se habilita una política para todos los equipos automáticamente.

Guardar genera una versión inmutable con concurrencia optimista. Al enviar, la entrega fija esa versión, orden, quorum y personas elegibles. Editar/desactivar afecta nuevas entregas. No cambia procesos en curso. El equipo crea sus flujos desde la pantalla; el sandbox queda sin flujos inventados para usuarios reales.

Cada revisión registra rúbrica, autonomía comprobada, errores críticos, feedback y decisión. Aprobar requiere todas las competencias ≥3/4 y cero errores críticos. Una solicitud de cambios bloquea el paso aun si otros votos alcanzan el mínimo. El revisor puede corregir su propia revisión en el paso actual, conservando eventos previos; no puede modificar la entrega del alumno. El alumno envía una nueva entrega para corregir su trabajo. Los pasos cerrados y flujos aprobados no admiten más votos.

Solo el consenso final agrega **una** evidencia humana de proyecto, con el mínimo de las calificaciones aprobadas por competencia. Autonomía independiente requiere acuerdo de todos los votos aprobados. No se convierte cada voto en otra evidencia independiente ni en nivel/diploma. El colaborador ve pasos, revisores, progreso y feedback en su propia ficha; la evidencia final se etiqueta “Flujo configurado”. El snapshot después del refuerzo se calcula únicamente al terminar, usando la autoridad del configurador guardada en la entrega; el evento de aprobación conserva al actor real.

El delegado accede únicamente al proyecto nombrado, nunca a todo el historial o directorio del autor. La RPC vuelve a verificar selección, paso, acceso y estado actuales; ni Admin usa revisión directa para saltar un flujo configurado. El alcance delegado se revoca dentro de las transacciones de cambios de acceso, rol/membresía o suspensión del autorizador, mediante triggers invoker en el esquema privado. No se añade SECURITY DEFINER ni se expone el acceso privado de otros viewers.

Si un revisor pierde acceso, ya no puede seguir calificando. Si queda imposible el quorum de una entrega antigua, se requiere restaurar un acceso legítimo o ajustar el flujo y enviar una entrega nueva; no se reescriben revisores ni votos anteriores silenciosamente. Notificaciones automáticas y reasignación de procesos en curso quedan fuera de esta extensión.

Se agregan cuatro tablas de flujo/versiones, proceso por entrega, participantes y votos, con RLS y escritura solo desde servidor; una FK de procedencia en evidencia y auditoría de configuración/aprobación. Se extiende la RPC de revisión existente y se mantiene el helper directo protegido contra bypass. Las entregas anteriores no se incorporan retroactivamente a un flujo.

## Estado remoto y migraciones

Desarrollo en `sdvwkrosdnlacyhnuxwo` — CodeZero Sandbox. Tras la autorización explícita de publicación, se aplicó a producción `kwfzhpapvpdatdfwhouf` una migración consolidada 20261008044128, con las cinco migraciones siguientes y el catálogo idempotente. No aplicar los archivos sandbox además de la consolidada en producción.

| Versión real de Supabase | Migración |
|---|---|
| 20261008032420 | role_training_phases_0_1 |
| 20261008033010 | role_training_included_diploma |
| 20261008033350 | role_training_review_foreign_key_index |
| 20261008042551 | project_approval_workflows |
| 20261008042816 | project_review_delegation_scope |

SQL canónico en `supabase/sandbox/migrations`. Las primeras tres migraciones agregan cuatro tablas, columnas de puesto/snapshots/fecha, tipo de asignación adicional y RPCs solo para servidor. Las tablas nuevas tienen RLS. Los roles anon/authenticated no pueden escribir evidencia ni invocar las RPCs de calificación. No se modifica configuración Auth. La publicación autorizada incorpora las nuevas tablas con RLS productivo y extiende el acceso delegado puntual a entregas.

Catálogo sembrado: 53 actividades, 16 perfiles por puesto. `supabase/sandbox/role_training_catalog_seed.sql` es bootstrap idempotente y no sobrescribe perfiles editados. El catálogo se genera sin IDs hardcodeados con `node scripts/role-training-catalog.mjs`. Se ajustaron tres reevaluaciones antes de registrar entregas, para enlazarlas a kickoff, health score y renovación; la cuarta usa voz del cliente. El estado final coincide con el archivo de seed. No repetir migraciones ya registradas.

Para habilitar localmente con credenciales del sandbox, usar las banderas existentes `CODEZERO_WORKSPACE_SANDBOX=1`, `CODEZERO_ENVIRONMENT=sandbox`, `CODEZERO_SANDBOX_PROJECT_REF=sdvwkrosdnlacyhnuxwo` y agregar `CODEZERO_ROLE_TRAINING=1`. La URL Supabase debe corresponder exactamente al ref. Ref incorrecto o flag ausente devuelven 404. En producción requiere además `CODEZERO_ROLE_TRAINING_PRODUCTION=1`, `CODEZERO_ROLE_TRAINING=1` y la activación productiva del workspace con ref exacto `kwfzhpapvpdatdfwhouf`. Un preview contra la base productiva permanece bloqueado. No se guardaron ni cambiaron credenciales.

El autodespliegue Vercel está deshabilitado para esta rama en `vercel.json`; ninguna configuración de despliegue de otras ramas cambia. La publicación autorizada usa un único envío a main, con las nuevas banderas limitadas al target production; la rama sandbox conserva su bloqueo de autodespliegue.

## Verificación y límites

- 181 pruebas unitarias/regresión y auditoría de traducción sin faltantes fuera de las excepciones explícitas del piloto.
- Diecisiete grupos PostgreSQL locales: aislamiento/RLS, permisos de escritura, replay/conflicto, revisión/roles/concurrencia, reevaluación a 30 días, asignación/snapshots, perfiles y diploma idempotente conservando certificados existentes.
- Transacción en Supabase sandbox: entrega/replay/conflicto, aislamiento entre organizaciones, revisión de manager, revisión de proyecto por manager, flujo delegado de dos pasos, rechazo de orden incorrecto/bypass, evidencia solo al final y revocación por suspensión del autorizador, rechazo de reevaluación prematura/diploma sin requisitos, snapshots y RLS de alumno/manager/externo. Todo se revirtió: cero organizaciones, entregas, evidencias, flujos o votos de prueba residuales. SQL reproducible: `supabase/sandbox/validate_role_training.sql`.
- Siete grupos HTTP con servidor Next y handlers reales: formulario→API→RPC fixture→evidencia, permisos/origen, asignación/revisión/snapshots, igualdad de matriz propia/manager y mapa/Admin/diploma/cuota, configuración del flujo con origen/permiso/payload verificados y revisión que retiene evidencia/snapshot hasta completar los pasos. Auth/REST son fixtures sintéticos; esto no acredita una sesión Auth real en cloud.
- TypeScript y build Next completados; npm audit sin vulnerabilidades. También pasan los checks CI anteriores de workspace, soporte, learning flows, CS, registro y recuperación.
- Advisor sandbox: sin problemas nuevos de seguridad ni claves foráneas sin índice. Permanece aviso previo de [protección de contraseñas filtradas deshabilitada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); no se cambia Auth en esta entrega. El advisor de rendimiento marca dos políticas SELECT permisivas para entregas: se conserva la original y se añade el acceso delegado puntual; ambas se evalúan y esto puede requerir optimización al aumentar volumen. [Referencia del advisor](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies). Avisos informativos de índices todavía sin uso son normales en el sandbox recién sembrado.

La ejecución visual Playwright está preparada pero no pasó en este entorno: no hay Chromium y la descarga devolvió archivos inválidos. No se afirma validación visual, móvil, teclado, contraste, axe ni navegador físico. CI agrega comprobaciones PostgreSQL y el flujo Chromium del piloto para ejecutarlas donde exista el navegador.

La pantalla del diploma muestra la emisión comprobando `certificates` en servidor. La publicación/verificación pública de esta nueva constancia y el flujo completo del export general no fueron validados: este sandbox aún carece de algunas tablas de integraciones previas presentes en main. Se agregaron los datos nuevos al export existente bajo flag; no se copió infraestructura productiva para resolver dependencias ajenas.

Pendientes para cierre operativo: lectura editorial y calibración con alumnos, revisión visual/accesibilidad en navegador disponible y sesión Auth sandbox real. La revisión de Isaac de las 29 unidades no es requisito para continuar: ya la dispensó. La organización de revisores a volumen queda para más adelante. Isaac ya autorizó la publicación de este alcance; rutas adicionales y funciones ajenas mantienen sus decisiones propias.

Reproducción: `npm test`; `node scripts/role-training-db-check.mjs`; `CODEZERO_HTTP_ONLY=1 node scripts/role-training-browser-check.mjs`; `node scripts/role-training-browser-check.mjs` con Chromium instalado; `npm run build`. El modo HTTP no ejecuta comprobaciones visuales. Cada script cierra su servidor antes de iniciar el build siguiente.

Documento funcional y estado en [Notion · Piloto CS](https://app.notion.com/p/3f352732bf9481e89150c6f4635f6a5e?pvs=204).

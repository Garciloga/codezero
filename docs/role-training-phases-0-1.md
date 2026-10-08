# Formación por puesto · fases 0 y 1

Entrega aditiva de revisión, exclusivamente para CodeZero Sandbox. Rama `sandbox/role-training-phases-0-1`, basada en main `8270b935966001ab5ce70af3af687fec74d64bf8`. El programa está implementado como piloto editorial; no se ha publicado ni certificado su duración con alumnos.

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

Entregables, proyectos y capstone obligatorios incluidos en este piloto no llaman al consumo de cuota de proyectos. Esta regla no cambia cuotas o facturación anteriores. Revisor a volumen queda pendiente de la decisión de Isaac; hoy proyectos/capstone corresponden a Administración y entregables al manager dentro de su alcance.

## Experiencia y permisos

`/role-training` permite practicar y ver la ficha propia; con `organization_id` muestra el mismo cálculo y evidencia que el manager para esa organización. La práctica personal sin organización sigue privada. `/competencies` incorpora el mismo panel según el equipo seleccionado.

`/teams` agrega mapa 0–4 por persona/perfil, brecha común entre personas con evidencia y candidatos a mentor dentro del alcance autorizado. No hay ranking. La ficha ofrece hasta tres fortalezas y tres brechas con referencias a evidencia, errores críticos, tendencia y tres preguntas para el 1:1. Cuando faltan datos no se inventan fortalezas o tendencias.

El manager asigna de una a tres unidades con fecha; el servidor calcula el antes y, tras una revisión humana, el después. Se reutilizan las asignaciones y la auditoría existentes. Cambios de perfil entre snapshots quedan señalados. El colaborador ve ambas mediciones. El aviso visible indica que se mide práctica simulada, no desempeño laboral real.

`/role-training/review` permite a managers revisar entregables ajenos dentro del alcance. Proyectos/capstones solo desde Admin. `/role-training/profiles` permite al dueño ajustar pesos Alto/Medio/Bajo y niveles esperados con una versión nueva. Los cambios usan control de concurrencia. Las lecturas de historial, puestos y versiones se paginan; un fallo no se presenta como cero evidencia.

El piloto nuevo está explícitamente en español (`lang=es-MX`, `translate=no`); las excepciones de traducción están enumeradas por texto/archivo usando el mecanismo existente. No se alteran las traducciones existentes. Traducción editorial del piloto a EN/PT/FR queda pendiente; no se copian textos en español como traducciones falsas.

## Estado remoto y migraciones

Único proyecto escrito: `sdvwkrosdnlacyhnuxwo` — CodeZero Sandbox. Producción `kwfzhpapvpdatdfwhouf` no recibió escrituras ni migraciones.

| Versión real de Supabase | Migración |
|---|---|
| 20261008032420 | role_training_phases_0_1 |
| 20261008033010 | role_training_included_diploma |
| 20261008033350 | role_training_review_foreign_key_index |

SQL canónico en `supabase/sandbox/migrations`. Son adiciones de cuatro tablas, columnas de puesto/snapshots/fecha, tipo de asignación adicional y RPCs solo para servidor. Las tablas nuevas tienen RLS. Los roles anon/authenticated no pueden escribir evidencia ni invocar las RPCs de calificación. No se modifica Auth ni RLS productivo.

Catálogo sembrado: 53 actividades, 16 perfiles por puesto. `supabase/sandbox/role_training_catalog_seed.sql` es bootstrap idempotente y no sobrescribe perfiles editados. El catálogo se genera sin IDs hardcodeados con `node scripts/role-training-catalog.mjs`. Se ajustaron tres reevaluaciones antes de registrar entregas, para enlazarlas a kickoff, health score y renovación; la cuarta usa voz del cliente. El estado final coincide con el archivo de seed. No repetir migraciones ya registradas.

Para habilitar localmente con credenciales del sandbox, usar las banderas existentes `CODEZERO_WORKSPACE_SANDBOX=1`, `CODEZERO_ENVIRONMENT=sandbox`, `CODEZERO_SANDBOX_PROJECT_REF=sdvwkrosdnlacyhnuxwo` y agregar `CODEZERO_ROLE_TRAINING=1`. La URL Supabase debe corresponder exactamente al ref. Producción, ref incorrecto o flag ausente devuelven 404 para el piloto. No se guardaron ni cambiaron credenciales.

El autodespliegue Vercel está deshabilitado para esta rama en `vercel.json`; ninguna configuración de despliegue de otras ramas cambia. No se creó deployment ni se fusionó main.

## Verificación y límites

- 181 pruebas unitarias/regresión y auditoría de traducción sin faltantes fuera de las excepciones explícitas del piloto.
- Nueve grupos PostgreSQL locales: aislamiento/RLS, permisos de escritura, replay/conflicto, revisión/roles/concurrencia, reevaluación a 30 días, asignación/snapshots, perfiles y diploma idempotente conservando certificados existentes.
- Transacción en Supabase sandbox: entrega/replay/conflicto, aislamiento entre organizaciones, revisión de manager, rechazo de proyecto al manager, rechazo de reevaluación prematura/diploma sin requisitos, snapshots y RLS de alumno/manager/externo. Todo se revirtió: cero organizaciones, entregas o evidencias de prueba residuales. SQL reproducible: `supabase/sandbox/validate_role_training.sql`.
- Cinco grupos HTTP con servidor Next y handlers reales: formulario→API→RPC fixture→evidencia, permisos/origen, asignación/revisión/snapshots, igualdad de matriz propia/manager y mapa/Admin/diploma/cuota. Auth/REST son fixtures sintéticos; esto no acredita una sesión Auth real en cloud.
- TypeScript y build Next completados; npm audit sin vulnerabilidades. También pasan los checks CI anteriores de workspace, soporte, learning flows, CS, registro y recuperación.
- Advisor sandbox: sin problemas nuevos de seguridad ni claves foráneas sin índice. Permanece aviso previo de [protección de contraseñas filtradas deshabilitada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); no se cambia Auth en esta entrega. Avisos informativos de índices todavía sin uso son normales en el sandbox recién sembrado.

La ejecución visual Playwright está preparada pero no pasó en este entorno: no hay Chromium y la descarga devolvió archivos inválidos. No se afirma validación visual, móvil, teclado, contraste, axe ni navegador físico. CI agrega comprobaciones PostgreSQL y el flujo Chromium del piloto para ejecutarlas donde exista el navegador.

La pantalla del diploma muestra la emisión comprobando `certificates` en servidor. La publicación/verificación pública de esta nueva constancia y el flujo completo del export general no fueron validados: este sandbox aún carece de algunas tablas de integraciones previas presentes en main. Se agregaron los datos nuevos al export existente bajo flag; no se copió infraestructura productiva para resolver dependencias ajenas.

Pendientes para cierre operativo: lectura editorial y calibración con alumnos, revisión visual/accesibilidad en navegador disponible y sesión Auth sandbox real. La revisión de Isaac de las 29 unidades no es requisito para continuar: ya la dispensó. La organización de revisores a volumen queda para más adelante. Cualquier paso a producción necesita autorización independiente.

Reproducción: `npm test`; `node scripts/role-training-db-check.mjs`; `CODEZERO_HTTP_ONLY=1 node scripts/role-training-browser-check.mjs`; `node scripts/role-training-browser-check.mjs` con Chromium instalado; `npm run build`. El modo HTTP no ejecuta comprobaciones visuales. Cada script cierra su servidor antes de iniciar el build siguiente.

Documento funcional y estado en [Notion · Piloto CS](https://app.notion.com/p/3f352732bf9481e89150c6f4635f6a5e?pvs=204).

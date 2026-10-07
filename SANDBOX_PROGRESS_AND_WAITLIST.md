# Progreso privado, catálogo y lista de espera · entrega local

Fecha: 7 de octubre de 2026. Rama local `codex/modular-v2-approved`. No publicado.

## Qué se completó

### Prácticas por usuario

Nueva tabla `private_practice_progress`, una fila por cuenta. Guarda versión `samples-v1`, puesto objetivo, IDs únicos de muestras marcadas como resueltas, fecha de inicio del plan, checklist de siete días y pulso privado (máximo 500 caracteres). El plan se reconstruye desde el catálogo versionado. El guardado es explícito; muestra cambios pendientes, errores y confirmación. Recupera el estado al abrir la página con sesión activa y base de pruebas configurada.

No guarda respuestas, borradores de actividades, código ni salida del editor. No es un historial de intentos ni evidencia revisada. Las muestras resueltas son autoevaluaciones privadas: no acreditan competencias, desbloquean contenido, consumen cuotas ni generan diplomas. El pulso no es un testimonio ni se publica.

La API verifica la identidad con Auth y perfil activo; toma el usuario de la sesión, nunca del cuerpo recibido. Valida claves, catálogo, versión, tamaños, duplicados y fechas reales. RLS impide leer/escribir otras cuentas y revoca acceso al suspender el perfil. RPC security invoker con bloqueo por cuenta y revisión esperada: otra pestaña provoca HTTP 409, sin sobreescribir. Cambiar de cuenta reinicia el componente por identidad.

Si la sesión/base/tablas/versión no están disponibles, la pantalla conserva exploración temporal y explica que no hay guardado. No sustituye silenciosamente datos incompatibles.

### Equipos

Asignación desde selector con títulos de lecciones, evaluaciones y proyectos publicados. El catálogo se obtiene con la sesión del responsable; no mediante credenciales administrativas. Validación del identificador en API y nueva comprobación de publicación/permisos en el RPC ya existente. El catálogo falla cerrado si alguna lectura/paginación falla.

Reporte CSV descargable por miembro activo, limitado por el RLS existente: dirección/administración ve su organización; managers su alcance autorizado; supervisores reportes directos; colaboradores lo propio. Usa únicamente la sesión del solicitante, sin cliente service-role. Incluye actividades asignadas, competencias etiquetadas, cumplimiento y calificaciones registradas; no respuestas, correos, secretos ni pulsos privados. Excluye miembros inactivos y evidencias de actividades no asignadas. No suma autoevaluaciones de muestras. Escapa CSV y neutraliza prefijos de fórmulas; UTF-8 con BOM. Lecturas completas paginadas o error, sin exportación parcial.

No equivale a SSO, gestión de nómina, acreditación automática de competencias o autorización para cobrar asientos.

### Catálogo y lista de espera

Nueva tabla `addons`: 19 ofertas del catálogo aprobado, tipo mensual/pago único, llave de entitlement, límite mensual y estado. Tutor 100 consultas y Simulador 20 sesiones como metadatos; no se alteran cuotas existentes. Todas se inicializan `coming_soon` porque esta migración no demuestra disponibilidad ni habilita cobros. Solo cuentas activas leen el catálogo; el usuario no puede activar ofertas.

Nueva `addon_waitlist`: clave compuesta usuario/módulo, fecha de alta e índice por módulo. Registro idempotente, retiro de interés y recuperación tras recargar. Solo el usuario ve/gestiona su interés. El servidor y RLS rechazan altas en módulos activos o desconocidos. No captura correos adicionales, envía mensajes, cobra ni promete fecha. Los 16 módulos/rutas que la vista comercial muestra como próximos tienen botón; sin sesión/base válida permanece deshabilitado.

Esta entrega prepara el catálogo, pero NO migra `account_addons` ni `account_entitlements`, vincula precios Stripe, selecciona automáticamente la ruta de Pro o sustituye el control comercial existente. El conteo administrativo agregado de interés requiere una pantalla autorizada posterior; no se exponen listas de personas a otros usuarios.

## Migraciones y reproducción

Orden: esquema MVP completo → `20261007055422_enterprise_workspace_sandbox.sql` → `20261007071606_practice_progress_sandbox.sql` → `20261007072107_addon_waitlist_sandbox.sql`.

Las migraciones se crearon con Supabase CLI. Son aditivas y SOLO para la base de pruebas autorizada. Este checkout no contiene la migración inicial completa del MVP; el fixture de pruebas no sustituye el esquema real. No ejecutar `db push` contra un proyecto vinculado sin verificar explícitamente el destino.

Activar en sandbox: `CODEZERO_ENVIRONMENT=sandbox`, `CODEZERO_WORKSPACE_SANDBOX=1`, `CODEZERO_SANDBOX_PROJECT_REF` del proyecto separado (o `local`), URL/credenciales de ese entorno y flags `CODEZERO_PRACTICE_PREVIEW=1`, `CODEZERO_MODULAR_PREVIEW=1`. La guarda bloquea el ref productivo conocido y `VERCEL_ENV=production`. Para Python/SQL seguir la guía `BROWSER_CODE_RUNTIME.md`; no cambiar su aislamiento de hostname.

Comprobaciones locales:

```powershell
npm test
npm run test:database
npm --prefix sandbox-runtime test
npm --prefix sandbox-runtime run test:browser
```

## Validación de esta entrega

- 101 pruebas unitarias del proyecto, más cuatro del motor: 105 en conjunto.
- 33 comprobaciones PostgreSQL reales mediante PGlite: 20 Enterprise/compatibilidad y 13 progreso/catálogo/lista de espera. Cobertura de IDOR, suspensión, anonimato, conflicto de revisión, duplicados, retiro, módulos activos/desconocidos y límites. PGlite usa PostgreSQL 18; el proyecto productivo declara PostgreSQL 17.11. No se afirma validación en 17 ni Supabase Auth/PostgREST real.
- Build Next.js y TypeScript aprobados con valores ficticios de revisión.
- Suite Chromium real: 13 grupos, incluyendo previews anónimas sin guardado/lista de espera habilitados, Python/SQLite, errores, cancelación, timeouts, aislamiento, reinicio y móvil. No verifica login/recuperación del progreso mediante Auth real.
- Semgrep: 13 archivos de aplicación, seis reglas, cero hallazgos. Escaneo de secretos sin hallazgos; sin nuevas exclusiones.
- 0 despliegues, 0 correos enviados, 0 cambios en Stripe Live, producción o cuotas.

## Riesgos y paso bloqueado

La conexión Supabase solo muestra `codezero` productivo y ninguna rama de pruebas. Este entorno no dispone de Docker/Podman. Por ello no se aplicaron estas migraciones remotamente ni se pudo validar Auth → API → PostgREST → persistencia real, invitaciones/SMTP, recarga entre sesiones ni exportación con cuentas reales de distintos roles.

Se necesita un Supabase de pruebas separado, conectado y con esquema MVP preparado. No compartir claves por chat: usar conexión/configuración de secretos del entorno. Esta es la dependencia para continuar validación integral; la autorización de migraciones/RLS de pruebas ya existe. Crear infraestructura con costo requeriría aprobar ese costo, no se creó automáticamente.

Antes de producción: validar lo anterior en PostgreSQL 17/Supabase real, revisión editorial de muestras/cursos, migración compatible de derechos y facturación en Stripe Test, política del impago de factura compartida, Tutor contextual/budget, certificado verificable, memoria del editor (sin límite duro de RAM), hosting separado y otros navegadores/teléfono. Publicación, Live y cuotas mantienen aprobación específica pendiente. Despliegues programados siguen pausados.

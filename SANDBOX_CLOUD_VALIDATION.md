# CodeZero Sandbox: validación real

## Entorno y alcance autorizado

El 7 de octubre de 2026 Isaac confirmó crear un proyecto separado en la organización codezero, con costo mensual reportado de 0. Proyecto creado y activo: `sdvwkrosdnlacyhnuxwo`, región `us-east-1`, PostgreSQL 17.11. Es un proyecto independiente; no una rama vinculada que se pueda fusionar con producción.

Se recuperaron únicamente definiciones del esquema público del proyecto actual mediante consultas de metadatos: 27 tablas, una vista invocadora, dos enums, cinco funciones existentes, restricciones, índices, permisos y políticas. No se copiaron alumnos, contraseñas, sesiones, contenido, precios de Stripe, suscripciones, cobros ni cuotas utilizadas.

El esquema inicial no estaba completo en el repositorio. `supabase/sandbox/source_schema.sql` conserva esa estructura y sus ACL para una base vacía. Conserva las cinco funciones SECURITY DEFINER del esquema existente, sin agregar nuevas funciones privilegiadas. Es un bootstrap de pruebas, no una migración destinada a producción.

## Orden aplicado

1. Bootstrap `source_schema_only_bootstrap` desde `supabase/sandbox/source_schema.sql`.
2. `20261007055422_enterprise_workspace_sandbox.sql`.
3. `20261007071606_practice_progress_sandbox.sql`.
4. `20261007072107_addon_waitlist_sandbox.sql`.
5. `20261007130125_workspace_sandbox_foreign_key_indexes.sql`.
6. `20261007130913_private_practice_conflict_response.sql`.

Las seis operaciones están registradas en el historial remoto del sandbox. El servicio asignó versiones remotas distintas de los nombres locales. No ejecutar `db push` contra este proyecto sin reconciliar primero ese historial: la carpeta también contiene migraciones históricas que ya están incorporadas al bootstrap.

La quinta operación cubre ocho claves foráneas de equipos que el asesor de rendimiento señaló. La revisión posterior ya no reportó claves foráneas sin índice. Los índices sin uso en una base recién creada no se eliminaron.

La sexta corrige un defecto encontrado con PostgREST real: usar `40001` para una revisión desactualizada del progreso provocaba reintentos y timeouts. Ahora la función devuelve `PT409`, y Next.js responde HTTP 409 con indicación de recargar. Se preserva la revisión y el bloqueo atómico por usuario. La migración original ya aplicada conserva su contenido; una migración adicional cambia únicamente la función. Referencia oficial: https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b . No había procesos de esa RPC activos al revisar la limpieza.

## Datos sintéticos

Se crearon ocho cuentas `@codezero.example.test`, dos empresas ficticias y una jerarquía dueño → manager → supervisor → empleado, además de un empleado en otra rama. Hay un curso, bloque, lección, examen y ejercicio ficticios. Se registró un intento incorrecto sintético para probar el contexto del Tutor.

Las cuentas se aprovisionaron por SQL exclusivamente en esta base autorizada; el trigger existente creó sus perfiles y registros de uso. El inicio de sesión por contraseña y la consulta de usuario sí se realizaron contra Supabase Auth real. Esto no valida el alta pública, el envío de correos ni la recuperación de contraseña. Contraseñas, claves y sesiones de prueba permanecen fuera del repositorio y de Notion.

Inventario comprobado: 39 tablas públicas, una privada, RLS habilitado en todas; 19 módulos Próximamente, ocho usuarios sintéticos, cero filas en account_addons y cero eventos de Stripe.

## Comprobaciones reproducibles

`scripts/sandbox-cloud-check.py` usa Auth y PostgREST reales: permisos de los ocho roles, perfiles e intentos privados, preferencias, progreso con revisión, lista de espera y denegación de RPC administrativas al cliente. Está fijado al proyecto autorizado y obtiene credenciales de archivos externos.

```bash
CODEZERO_SANDBOX_API_KEY_FILE=/ruta/privada/api-key \
CODEZERO_SANDBOX_PASSWORD_FILE=/ruta/privada/password.json \
python scripts/sandbox-cloud-check.py
```

El segundo archivo contiene un objeto JSON con la propiedad `password` y una contraseña de las cuentas sintéticas. No guardar esos archivos en git ni compartirlos en el chat. Las pruebas de red fallan si la conexión tarda demasiado; no reintentan automáticamente escrituras, que podrían haberse confirmado antes de un timeout.

`supabase/sandbox/validate_synthetic.sql` comprobó diez casos en PostgreSQL 17.11: visibilidad del empleado, RPC administrativas bloqueadas, rechazo atómico de ciclos, diploma incompleto rechazado, emisión idempotente cuando el bloque cumple, revocación inmediata del equipo, conservación del diploma propio y restricciones para cuentas suspendidas. Todo se revierte con ROLLBACK; las calificaciones y diplomas de esa prueba no quedan como progreso real.

`scripts/sandbox-app-check.py` inicia Next.js local con el sandbox y una sesión Auth real. Verifica el contexto del Tutor, rechazo de identidad enviada y de origen externo, falta de sesión y alta/retiro de interés. No usa clave administrativa, proveedor IA ni Stripe. La primera comprobación manual produjo HTTP 200 con la lección autorizada y el intento incorrecto propio; el intento de enviar identidad adicional produjo HTTP 400.

Auth/PostgREST: 28 comprobaciones cloud aprobadas, incluyendo el conflicto real HTTP 409 tras la corrección. PostgreSQL 17.11: diez comprobaciones adicionales aprobadas.

Next.js con sesión real: ocho comprobaciones aprobadas para contexto propio, rechazo de identidad adicional, autenticación, origen, alta/retiro de interés, guardado de progreso y respuesta HTTP 409. Total: 46 comprobaciones contra el sandbox real; no equivalen a 46 recorridos de navegador ni a validación comercial.

Regresión local: 115 pruebas unitarias y 33 comprobaciones de base de datos en PGlite aprobadas; TypeScript sin errores, seis reglas de Semgrep sobre 129 archivos con cero hallazgos y escaneo completo de secretos con cero alertas. Las pruebas PGlite complementan las pruebas cloud; no se contabilizan como Auth ni PostgreSQL 17 hospedados.

Los recorridos de navegador y administración no se declaran completos. La API contextual tardó 61–67 segundos en este entorno de validación con proxy y múltiples lecturas remotas; no se aisló la causa ni se hizo una prueba de carga. Medir y mejorar latencia en el entorno de despliegue de pruebas es un requisito antes del lanzamiento.

## Configuración de la aplicación de pruebas

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://sdvwkrosdnlacyhnuxwo.supabase.co
CODEZERO_SANDBOX_PROJECT_REF=sdvwkrosdnlacyhnuxwo
CODEZERO_ENVIRONMENT=sandbox
CODEZERO_WORKSPACE_SANDBOX=1
CODEZERO_PRACTICE_PREVIEW=1
CODEZERO_MODULAR_PREVIEW=1
CODEZERO_TUTOR_PREVIEW=1
```

Completar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con la clave pública del proyecto y `NEXT_PUBLIC_APP_URL` con el origen exacto de la aplicación de pruebas. Las guardas siguen bloqueando el proyecto productivo y `VERCEL_ENV=production`.

## Pendientes concretos

- Configurar `SUPABASE_SECRET_KEY` exclusivamente del sandbox en el entorno seguro de pruebas. La integración disponible entrega claves públicas, no la clave administrativa. Sin ella no se puede cerrar el recorrido Next.js de invitaciones, cambios de roles, asignación y emisión de diplomas; sus funciones y permisos sí se verificaron en PostgreSQL real. No se generó una clave privilegiada mediante SQL ni se agregaron atajos a RLS.
- Verificar en navegador los flujos administrativos completos cuando esté esa configuración, incluyendo ingreso por la pantalla de la plataforma, reporte y revocación.
- La revisión actual de seguridad reporta protección de contraseñas filtradas desactivada en Auth. Consultar disponibilidad del plan y habilitarla antes de un entorno abierto: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . La primera revisión devolvió cero avisos; la revisión posterior añadió esta advertencia. No se considera resuelta.
- Tutor genera solamente contexto; integración del proveedor, presupuesto/consumo atómico y calidad de respuestas siguen pendientes. Todos los módulos del catálogo de pruebas permanecen Próximamente.
- Stripe Live, producción, cambios de cuotas y despliegues productivos siguen excluidos. La automatización de despliegues continúa pausada. Crear el proyecto Supabase no consume un despliegue Vercel.

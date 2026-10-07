# Enterprise, preferencias y diplomas · sandbox autorizado

Isaac aprobó las migraciones, RLS e invitaciones de prueba del plan el 6 octubre
2026 a las 23:51 CDMX. La aprobación cubre únicamente pruebas. No habilita
producción, Stripe Live, cambios de cuotas ni los despliegues pausados.

## Entorno comprobado

La conexión Supabase lista un único proyecto `codezero`, correspondiente al
actual proyecto de producción, y ninguna rama de desarrollo. No se creó ninguna
rama o proyecto de pago y no se escribió en ese proyecto. Solo se consultó el
esquema existente para comprobar nombres, tipos y estados publicados.

El entorno ejecutado es PostgreSQL local mediante PGlite 0.5.8, dependencia de
desarrollo fijada. No guarda datos de alumnos reales. Usa roles `anon`,
`authenticated` y `service_role`, usuarios sintéticos y una implementación de
`auth.uid()` para probar RLS. PostgreSQL local es **18.3**; Supabase auditado es
**17.11**. Estas comprobaciones no sustituyen pruebas en Supabase 17/GoTrue.

Intento de iniciar Supabase local: bloqueado porque la sesión no contiene Docker
ni Podman. No se solicitó una escalación ni se cambió a producción. El config de
pruebas está preparado para PostgreSQL 17 y SMTP local. Las migraciones
automáticas están desactivadas: esta copia del repo no contiene el esquema
original completo del MVP y debe restaurarse ese esquema, sin datos reales,
antes de aplicar la migración aditiva a un Supabase nuevo.

## Implementación

Migración creada con CLI Supabase 2.120.0:
`supabase/migrations/20261007055422_enterprise_workspace_sandbox.sql`.

Nueve tablas públicas nuevas (organizaciones, membresías, invitaciones,
asignaciones, evidencia, errores, auditoría, preferencias y diplomas) y una
tabla de autorización privada. Todas con RLS; sin acceso `anon`. Preferencias
permiten SELECT/INSERT/UPDATE propias y WITH CHECK impide cambiar propietario.
Diplomas y datos de equipos son de solo lectura para clientes; los cambios
sensibles pasan por RPC server-only con sesión verificada.

No se modificaron políticas, cuotas ni tablas existentes. Las RPC son SECURITY
INVOKER y EXECUTE está revocado para PUBLIC/anon/authenticated. La jerarquía
se materializa en una tabla de schema privado no expuesto, consultable por el
usuario solo para sus permisos. No se añadieron funciones SECURITY DEFINER.
Cambiar membresías exige bloqueo de organización, validación de ciclos,
FK de jefe dentro de la misma empresa, protección del último owner y
reconstrucción de permisos dentro de la misma transacción.

Owner/admin ven y administran el organigrama de su empresa, incluidos miembros
suspendidos para reactivarlos. Manager ve su aprendizaje y descendientes activos;
supervisor, su aprendizaje y reportes directos activos; colaborador, solo el propio.
Suspensión retira acceso al aprendizaje inmediatamente. Perfil global inactivo
también pierde acceso a los datos de equipos. Admin de empresa no puede alterar
owner. Roles de empresa no modifican roles globales de CodeZero.

Rutas nuevas solo para sandbox: `/teams`, `/teams/[organizationId]`, `/teams/join`,
`/api/teams/manage`, `/api/teams/accept`, `/api/teams/password`, `/auth/invite`,
`/api/preferences`, `/api/diplomas/issue`. Sesión y origen se comprueban antes de
cualquier escritura; no se confía en `x-forwarded-host`. El perfil enlaza Mis equipos.
RLS se aplica al leer todas las gráficas y miembros; la interfaz no sustituye RLS.

Una bandera sola no activa esto. Deben coincidir:

```text
CODEZERO_WORKSPACE_SANDBOX=1
CODEZERO_ENVIRONMENT=sandbox
CODEZERO_SANDBOX_PROJECT_REF=local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
```

Las claves de cliente/servidor deben pertenecer a ese mismo entorno; no se incluye
ninguna clave. También se admite un ref remoto de pruebas que coincida exactamente
con su host HTTPS. El ref de producción conocido se rechaza aun con todas las
banderas activadas. Por defecto los endpoints nuevos son 404.

## Preferencias, diplomas y métricas

Preferencias cloud se cargan en servidor para el usuario verificado. El perfil
las escribe con su sesión y RLS, conserva copia local y aplica color/tema mediante
eventos limitados a su identidad. Fuera del sandbox se conserva el comportamiento
local anterior. Todavía deben comprobarse cambios de cuenta, varios dispositivos,
contraste y recuperación de conexión con sesiones reales.

Diploma: se registra tras finalizar lección, aprobar examen o aprobar proyecto,
solo si todos los requisitos publicados del bloque están cumplidos. Efecto
opcional: un fallo no revierte una evaluación ya guardada. Botón privado permite
reintentar. GET no escribe el diploma. La RPC serializa emisión por usuario/bloque,
guarda identidad privada, nombre, título, fecha y snapshot de requisitos y reutiliza
el diploma existente. No requiere plan vigente para reconsultarlo. No es verificación
pública ni reemplaza el certificado comercial de pago. La emisión falla si hay
varios bloques publicados con el mismo número, en lugar de elegir uno arbitrario.

Asignaciones usan actividades publicadas de lecciones, exámenes o proyectos;
no desbloquean contenido ni cambian el plan. Actualizar evidencia lee progreso y
resultados guardados, no acepta calificaciones enviadas por empleado o manager.
Gráficas: actividades únicas completadas / asignadas. Se muestran agrupaciones
por competencia a practicar, no un diagnóstico automático de dominio laboral.
Errores: evaluación no aprobada o proyecto por revisar, sin respuestas completas,
prompts o secretos. Retención local 90 días, limpieza al actualizar evidencia.
Paginación evita truncar silenciosamente el denominador por límites de API;
errores de carga impiden presentar métricas parciales. Lista de errores e
invitaciones limita los registros mostrados a los 50 más recientes.

## Invitaciones y credenciales privadas

Solo se aceptan destinatarios sintéticos `@codezero.example.test`. Preparar una
invitación no crea pertenencia, no otorga derechos y por defecto no envía correo.
Caduca en siete días; aceptación exige correo verificado coincidente, creador
todavía autorizado y pertenencia única. Repetir aceptación del mismo usuario
es idempotente; otro usuario no puede reutilizarla. El nombre de equipo se
introduce al aceptar, nunca se usa como privilegio.

`CODEZERO_TEST_MAIL_CAPTURE=1` admite solicitud de invitación de Auth únicamente
cuando el ref es `local`, para capturar correo en SMTP local. No se habilita
envío desde un proyecto hospedado. La plantilla usa TokenHash para SSR; el
callback consume el token como invite, limpia la URL de redirección y aplica
no-referrer/no-store. Una vez confirmado, el empleado acepta el equipo y puede
configurar su contraseña privada de al menos 12 caracteres. No se devuelve una
contraseña ni token al manager. Las cuentas existentes pueden iniciar sesión y
abrir incorporación sin duplicar Auth.

**No se ejecutó** el flujo GoTrue/SMTP/contraseña; solo quedó integrado en código.
Se requiere verificar perfil inicial del Auth trigger del MVP, allowlist de
redirect, entrega capturada, token caducado/reusado, cookies, aceptación,
contraseña y cierre de sesión en el Supabase de pruebas antes de darlo por cerrado.
No se enviaron invitaciones ni se crearon cuentas remotas.

## Validación y pendientes

88 pruebas unitarias aprobadas; 19 comprobaciones reales en PostgreSQL local de
RLS, aislamiento, revocación, ciclos, permisos de escritura, invitaciones y
diplomas. Compilación Next.js/TypeScript aprobada con configuración ficticia.
Semgrep: 111 archivos, seis reglas, cero hallazgos; revisión adicional explícita
de cuatro archivos de integración, también sin hallazgos. Escaneo de secretos:
cero hallazgos tras eliminar campos opcionales no usados del config generado.
No se ignoraron esos hallazgos: eran placeholders/booleanos sin credenciales.

HTTP: siete rutas de datos/Auth/equipos devuelven 404 con el ref de producción
aunque las banderas estén activadas; POST sin sesión devuelve 401 en sandbox
local; `/teams` redirige a login; callback incompleto devuelve 400; origen
externo con host reenviado falsificado devuelve 403. Preview modular mantiene
404/200 según su bandera. Diploma anónimo redirige a login y niveles fuera
de 1–15 devuelven 404. Usar NEXT_PUBLIC_APP_URL del mismo entorno para origen
canónico y redirects; no reutilizar la URL de producción.

Falta Supabase Auth/SMTP/PostgREST E2E, PostgreSQL 17, navegador/móvil/impresión
y comprobación de permisos al cambiar roles desde sesiones reales. La UI para
asignación de actividades usa IDs de catálogo para esta revisión de pruebas;
antes de lanzamiento debe sustituirse por selección de contenido y validarse
la experiencia para managers.

Integridad ante IA externa mantiene el diseño aprobado pendiente de integrar:
evidencia del proceso, variantes y revisión práctica. Esta fase no modifica notas
ni cuotas ni afirma detectar fraude. El modelo comercial modular tampoco se
activa por crear equipos o diplomas.

0 despliegues, 0 cambios de producción/Stripe Live, 0 infraestructura de pago nueva.
El parche de esta fase es incremental sobre CodeZero_user_experience_enterprise.patch
y los parches anteriores; comprobar `git apply --check` antes de aplicarlo.

## Fuentes y revisión

- Supabase changelog descargado; revisado aviso 17.11 de septiembre sobre extensiones
  y operadores: esta migración no usa esas extensiones u operadores personalizados.
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- Guías locales Next.js server/client y skills Supabase/Postgres y React.

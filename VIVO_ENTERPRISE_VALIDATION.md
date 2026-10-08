# Garciloga · C · Vivo y equipos Enterprise

Revisión del 8 de octubre de 2026. Una única entrega en Git. Se conservan Stripe, precios de los planes base, cuotas y lógica de lecciones, ejercicios y exámenes. Las referencias comerciales de mentoría y equipos cambian según la instrucción ampliada; ver `GARCILOGA_RELEASE.md`.

## Implementación

Historia verificada: sesión validada → menú según membresía activa → página/API → lectura con RLS y funciones restringidas → métricas y acciones dentro del alcance autorizado.

- Paleta, fuentes y radios centralizados en `lib/vivo-design.ts`; CSS compartido en `app/vivo.css`, incluido el branding de la imagen social. Outfit 600/700 y Plus Jakarta Sans 400/500/600/700 se sirven con Fontsource, siguiendo la convención existente. Sin degradados, emojis ni librerías de gráficas nuevas.
- Sidebar común: grupos, tareas y facturación según membresía activa y puesto. Free/Starter/Pro sin organización conservan Inicio y Ayuda; las URL de equipo redirigen a Inicio y la API responde 403.
- Inicio de líderes en Personas; la ruta personal sigue accesible con `?view=learning`. Colaboradores y cuentas individuales mantienen el panel de alumno, su contenido y sus derechos actuales.
- Personas, organigrama, avance, competencias, asignación, invitaciones, puestos/permisos, catálogo publicado, historial y ficha personal. La API de personas devuelve solo el alcance autorizado.
- Fuera del alcance, el organigrama muestra únicamente nombre, puesto y jerarquía. No expone calificaciones, progreso, alertas ni tareas de esas personas.
- Asignaciones de Supervisor/Gerente validadas nuevamente en SQL, usando el alcance recursivo materializado existente. La identidad del actor se obtiene de Auth verificado, nunca del formulario o metadatos del usuario.
- Edición de puesto de trabajo opcional, rol, jefe y acceso activo; restricciones de ciclos y último Dueño conservadas. El puesto vacío muestra el nombre del rol.
- El operador global Dueño puede crear la primera organización desde `/admin`. Esta función existente se trasladó desde `/teams` para que una cuenta sin organización no acceda al menú de equipo.
- Precargas innecesarias retiradas en sidebar, fichas y navegación personal para evitar solicitudes pendientes al cambiar de cuenta. Auth continúa compartido por render.

## Datos y estados vacíos

Progreso de equipo: actividades asignadas completadas / total asignado. Competencias: promedio de calificaciones válidas de evidencias asociadas a las asignaciones. Alertas: solo actividades asignadas que aún no están completas. El nivel procede de los exámenes aprobados y niveles que utiliza el panel existente.

Sin personas a cargo: “Aún no hay personas a tu cargo.”; únicamente Dueño/Administrador recibe “Invita a tu primera persona”. Sin actividades: “Sin tareas asignadas”. Sin calificaciones: “Aún no hay resultados”. Los datos ausentes se conservan como desconocidos, sin generar calificaciones cero ni progreso ficticio.

**Dependencias de datos comunicadas antes de implementar:** no hay un catálogo de competencias vinculado a las calificaciones del alumno sin organización; se conserva su progreso real y se muestra ausencia de resultados en competencias. No existe una cuenta de facturación propia de organización: Dueño ve el aviso y el acceso a su suscripción personal. No se atribuyen cargos personales a la empresa. C · Vivo aplica una paleta fija y conserva las preferencias anteriores de apariencia guardadas.

## SQL aplicado

Archivo: `supabase/migrations/20261007222517_vivo_enterprise_workspace.sql`.

| Proyecto | Versión remota | Resultado |
|---|---|---|
| Sandbox `sdvwkrosdnlacyhnuxwo` | `20261007224307` | Aplicada |
| Producción `kwfzhpapvpdatdfwhouf` | `20261007224503` | Aplicada |

El conector asigna su propio timestamp; ambos historiales registran `vivo_enterprise_workspace`. No repetir la migración ni ejecutar `db push` indiscriminadamente sin reconciliar el historial.

Cambios: columna opcional `organization_memberships.job_title` (texto, máximo 120 caracteres), `update_workspace_member_details`, `workspace_directory`, `workspace_current_levels` y ampliación controlada de `assign_workspace_activity`. Son funciones `security invoker` con `search_path` vacío. Las nuevas RPC administrativas están revocadas para PUBLIC/anon/authenticated y concedidas exclusivamente a service_role, después de validar actor y organización en el servidor.

**Políticas RLS nuevas: ninguna.** Se conservan y comprobaron `membership_read`, `assignment_read`, `evidence_read`, `error_read`, `organization_read`, `invitation_read`, `audit_read` y `access_own`. El alcance proviene de `codezero_private.organization_access`, reconstruido mediante jerarquía recursiva y validación transaccional. No se relajaron políticas ni escrituras de cliente.

Security Advisor: ningún cambio abre datos de equipo. Persisten las observaciones previas de contraseñas filtradas desactivadas y dos tablas exclusivamente backend sin políticas; Performance Advisor conserva 42 índices sin uso observado. No se eliminaron índices sin una carga representativa.

## Evidencia de pruebas

| Comprobación | Evidencia |
|---|---|
| TypeScript y compilación de producción | Aprobados |
| Pruebas unitarias | 171 aprobadas |
| Integración PostgreSQL local de equipos | 26 comprobaciones aprobadas |
| Traducciones ES/EN/PT/FR | Auditoría sin textos nuevos faltantes |
| Navegadores | Matriz Chromium/Firefox/WebKit configurada en CI; ejecución local bloqueada por descarga corrupta de motores |
| Accesibilidad automatizada | Suite axe WCAG AA preparada; resultado de esta entrega pendiente de CI |
| Responsive | Suite preparada a 390 px por plan y puesto y 320/768/1440 px; resultado de esta entrega pendiente de CI |
| Supabase cloud de pruebas | RLS real sobre ocho cuentas sintéticas existentes, transacción revertida |
| Sesiones Auth reales de alumno/operador | Pendientes; credenciales privadas no disponibles en esta ejecución |
| Lectores de pantalla físicos | Pendientes; no hay NVDA/JAWS/VoiceOver ni estación física disponible |
| Restauración cloud completa | Pendiente; no se dispone de conexión/contraseña, copia externa y destino de restauración |

La prueba cloud confirmó filas visibles por puesto, incluyendo la propia: Dueño 8, Administrador 8, Gerente 1: 4, Gerente 2: 2, Supervisor 2, Colaboradores 1 cada uno. El fixture y sus cambios se revierten con ROLLBACK; no quedaron nuevas organizaciones ni evidencias. Se puede repetir con `supabase/sandbox/validate_vivo_scope.sql` únicamente en el sandbox autorizado.

Las pruebas de navegador usan Auth/PostgREST simulados; no se presentan como inicios de sesión reales. Comprueban además idiomas entre cuentas/sesiones, respuesta HTTP exitosa del panel, recorrido de soporte y contratos de lección/examen preservados. El procedimiento de recuperación completo sigue en `DISASTER_RECOVERY.md`: Free requiere exportaciones y copias externas; reactivar un proyecto pausado no acredita restauración de un respaldo. No se contrató PITR ni se cambió de plan.

## Cómo probar cada puesto

Crear una organización aislada con esta jerarquía: Dueño → Administrador, Gerente 1 y Gerente 2; Gerente 1 → Supervisor y Colaborador 3; Supervisor → Colaborador 1; Gerente 2 → Colaborador 2. Usar cuentas Auth distintas, perfiles activos, y asignaciones/evidencias identificables por persona. No usar “Ver como” ni compartir contraseñas.

| Cuenta | Personas en el panel, excluyendo al propio usuario | Menú y acceso esperado |
|---|---|---|
| Free/Starter/Pro sin organización | Su propio panel | YO APRENDO y AYUDA; sin Mis tareas ni equipo/empresa; URL restringida → Inicio |
| Dueño | Otras 7 | Todos los grupos y Facturación |
| Administrador | Otras 7 | Todos los grupos, sin Facturación; URL de facturación → Inicio |
| Gerente 1 | Supervisor, Colaborador 1 y Colaborador 3 | YO APRENDO, MI EQUIPO y AYUDA; sin MI EMPRESA |
| Gerente 2 | Colaborador 2 | Mismos grupos; no puede leer/asignar la otra rama |
| Supervisor | Colaborador 1 | Mismos grupos; sin avance indirecto ni otra rama |
| Colaborador 1/2/3 | Solo su propio progreso y competencias | YO APRENDO y AYUDA, Mis tareas y lugar en organigrama; sin panel de equipo |

Con la sesión del Supervisor, consultar `/api/teams/{organizationId}/people`: solo su fila y su reporte directo. Consultar PostgREST `learning_evidence`, `learning_errors`, `learning_assignments` y `organization_memberships`: RLS debe dar el mismo alcance. Intentar asignar a Colaborador 2 mediante POST directo a `/api/teams/manage`: la RPC rechaza la operación, no inserta la tarea y el flujo informa el fallo.

Dueño/Administrador: preparar una invitación, abrir el enlace de incorporación con el correo invitado y verificar pertenencia; editar puesto y jefatura; comprobar rechazo de ciclos y de eliminar al último Dueño. No se declara entrega por correo: el flujo existente prepara un enlace para compartir. Gerente/Supervisor: asignar actividad publicada dentro del alcance; comprobar que no desbloquea contenido fuera del plan. Completar actividad con la cuenta del alumno y actualizar evidencias para contrastar porcentaje, pendientes y alertas.

Repetición automatizada: `npm test`, `node scripts/workspace-db-check.mjs`, `node scripts/localization-audit.mjs` y `node scripts/localization-browser-check.mjs` con `CODEZERO_BROWSER_ENGINE=chromium|firefox|webkit`. CI incluye la matriz de los tres motores y la comprobación PostgreSQL de equipos.

Prueba física pendiente: Windows + NVDA o macOS + VoiceOver, cuentas separadas por puesto, navegar encabezados/regiones/enlaces, activar y cerrar menú con teclado, leer barras con sus porcentajes y etiquetas, recorrer la tabla de permisos, provocar y corregir errores de formulario, enviar respuesta de soporte y verificar el cierre. Registrar sistema, lector/versión, navegador, cuenta, pasos y resultado; axe no sustituye esta comprobación.

## Archivos tocados

- `.github/workflows/ci.yml`
- `VIVO_ENTERPRISE_VALIDATION.md`
- `app/(public)/layout.tsx`
- `app/(public)/social/codezero/route.tsx`
- `app/admin/page.tsx`
- `app/api/teams/[organizationId]/people/route.ts`
- `app/api/teams/manage/route.ts`
- `app/competencies/page.tsx`
- `app/components/appearance-provider.tsx`
- `app/components/appearance-settings.tsx`
- `app/components/enterprise/organigram.tsx`
- `app/components/enterprise/permissions-table.tsx`
- `app/components/enterprise/person-card.tsx`
- `app/components/learning-navigation.tsx`
- `app/components/line-icon.tsx`
- `app/components/vivo-shell.tsx`
- `app/dashboard/page.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/profile/page.tsx`
- `app/teams/[organizationId]/[section]/page.tsx`
- `app/teams/[organizationId]/error.tsx`
- `app/teams/[organizationId]/page.tsx`
- `app/teams/[organizationId]/person/[userId]/page.tsx`
- `app/teams/page.tsx`
- `app/vivo.css`
- `lib/localization/editorial-overrides.json`
- `lib/localization/en-server.json`
- `lib/localization/en-ui.json`
- `lib/localization/fr-server.json`
- `lib/localization/fr-ui.json`
- `lib/localization/pt-server.json`
- `lib/localization/pt-ui.json`
- `lib/organization-metrics.ts`
- `lib/organization-server.ts`
- `lib/team-report.ts`
- `lib/vivo-design.ts`
- `package-lock.json`
- `package.json`
- `scripts/localization-browser-check.mjs`
- `scripts/workspace-db-check.mjs`
- `supabase/migrations/20261007222517_vivo_enterprise_workspace.sql`
- `supabase/sandbox/validate_vivo_scope.sql`
- `tests/organization-metrics.test.mjs`

# CodeZero · personalización, diplomas y Enterprise obligatorios

## Actualización: pruebas autorizadas

Isaac autorizó migraciones, RLS e invitaciones solo en pruebas el 6 octubre a las
23:51 CDMX. La capa de datos está implementada y validada en PostgreSQL local;
preferencias persistentes, diplomas con snapshot y UI/API de organización están
preparados. Auth/SMTP de punta a punta sigue pendiente de un Supabase de pruebas
ejecutable. Producción, Stripe Live y cuotas permanecen fuera de esta aprobación.
Estado y límites actuales: `WORKSPACE_SANDBOX_IMPLEMENTATION.md`. El resto de este
documento describe la entrega inicial anterior a esa aprobación.

Decisión de Isaac del 7 octubre 2026 UTC (6 octubre CDMX): estos cuatro frentes
son requisitos del lanzamiento, no módulos Próximamente. Enterprise pasa a
desarrollo; la autorización previa de cambios de Auth, RLS, cuotas, producción
y Stripe Live sigue siendo necesaria. Esta entrega es código local revisable,
sin despliegues ni cambios en esos servicios. No está terminada la plataforma.

## Implementado en la rama

- Perfil: modo claro, oscuro o del dispositivo; cuatro colores de énfasis.
  Ajuste versionado por identidad verificada y navegador. No se mezcla con
  visitantes u otras cuentas. Cambios de pantalla y almacenamiento se escuchan
  con limpieza de eventos. Datos inválidos usan valores seguros.
- Preferencias locales, no sincronizadas entre dispositivos. Posible destello
  del tema inicial antes de hidratación. Lectura de sesión en root layout hace
  dinámicas páginas públicas y agrega una consulta; medir antes del lanzamiento.
  No se cambió configuración de Auth. Colores inline antiguos y contraste en
  todos los estados requieren revisión visual; no declarar completa esa revisión.
- `/diplomas/1` hasta `/diplomas/15`: constancia privada imprimible (PDF mediante
  impresión del navegador). Identidad verificada; todas las lecciones publicadas,
  todos los exámenes del bloque y todos los proyectos publicados requeridos.
  Catálogo mínimo leído solo en servidor para evitar que filtros por plan oculten
  requisitos; evidencia propia consultada con RLS existente. Sin clave de servidor
  o ante cualquier error, no se emite. Sin contenido del curso ni respuestas en
  el documento. Nombre del perfil o denominación genérica, nunca correo.
- Enlace desde bloques con examen aprobado; el enlace no concede un diploma,
  la ruta comprueba requisitos nuevamente. Bloque significa nivel técnico 1–15;
  los ocho procesos de la maqueta CS no conceden diplomas por marcar casillas.
- Constancia calculada al consultar, sin folio ni fecha de emisión persistente.
  El certificado verificable comercial de $149 conserva su alcance independiente.
  Persistencia de diplomas y requisitos versionados deben hacerse antes de ofrecer
  conservación permanente: un cambio de currículo o retiro del acceso a evidencia
  puede impedir reconsultar la constancia actual.
- Motor de organigrama: rechaza miembros repetidos, jefaturas inexistentes,
  ciclos, roles inválidos, cruces de organización y acceso de miembros inactivos.
  No usa títulos de puestos ni `user_metadata` como permisos.
- `/internal/enterprise-lab`: por defecto 404; requiere flag
  `CODEZERO_ENTERPRISE_PREVIEW=1` y el control owner existente. Organigrama,
  selector de vista y barras de avance con datos explícitamente ficticios.
  No crea usuarios, invita empleados ni muestra datos de empresas reales.
  El selector demuestra la política; la seguridad real debe implementarse en
  servidor y RLS. Ocultar elementos en React nunca sustituye autorización.

## Roles de organización propuestos

Estos roles son independientes del rol global de administrador de CodeZero.

| Rol | Consulta de aprendizaje | Cambios de organigrama/invitaciones |
| --- | --- | --- |
| Owner de organización | Su organización | Sí |
| Admin de organización | Su organización | Sí |
| Manager | Propio y descendientes del organigrama | No |
| Supervisor | Propio y reportes directos | No |
| Colaborador | Propio | No |

Sin pertenencia activa: ningún acceso. Nunca ver otras organizaciones. Supervisor
no ve descendientes indirectos ni pares. Los permisos de cada consulta dependen
de sesión verificada y roster completo cargado desde base de datos, nunca de IDs
o roles enviados por el navegador. Una persona puede pertenecer a distintas
organizaciones sin obtener acceso transversal.

## Modelo de datos para revisión; no aplicado

| Tabla propuesta | Claves y restricciones | Lectura/escritura propuesta |
| --- | --- | --- |
| organizations | UUID, nombre, estado | Miembros activos leen; creación controlada en servidor |
| organization_memberships | PK organization_id/user_id; role, status, reports_to; FK compuesta jefe dentro de misma empresa | Roster visible según alcance; owner/admin modifican mediante servidor; no autoasignación |
| organization_invitations | Organización, email, rol aprobado, jefe, expiración, estado; aceptación única | Owner/admin mediante servidor; empleado acepta únicamente su invitación |
| learning_assignments | Organización, empleado, actividad, versión; unicidad; FK miembro | Lectura por jerarquía; asignación controlada; no duplicar denominadores |
| learning_evidence | Organización, miembro, actividad, competencia, rúbrica, resultado, versión, fecha; FK asignación | Ingestión por servidor tras evaluación; managers leen alcance autorizado |
| learning_errors | Organización, miembro, actividad, categoría, fecha; sin prompts, contraseñas ni respuestas completas | Lectura jerárquica; retención inicial propuesta 90 días, por aprobar |
| user_preferences | user_id PK, mode y accent con CHECK, updated_at | Cada usuario lee/escribe sus ajustes; sincroniza dispositivos |
| issued_block_diplomas | user_id, bloque, versión, snapshot requisitos, issued_at, identificador único | Emisión server tras validación; usuario consulta los propios; no cobro |

Todas las tablas expuestas deberán tener RLS habilitada antes de otorgar acceso.
Políticas SELECT/UPDATE WITH CHECK, grants y acceso de invitaciones requieren
revisión específica. Jerarquía se modifica de forma transaccional, validando ciclo,
empresa, actividad y rol del jefe; impedir escalada del último owner y registrar
auditoría de quién modificó roles. Bloquear endpoints de gestión hasta completar
esta autorización. No crear funciones SECURITY DEFINER para resolver errores.

Credenciales: invitaciones de Supabase desde servidor; cada persona configura
su contraseña privada en el flujo existente. No entregar contraseñas al manager
ni reutilizar una cuenta compartida. La invitación no da privilegios antes de
aceptarla. Usuarios existentes necesitan enlace de incorporación, no duplicar
Auth. Dominios de redirect, caducidad, aceptación concurrente y revocación se
prueban en sandbox antes de activar. No se enviaron invitaciones en esta entrega.

## Avance, competencias y errores

Avance = actividades asignadas únicas completadas / actividades asignadas únicas.
Sin asignaciones se muestra “Sin evidencia”, no 0% de competencia. Reintentos no
inflan progreso. El motor prueba este denominador; la maqueta usa dos actividades.
Competencias reales se sustentan en entregables evaluados con rúbrica, fecha y
evidencia; todavía no se conectó una rúbrica. No convertir afinidad vocacional en
competencia laboral. Mostrar historial y mejoras por competencia, filtros por
equipo y tendencias tras conectar datos autorizados. Errores son categorías de
aprendizaje, nunca una inferencia automática de fraude o sanción laboral.

## Integridad de las evaluaciones

No existe bloqueo absoluto de IA externa en una web. No afirmar que un detector
prueba fraude. No bloquear copiar/pegar ni añadir vigilancia de cámara o pantalla.
Diseño obligatorio: casos con variantes asignadas en servidor, evidencia de pasos,
justificación de decisiones y revisión práctica cuando sea necesaria. Tutor ofrece
pistas durante evaluación sin entregar soluciones finales. Las variantes y rúbricas
deben conservarse con el intento para reproducir la calificación.

Actualmente no se cambiaron endpoints de evaluación, notas, cuotas o el Tutor:
estos controles aún requieren integración y pruebas de accesibilidad, validación
server, reintentos, evidencias y revisión humana. Declaración de asistencia y
desarrollo de respuestas son más útiles que detección automática. Los diplomas
actuales certifican requisitos registrados, no ausencia demostrada de IA externa.

## Fases siguientes y criterios de cierre

1. Cerrar UI de personalización/diplomas: revisión visual claro/oscuro, teclado,
   móvil, impresión, perfil sin nombre y cambio de cuenta. Pruebas con sesiones
   reales en sandbox, usuarios incompletos/completos y bloque con proyecto.
2. Con autorización explícita, preparar sandbox de preferencias, diplomas y
   organización; implementar migraciones/RLS e invitaciones sin tocar producción.
   Probar aislamiento vía API directa, escalada, ciclos y revocación inmediata.
3. Conectar dashboard Enterprise, asignaciones, gráficas, rúbricas, errores y
   auditoría usando datos autorizados; evaluar conservación de diplomas.
4. Integrar evaluación práctica con evidencia y límites del Tutor en evaluación;
   comprobar flujos sin modificar cuotas sin permiso.
5. Preflight modular completo y aprobación independiente de producción/Stripe Live.

No se modificaron precios Enterprise, $99/asiento ni el producto Live histórico;
no se activaron cobros o checkout. No hay nuevos compromisos de fecha de lanzamiento.

## Fuentes revisadas

- https://supabase.com/docs/guides/auth/users (metadatos y usuarios/invitaciones).
- https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
- https://teaching.uic.edu/cate-teaching-guides/digital-learning/navigating-ai-strategic-foundations-for-your-course/
- Documentación local Next.js 16: server-and-client-boundary.md.

## Validación de esta entrega

84 pruebas aprobadas; compilación Next.js y TypeScript aprobadas con URL/clave
ficticias. Semgrep: 98 archivos, seis reglas, cero hallazgos. Escaneo de secretos:
cero potenciales secretos. HTTP anónimo: Enterprise 404 incluso con flag activado;
diploma válido redirige a login; niveles 0/16 devuelven 404. Preview modular sigue
404 desactivada/200 activada. Sin sesiones reales, invitaciones, E2E Supabase,
pruebas visuales de navegador o impresión. No se desplegó ni se activó Enterprise.

Entrega incremental: aplicar `CodeZero_user_experience_enterprise.patch` después
del parche fase 1 versión 2 sobre el checkout que ya contiene el laboratorio PR6.
El parche conserva cambios anteriores y no contiene credenciales ni dependencias
nuevas. Verificar `git apply --check` antes de aplicar en el repositorio real.

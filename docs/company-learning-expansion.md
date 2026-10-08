# Ampliación autorizada · 8 de octubre de 2026

Isaac autorizó todo el backlog descrito y priorizó piloto multilingüe y práctica ejecutable. Amplió compañías, invitaciones con cupo exacto, permisos delegables, equipos internos, membresías múltiples y marca compartida. La entrega se prepara en sandbox/company-learning-expansion; producción vigente 8cab482 se conserva hasta completar comprobaciones.

## Reutilización y reglas

organizations representa una compañía; organization_memberships conserva identidad/rol único por compañía y permite varias compañías por usuario. El selector existente cambia el contexto. Equipos internos y concesiones son extensiones, no otra identidad ni otro registro de usuarios. No se incorpora al operador por crear el contrato: se incorpora a su responsable verificado.

Cupo: miembros activos únicos por compañía + invitaciones vigentes reservadas, sin doble contar correos ya miembros. Un usuario en varios equipos internos usa un asiento en esa compañía; en dos compañías usa uno en cada contrato. Invitación, aceptación y reactivación se serializan por compañía. Revocar/expirar libera reserva. Bajar el cupo por debajo de ocupación se rechaza, sin expulsiones automáticas. Solo administración de plataforma registra cupo, referencia y vigencia del contrato; los administradores de compañía no pueden aumentarlo por API. No se inventa cupo a partir de un precio comercial.

Visibilidad: pertenece a compañía antes de cualquier lectura empresarial. Dueño/Admin de compañía ven su compañía. Los demás conservan alcance jerárquico, limitado por equipos internos cuando están asignados; concesiones explícitas permiten a una persona supervisar varios equipos sin conceder reciprocidad entre ellos. Directorios respetan el mismo alcance. El operador no aparece si no es miembro.

Marca: logo/imagen privada de compañía junto a Garciloga siempre visible. No se aceptan HTML/SVG/CSS arbitrario. Permisos de marca separados de invitaciones. Multicuenta significa varias membresías de la misma identidad; no compartir contraseñas.

## Archivos previstos

Extender lib/organization-server.ts, APIs y páginas /teams, VivoShell, layout y catálogos de traducción. Añadir migración company_teams_entitlements, páginas/API de configuración de compañía y administración de contratos, imagen privada, mensajes, comprobaciones SQL/HTTP y documentación. Reutilizar role-training-content y catálogos locales de idiomas. Reutilizar sandbox-runtime para Python/SQL aislados.

## Bloqueo comprobado

Vercel no permite crear codezero-practice-engine en codezerov1 (403). CLI no tiene credenciales independientes; no se habilita ejecución en el origen principal para evitar perder aislamiento. Se verifica localmente y se conserva la activación cloud pendiente de ese acceso.

## Implementación y validación

Cinco migraciones nuevas, aplicadas en CodeZero Sandbox (PostgreSQL 17.11): company_teams_entitlements, company_messages_and_metrics, professional_routes_expansion company_contract_indexes y company_active_scope_guards. En local pasan comprobaciones de cupo, delegación, visibilidad, reactivación y múltiples compañías; se prueba además el flujo real de Next con Auth/REST ficticios. Estas pruebas no sustituyen una sesión real de un cliente.

El piloto conserva sus 29 unidades y 24 integradores. Se añaden 7 rutas (operaciones, QA, datos/BI, producto, soluciones/integraciones, enablement y liderazgo), cada una con 20 unidades que progresan en 5 áreas, 8 episodios reutilizados de Faro, 4 role-plays, 3 proyectos, 1 capstone, 4 exámenes y 4 reevaluaciones. 188 h estimadas por ruta más 45 h de tronco común reutilizado; no son horas de video ni acreditaciones laborales. Comparten el historial, perfiles existentes, rúbricas, flujo de proyectos y certificados. Las otras rutas usan el perfil del puesto elegido para verificar competencias de peso Alto; no inventan otros puestos de afinidad.

ES/EN/PT/FR: las 21 lecciones nuevas del piloto y los criterios críticos tienen corrección editorial de IA en los tres idiomas. El resto del catálogo adicional tiene traducción inicial. Se comprueban opciones distintas, cifras del piloto, cobertura y valores originales de formulario. No se declara revisión nativa humana, calibración pedagógica ni validación con lectores de pantalla reales.

Comunicador Enterprise: avisos de compañía (administradores), canales internos con el mismo alcance (consulta entre equipos solo permite leer; publicar exige pertenecer al equipo o ser administrador de compañía), texto/emojis, solicitudes idempotentes, moderación y visibilidad de 90 días. La eliminación histórica física es al enviar otro mensaje, no un cron garantizado. Visitas: conteos diarios aproximados y agregados de cuatro páginas, sin identidad; deduplicación por sesión y límite técnico pueden subcontar. No son usuarios únicos, compras ni conversiones. Cancelaciones: eventos Stripe verificados registran programación, reversión o finalización con fecha y clave idempotente; se incluyen en exportación propia. No hay reconstrucción de eventos antiguos.

Contratación por equipo: administración registra un contrato confirmado (referencia, cupo exacto, plan y vigencia); esa operación crea compañía y su responsable verificado. No se crea una suscripción personal, no se infieren asientos desde un precio y no se cambia Stripe. Enterprise sigue contratación por contacto, como el flujo existente. Los límites de aprendizaje reutilizan la fila existente de plans y no se suman por pertenecer a varios equipos.

Invitaciones: enlace listo al reservar cupo; el adaptador opcional Resend exige remitente, clave y activación configurados. No se envió correo a empleados durante esta implementación. “Queued” significa aceptado por el proveedor, no entrega al buzón. El enlace puede compartirse mientras el correo no esté activado. Auth exige correo verificado al aceptar. Configuración de dominio/correo, Tutor IA y decisiones legales/fiscales conservan las exclusiones anteriores.

Las nuevas tablas privadas tienen RLS. site_daily_metrics deliberadamente no tiene política de lectura de cliente (INFO del advisor: tabla solo backend). Se corrigen los dos índices FK nuevos señalados por el advisor. No se cambia la protección de contraseñas de Auth. El estado de CI, publicación y bloqueos vigentes se registra en Módulos, Bitácora y Roadmap de Garciloga HQ.


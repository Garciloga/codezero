# Comunidad y gestión de mentorías · 8 de octubre de 2026

Entrega consolidada para Garciloga en Garciloga/codezero, destinada a main pero todavía sin publicar. Se mantiene el único proyecto Supabase de producción y el despliegue principal de Vercel; no se crea un sandbox cloud. Tutor IA permanece excluido. No se modifican precios, Stripe ni cuotas de aprendizaje.

Historial productivo comprobado al recuperar el chat: company_invitation_retry_controls (20261008144145) y community_and_mentoring_workflows (20261008144245) ya están aplicadas. El error anterior del conector no impidió su aplicación posterior. No deben repetirse. Las rutas mixtas también tienen migración aplicada (20261008144645), con 48 pasos y activación false; conservan 361 actividades y 17 perfiles. Su interfaz y traducciones no forman parte de esta publicación.

Recuperación actual: 193 pruebas, diez grupos PostgreSQL sociales, veinte de compañía, ocho de rutas mixtas y cobertura de traducciones aprobados. Build y TypeScript pasan. HTTP con handlers Next reales y Auth/REST ficticios aprueba el flujo social. El entorno actual bloquea sockets nativos al arrancar Chromium; la alternativa es GitHub Actions con instalación de dependencias de Chromium, Firefox y WebKit. Los tres recorridos sociales ahora son obligatorios en CI. No se afirma que el bloqueo local haya quedado resuelto ni que CI o producción estén completos antes de comprobarlos.

## Comunidad

/community permite participación voluntaria de cuentas activas con correo verificado. Usa alias independientes del perfil, no publica correo, puestos, compañías ni un directorio de usuarios. Reglas y consentimiento explícitos preceden al alta. El propietario de plataforma no puede darse de alta como alumno en la comunidad; sus funciones de moderación no lo publican en el directorio.

Conversaciones y respuestas se guardan pendientes de revisión; solo administración de plataforma las aprueba. El texto se presenta como texto, sin HTML ni enlaces automáticos. Hay reportes, retiro de publicaciones, cierre de conversaciones, suspensión y restablecimiento. Al retirar participación se eliminan publicaciones y respuestas asociadas; la suspensión conserva una referencia interna anonimizada para evitar su evasión. No representa anonimato frente al operador de la plataforma. La comunidad requiere moderación humana operativa; no se declara moderación mediante IA.

La paginación conserva la conversación raíz y usa fecha + UUID para no perder respuestas con fechas iguales. Retirar una conversación elimina sus respuestas. El límite técnico antispam de publicaciones y API es independiente de las cuotas comerciales de aprendizaje.

## Mentorías

/mentoring permite postular un perfil público con consentimiento, aprobar/pausar mentores desde /admin/social, publicar horarios de 45 minutos, solicitar una sesión, rechazar/cancelar y registrar finalización. Los horarios se muestran explícitamente en UTC. La aprobación de un perfil no acredita certificaciones externas ni implica una relación laboral.

Las solicitudes reservan un horario durante un máximo de 24 horas. Los bloqueos y el índice único impiden dos reservas activas para el mismo horario; se rechazan cruces de agenda y sesiones consigo mismo. Los reintentos reutilizan la solicitud original. El backend comprueba identidad activa y correo verificado, y limita cada persona a tres solicitudes/sesiones futuras activas.

Se conserva la referencia comercial de $699 MXN / 45 minutos. Solicitar una sesión no genera un cobro. No se conecta un checkout nuevo: un administrador de plataforma confirma únicamente después de verificar un pago por un proceso autorizado y registrar su referencia y un enlace HTTPS. El mentor o alumno no puede confirmar pagos ni cambiar el precio. Cancelar no procesa reembolsos automáticos. No se crean mentores ni horarios ficticios en producción. La operación comercial depende de contar con personas mentoras, disponibilidad, revisión y pagos verificados.

## Invitaciones

Se añade un reintento explícito por API y en las pantallas de administración/compañía. Se conserva el cupo reservado por la invitación existente. El retorno tras preparar una invitación ahora respeta el acceso del administrador de compañía, sin enviarlo al panel de plataforma.

El claim de correo utiliza una fecha exclusiva por intento, conserva la fecha del primer envío para respetar la ventana de idempotencia del proveedor, rechaza reintentos simultáneos y permite como máximo cinco intentos. Los resultados solo se escriben sobre el intento correspondiente. Una URL de aplicación inválida falla de forma controlada. Queued significa aceptación por el proveedor, no entrega en el buzón.

El envío sigue dependiendo de RESEND_API_KEY, CODEZERO_INVITATION_FROM y CODEZERO_INVITATION_EMAIL=1, con dominio/remitente verificado. La inspección previa encontró que esas variables no estaban configuradas y los dominios de Resend no estaban verificados. No se envía correo a empleados ni se generan cargos durante esta entrega.

## Datos, permisos y comprobaciones

Siete tablas nuevas tienen RLS y no conceden lectura/escritura a anon, authenticated ni PUBLIC. Se usan únicamente desde backend; las funciones son SECURITY INVOKER y solo service_role puede ejecutarlas. Las mutaciones verifican al actor real autenticado; no usan user_metadata para conceder roles. No se incorpora ninguna identidad a una compañía ni se toca su visibilidad.

Migraciones: community_and_mentoring_workflows y company_invitation_retry_controls. Son aditivas. Los índices cubren las referencias y los filtros de agenda/moderación.

Validación: 193 pruebas unitarias existentes, diez grupos PostgreSQL de comunidad/mentorías, veinte grupos PostgreSQL de compañías/cupos/permisos/reintentos, auditoría con cero textos nuevos sin traducción y compilación de producción. Páginas y API reales de Next se comprobaron con Auth/REST ficticios. Navegador Chromium: alta, revisión, publicación, escape de HTML, postulación/aprobación de mentor, disponibilidad, solicitud/confirmación, traducción inglesa, anchos 390/1280, WCAG automatizado y ausencia de errores de consola. Los catálogos nuevos incluyen ES/EN/PT/FR. Estas pruebas no sustituyen sesiones de clientes, revisión lingüística nativa, lectores de pantalla físicos ni una restauración cloud completa.

## Pendientes que necesitan insumos u operación humana

Archivos web licenciados de Söhne; verificación de dominio/remitente y credenciales de correo; personas mentoras y horarios; moderación y revisión de perfiles/pagos; revisión editorial/lingüística humana; sesiones reales y lectores de pantalla físicos; restauración cloud verificada. Orientación profesional continúa como laboratorio interno hasta completar su validación; no se abre como diagnóstico público validado ni se habilitan cobros del diagnóstico.

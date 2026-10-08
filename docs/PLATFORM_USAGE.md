# Uso de la plataforma

El propietario abre **Plataforma → Uso por persona** (`/admin/usage`) para comparar clics en controles, visitas a secciones y días activos de las cuentas activas. Puede elegir 7, 30 o 90 días, buscar por nombre/correo y ordenar por más clics, menos clics o actividad reciente. Las cuentas sin eventos aparecen con cero. Se excluyen el propietario, las cuentas archivadas/suspendidas y la navegación del propietario en modo soporte como alumno.

El registro comienza al aplicar `20261008225748_platform_usage.sql`; no reconstruye clics históricos. Los conteos son aproximados: el navegador puede bloquear solicitudes o cerrarse antes de enviarlas. No representan aprendizaje, tiempo dedicado ni desempeño. Los clics registrados corresponden a controles interactivos, no a cualquier punto de la página.

El cliente envía únicamente un identificador aleatorio de lote, la sección general y conteos acotados. La identidad procede de la sesión verificada en el servidor. No se envían textos, contraseñas, contenido de mensajes, rutas completas ni identificadores incluidos en las rutas. Las escrituras y el ranking se realizan en el servidor; RLS permite a cada persona exportar solo sus propios agregados mediante `/api/profile/export`.

Los agregados diarios usan la zona `America/Mexico_City`. Una tarea horaria elimina agregados cuya última actividad supera 90 días y recibos de deduplicación de más de dos días. El ranking incluye hasta 50 personas por página. Las métricas no sustituyen una prueba humana ni verifican atención o productividad.

Validación: pruebas de límites y minimización del payload; PostgreSQL aislado para deduplicación, agregación, personas sin eventos y permisos; flujos HTTP reales de Next para identidad, origen y acceso; navegadores Chromium, Firefox y WebKit para registro de clics, pantallas de 390/1280/1920 px y accesibilidad del informe.

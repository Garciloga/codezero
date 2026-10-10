# CodeZero · Disaster Recovery

Última actualización: 8 de octubre de 2026.

Este documento define cómo recuperar CodeZero ante fallos graves sin incluir credenciales ni secretos.

## Estado comprobado el 8 de octubre

Producción: `kwfzhpapvpdatdfwhouf`, PostgreSQL 17.11. El sandbox cloud anterior fue eliminado; las pruebas usan PostgreSQL local y sesiones ficticias aisladas. No se ha creado un proyecto adicional.

Se guardó `supabase/baselines/20261008-production-manifest.json`: 65 migraciones observadas, sus checksums de declaraciones, inventario de tablas/RLS y SHA-256 de los archivos fuente, normalizados a UTF-8/LF y un salto de línea final. Esta normalización evita diferencias de descarga en líneas vacías finales; cualquier cambio en el contenido sigue fallando. `scripts/migration-baseline-check.mjs` comprueba su integridad. Este manifiesto conserva la base de implementación; no contiene datos personales ni sustituye un respaldo completo.

El respaldo completo cloud y su restauración siguen **sin confirmarse**. La conexión disponible no expone inventario/descarga de backups ni una conexión PostgreSQL protegida para `pg_dump`. No hay destino privado externo confirmado ni exportación de binarios de Storage. No se declaran backup reciente, restauración cloud, RPO o RTO cumplidos. Antes de una liberación que exija ese respaldo, obtener evidencia verificable o completar el procedimiento privado descrito abajo; nunca subir dumps con datos a Git.

Referencia: https://supabase.com/docs/guides/platform/backups . El plan Free requiere respaldos manuales fuera del proyecto; conservar historial de migraciones no asegura recuperación de progreso, certificados o evidencias.

## Respaldo gratuito opcional (10 de octubre de 2026)

`.github/workflows/database-backup.yml` genera cada lunes un `pg_dump` de los esquemas de la aplicación, comprueba que restaura en un PostgreSQL temporal, lo cifra con AES-256 y lo guarda 30 días como artefacto. **No hace nada hasta que el propietario agregue dos secretos del repositorio**: `SUPABASE_DB_URL` (cadena de conexión del pooler de sesión) y `BACKUP_PASSPHRASE` (aleatoria, 24 caracteres o más, guardada fuera de GitHub).

Límites: el repositorio es público, así que el artefacto cifrado puede descargarlo cualquier usuario de GitHub con sesión; su protección depende por completo de la frase. No incluye `auth.users` ni los archivos de Storage. Mientras los secretos no existan, el respaldo cloud sigue sin confirmarse. Para restaurar: descargar el artefacto, `gpg --decrypt` y `pg_restore` sobre un proyecto vacío con las migraciones aplicadas.

## Objetivos

- Mantener el esquema reproducible desde las migraciones versionadas en Git.
- Evitar cambios manuales de base de datos que no queden registrados.
- Poder reconstruir la aplicación desde GitHub + variables de entorno seguras.
- Minimizar pérdida de datos y tiempo de recuperación según las capacidades del plan disponible.

## Fuentes de recuperación

1. **Código y configuración versionada**: GitHub, rama `main`.
2. **Esquema de base de datos**: `supabase/migrations`.
3. **Variables de entorno**: almacenadas en Vercel/Supabase/Stripe/Resend, nunca en el repositorio.
4. **Datos de producción**: dependen de las capacidades de backup/restauración del plan de Supabase.
5. **Facturación**: Stripe conserva su propio historial y no debe reconstruirse manualmente desde CodeZero.

## Recuperación de aplicación

1. Identificar el último commit estable en `main`.
2. Confirmar que CI pasó.
3. Volver a desplegar ese commit o promover un deployment estable.
4. Verificar `/api/health`, páginas públicas y rutas protegidas.
5. Revisar errores de runtime antes de declarar recuperación completa.

## Recuperación de base de datos

1. No ejecutar migraciones adicionales durante un incidente hasta conocer la causa.
2. Si la base sigue disponible, preservar evidencia y verificar consistencia.
3. Antes de reconstruir, comparar el esquema real, las versiones remotas y los archivos versionados. Hay migraciones históricas cuya numeración remota difiere: no ejecutar `db push` ni repetir todas indiscriminadamente. Preparar una línea base reconciliada en un entorno aislado.
4. Restaurar datos desde el mecanismo de backup disponible en Supabase cuando exista.
5. Validar conteos, relaciones y RLS antes de reconectar tráfico.

## Verificación posterior

- Confirmar acceso por plan y RLS.
- Confirmar que soluciones de ejercicios/exámenes siguen siendo server-only.
- Verificar cuotas y uso mensual.
- Verificar proyectos, certificados y progreso.
- Verificar webhooks de Stripe e idempotencia.
- Revisar Security Advisor y logs.

## Capacidades confirmadas del plan

Consulta de la organización `rjqodylaesfklgualbag` el 7 de octubre de 2026: **Free (`tier_free`)**. Producción: `kwfzhpapvpdatdfwhouf`; entorno aislado: `sdvwkrosdnlacyhnuxwo`. PostgreSQL 17.11.

- Free no incluye la recuperación de backups diarios que ofrecen los planes pagados. Supabase recomienda exportaciones manuales con la CLI y copias externas.
- Pro conserva backups diarios 7 días; Team 14; Enterprise 30. PITR es un complemento de pago: no está habilitado ni contratado para CodeZero.
- Un backup de base de datos **no contiene los archivos binarios de Storage**. La configuración de Auth, SMTP, dominios, variables, funciones y secretos también requiere recuperación separada.
- Las contraseñas de roles personalizados no se recuperan del dump. Deben restablecerse de forma segura en el destino.
- No se obtuvo una exportación cloud ni se ejecutó una restauración real. El conector permite revisar SQL y plan, pero no proporciona la contraseña de conexión ni una copia descargable. No se cambió de plan ni se restablecieron credenciales.

Fuentes oficiales revisadas: [backups](https://supabase.com/docs/guides/platform/backups) y [backup/restauración entre proyectos](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

## Procedimiento de respaldo manual

1. Usar una estación de operación protegida con Supabase CLI, Docker y PostgreSQL 17/psql. Obtener la conexión del panel Connect; preferir Session pooler. Cargar la contraseña desde el gestor de secretos, sin escribirla en Git, notas, capturas o logs. No reiniciar la contraseña de producción como parte de un respaldo rutinario.
2. Crear una carpeta privada, permisos de propietario y fecha UTC. Registrar commit, versión PostgreSQL, hora, inventario de tablas y versiones de migración. Exportar sin modificar datos:

```sh
supabase db dump --db-url "$CODEZERO_SOURCE_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$CODEZERO_SOURCE_DB_URL" -f schema.sql
supabase db dump --db-url "$CODEZERO_SOURCE_DB_URL" -f data.sql --use-copy --data-only -x storage.buckets_vectors -x storage.vector_indexes
supabase db dump --db-url "$CODEZERO_SOURCE_DB_URL" -f history_schema.sql --schema supabase_migrations
supabase db dump --db-url "$CODEZERO_SOURCE_DB_URL" -f history_data.sql --use-copy --data-only --schema supabase_migrations
```

Estos comandos son una plantilla operativa, no una exportación ya realizada. Revisar previamente los esquemas efectivamente incluidos por la versión instalada; confirmar datos de Auth, grants, funciones y RLS. El historial de migraciones se exporta expresamente. Guardar aparte un diff revisado de las modificaciones propias en `auth`/`storage` (por ejemplo el trigger de registro); la CLI no reconstruye automáticamente todos sus objetos gestionados.

3. Inventariar buckets y objetos de Storage. Descargar los binarios mediante la API autorizada, registrar ruta/tamaño/hash y conservar configuración y políticas de buckets. No basta restaurar filas de `storage.objects`. Si no hay objetos, guardar evidencia del inventario vacío.
4. Inventariar Auth (proveedores, URLs de retorno, plantillas, SMTP), Realtime/publications, extensiones, Edge Functions, cron/webhooks y variables de Vercel. Mantener secretos en el gestor de secretos, separados de los dumps; conservar configuración no secreta y su procedimiento de reconstrucción.
5. Comprobar que cada comando terminó correctamente y que los archivos contienen los objetos esperados. Calcular SHA-256 del paquete y del manifiesto; cifrar antes de enviarlo a un almacenamiento privado externo al proyecto, con acceso limitado y clave custodiada aparte. Nunca guardar datos personales reales en Git o en un Site público.
6. Propuesta de operación, todavía no automatizada: respaldo diario y antes de migraciones; conservar 7 diarios y 4 semanales. Verificar fecha/hash de la última copia y comprobar una restauración aislada periódicamente. **No existe actualmente un RPO/RTO garantizado**: 24 horas de RPO sería un objetivo una vez que las copias diarias estén funcionando; el RTO se medirá en el simulacro cloud.

## Restauración aislada y cambio de tráfico

1. Elegir un proyecto de recuperación **vacío y separado**; verificar su referencia explícitamente. No usar el sandbox existente si contiene trabajo que se quiera conservar. Registrar snapshot e incidente; detener cambios concurrentes y mantener la aplicación pública en el último deployment estable o mantenimiento según el incidente.
2. Verificar integridad, descifrar en almacenamiento privado y habilitar extensiones/Database Webhooks necesarias. Revisar incompatibilidades de roles y propietarios descritas en la guía oficial, sin ignorar errores ni editar en masa el dump.
3. Restaurar roles, esquema y datos con `psql --single-transaction --variable ON_ERROR_STOP=1`; el procedimiento oficial establece `SET session_replication_role = replica` dentro de esa restauración para evitar disparar triggers al cargar datos. Si falla, cancelar y resolver en el destino aislado. Restaurar el historial de migraciones por separado y revisar el diff propio de `auth`/`storage`. No ejecutar a la vez todas las migraciones encima del esquema restaurado.
4. Reponer binarios/configuración de Storage, Auth/SMTP, publicaciones Realtime, funciones, cron y secretos. Mantener correo, Stripe webhooks y jobs del destino desactivados durante el simulacro para evitar acciones duplicadas. Restablecer contraseñas de roles personalizados y comprobar sesiones/Auth según el destino.
5. Comparar conteos, claves foráneas, secuencias, grants y RLS. Probar cuenta propia/ajena/anon, progreso, cuota, exámenes, proyectos, certificados y soporte. Comprobar que las soluciones siguen reservadas al servidor. Registrar pérdida de datos y tiempos reales; no declarar recuperación basándose solo en conteos.
6. Solo después de pasar estas comprobaciones, cambiar la configuración de aplicación al destino recuperado, publicar y probar `/api/health`, rutas y logs. Reactivar integraciones una vez conciliados sus eventos y el posible intervalo de pérdida; no repetir cargos, correos ni webhooks indiscriminadamente. Conservar el origen y las copias hasta cerrar el incidente.

## Simulacro local comprobado

`scripts/recovery-local-check.mjs` restaura un backup comprimido de PostgreSQL PGlite con datos ficticios y comprueba datos, roles, RLS y denegación anónima. CI ejecuta esta comprobación. No verifica disponibilidad, retención ni restauración de un backup de Supabase cloud; esa recuperación sigue sin confirmarse.

## Simulacro recomendado

Antes de escalar a más usuarios, realizar un simulacro de recuperación en un entorno separado: aplicar migraciones desde cero, crear una cuenta de prueba, completar una lección, un ejercicio y una evaluación, y verificar que RLS y cuotas funcionen.

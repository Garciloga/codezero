# Personalización y fotos de perfil

Adición autorizada por Isaac el 7 de octubre de 2026 (CDMX): ampliar todos los colores, retirar la tarjeta superior de plan y permitir fotos en cada cuenta. Rama `sandbox/account-personalization`; un único PR. Reutiliza preferencias, perfiles, sesión, rate limit y validación de origen. No modifica planes, Stripe, cuotas, Auth ni competencias.

## Uso

En Mi cuenta → Personaliza Garciloga → Todos los colores hay 23 controles para fondos, tarjetas/campos, textos, menú, botones/progreso, hover, selección, bordes, foco, éxito/error y avisos. Paletas separadas para claro/oscuro; elegir la paleta presenta ese modo como borrador. Guardar colores conserva el borrador; Descartar lo revierte. Los cuatro acentos anteriores y modo dispositivo siguen disponibles. Restablecer elimina los colores propios y recupera la apariencia predeterminada. Avisos detectan contraste menor a 4.5:1 en nueve pares de texto/fondo; se respeta la elección del usuario, sin certificar accesibilidad de cualquier paleta arbitraria.

Las preferencias se sincronizan por cuenta y conservan copia local separada por usuario. La exportación incluye colores. No se copia la paleta de otra cuenta al cambiar de sesión. El plan permanece junto al usuario al final de la barra lateral; usuarios de organización conservan su puesto arriba. La suscripción sigue accesible en Mi cuenta.

Mi cuenta → Datos → Foto de perfil: subir/reemplazar/eliminar JPG, PNG o WebP de hasta 2 MB. El servidor decodifica la imagen, rechaza formatos ajenos y entradas excesivas, limita a 16 millones de píxeles y genera WebP cuadrada de hasta 512 px sin ampliar imágenes pequeñas ni conservar EXIF. Se muestra en el perfil propio y la barra lateral. Si falta/falla la imagen se muestran iniciales. No se habilita compartir públicamente ni ver fotos ajenas desde los directorios.

## Datos y seguridad

Migración aditiva `account_palette_and_profile_photos`: `user_preferences.colors` JSONB con validación estricta de modos/claves/hex de seis dígitos y `profiles.avatar_version` UUID nullable. Las preferencias existentes siguen válidas. Se conserva RLS de preferencias/perfiles. Bucket privado `profile-photos`, WebP hasta 2 MB; cuatro políticas nuevas permiten SELECT/INSERT/UPDATE/DELETE únicamente en `{auth.uid()}/avatar.webp`, impiden mover la foto a otra cuenta. No se usan datos del navegador como identidad. La API comprueba sesión y origen, reutiliza límite durable de diez mutaciones por diez minutos y el lector de formulario acotado por bytes reales. La actualización del perfil usa el patrón server-only existente y siempre el ID autenticado. GET usa sesión propia, respuesta privada sin caché y MIME image/webp con nosniff. El nombre/avatar del usuario sigue separado de roles/permisos.

## Verificación y estado

Migración aplicada en sandbox; validador remoto acepta colores hex y rechaza CSS, bucket privado/2 MB comprobado. Advisor de seguridad sin nuevos avisos respecto a su baseline. PostgreSQL/PGlite comprueba selección/escritura/borrado propios, rechazo entre cuentas y cambio de dueño; no simula transferencia real de Storage. Tres pruebas nuevas comprueban validación de paleta, contraste y decodificación/recorte/metadatos/límites de fotos. 184 pruebas unitarias, TypeScript, compilación, traducciones EN/PT/FR, auditoría npm de todas las severidades, Semgrep y escaneo de secretos aprobados localmente. Regresión existente de equipos: 26 grupos PostgreSQL aprobados.

El navegador de CI incorpora preview/guardar/recargar/descartar/restablecer, bordes reales y paleta oscura, ausencia de plan superior, subida/lectura/recarga/borrado de foto y rechazo de origen/colores inválidos. Utiliza Auth/REST/Storage ficticios con handlers de aplicación reales; su resultado se verifica en el PR antes de publicar. No equivale a sesiones de personas reales o prueba de extremo a extremo contra Storage cloud. Producción y resultado CI se registran en Notion al cerrar, sin inventar resultados futuros.

## Reversión

Volver al código anterior conserva perfiles, colores, fotos y preferencias. No borrar columnas, bucket o fotografías para revertir la interfaz. Una subida de Storage y actualización de avatar no son una única transacción entre servicios: una falla de metadatos responde 503 y permite reintentar; no se confirma un cambio fallido. Rutas futuras, Tutor y validaciones humanas mantienen su alcance anterior.

Primer CI del PR (`bf19ab6`): build/seguridad aprobados; el navegador detectó que `border: 0 !important` del diseño Vivo anterior ocultaba el borde propio. Se agrega una sobrescritura acotada a paletas personalizadas y se repite CI en el mismo PR antes de publicar. No se suprime la aserción del borde.

La actualización inmediata del avatar también se limita al ID de cuenta: eventos de otra sesión no reemplazan la foto visible. El recorrido de navegador incluye el control de un evento ajeno.

Segundo CI (`0628a91`): borde visual ya correcto; una espera de la prueba leía la preferencia local antes de terminar el guardado asíncrono. Se agrega una guarda para esperar la copia existente, conservando la verificación posterior a recarga. Se vuelve a ejecutar el mismo PR.

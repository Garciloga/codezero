# Preparación parcial · Fase 1

Base de aplicación: main 04102ee0179abdd1b43a1c8a755a2392fc09b932. Comparar con main vigente antes de aplicar. Esto NO es la fase completa ni debe desplegarse como tal. Versión de preparación 2.

Preparado: tokens y estilos públicos aprobados; encabezado/pie únicos mediante grupo (public), sin cambiar URLs; menú móvil nativo; CTA de panel según getUser; pestañas Entrar/Crear cuenta con teclado y ?modo=registro; lang es-MX. Portada con ejemplo respondido explícitamente ilustrativo, estadísticas y anclas como-funciona/ruta/preguntas, etapas de ruta, FAQ y CTA. /about redirige con 308 a /. Fuentes locales Bricolage Grotesque 600/700, Figtree 400/500/600/700 y JetBrains Mono 500, display swap, paquetes 5.3.0 fijados.

Precios y cuotas se leen de plans, sin valores comerciales de respaldo inventados. Free/Starter/Pro, Starter destacado y primero en móvil, comparación horizontal, plan actual deshabilitado y Enterprise solo contacto. Los cupos 5/20 son entregas mensuales, no cinco/veinte proyectos existentes: hay dos proyectos finales. Datos comerciales y catálogo comprobados con SELECT de producción durante esta sesión: 15 niveles, 92 lecciones, 15 exámenes, 2 proyectos publicados. La portada mantiene una instantánea manual aprobada; actualizarla si cambia el catálogo.

La hoja se limita a .public-site. PublicLayout consulta cookies/getUser: estas páginas son dinámicas. Se mantienen los mismos métodos SDK de login, signup y recuperación, sus destinos y la autorización legal vigente. El formulario ahora valida campos, muestra errores y maneja fallos de red; signup añade datos informativos de registro. Las cláusulas legales no se reescriben. Sin cambios de APIs de negocio, consume_quota, Stripe, RLS o permisos de base de datos.

## Registro y metadatos

Nombre (2–100 caracteres) y edad opcional en años completos se envían como full_name/signup_age en user metadata mediante signUp. Se rechazan edades malformadas, negativas, fraccionarias o fuera del rango entero seguro; no hay filtro de acceso por edad. Se mantiene obligatoria la confirmación vigente de mayoría de edad o autorización de tutor, además de los términos. Estos metadatos son editables y NUNCA se usan para roles, permisos, plan ni RLS. No se escriben columnas nuevas ni se modifica el trigger Auth.

Se añadieron Mostrar/Ocultar con aria-pressed, indicador del requisito vigente de ocho caracteres, errores debajo de campos con aria-invalid/describedby y foco en el primer error, controles deshabilitados al enviar y manejo de fallos de red. Al alta sin sesión aparece Revisa tu correo; la contraseña se borra de estado. Pestañas conservan flechas/Home/End.

Las siete páginas públicas tienen título/descripción/canonical, Open Graph y Twitter mediante publicMetadata; login usa un layout servidor. Imagen social PNG 1200x630 generada de texto aprobado con fuente local en /social/codezero, sin proveedores externos. Imagen inspeccionada visualmente sin cortes de texto.

El trigger handle_new_user actual solo inserta id/email en profiles, por lo que NO sincroniza full_name del registro con el nombre de perfil/certificado. El flujo de Mi perfil existente sigue disponible; resolver y verificar esa continuidad antes de declarar completo el registro. Revisar la presentación/exportación de los datos añadidos y el aviso de privacidad antes de publicar, sin usar user metadata para autorización.

## Lectura pública de planes

plans no permite SELECT anónimo según los grants/policies vigentes. La consulta comercial usa el cliente administrativo EXISTENTE exclusivamente en servidor, con server-only, selección explícita de cinco campos públicos y active=true. No transmite Stripe IDs ni credenciales al navegador, ni altera RLS. Depende de NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY ya usadas por la aplicación. Si falta la configuración, hay error o el conjunto es inválido/incompleto, se muestra un aviso con Reintentar/Contacto y se omiten las tarjetas de compra. Verificar esta lectura con la configuración real del entorno antes de publicar; los HTTP locales usan un servidor Supabase ficticio, no prueban las credenciales de producción.

## Validación local

- 71 pruebas aprobadas en el workspace aislado, incluidas dos nuevas de registro (edad opcional/menores, datos informativos sin privilegios y rechazo de edades inválidas) y dos de planes: centavos/cuotas, orden, exclusión de campos privados y rechazo de datos incompletos/duplicados/inválidos. El workspace contiene pruebas Career heredadas; este parche no incorpora ese código.
- Build Next.js 16.3.8 y TypeScript aprobado; fuentes locales emitidas con display swap.
- Semgrep estricto: 83 archivos TS/TSX, seis reglas, cero hallazgos. Detector de secretos: cero incidencias. Un falso positivo sobre el texto de error de contraseña se revisó y se marcó únicamente en esa línea; no se relajan reglas globales. npm audit: cero vulnerabilidades.
- HTTP/SSR anónimo: nueve accesos públicos, un header/footer/h1, anclas de portada, registro por parámetro, precios/cuotas procedentes de fixture comercial y Enterprise sin checkout. Error de proveedor visible sin precios inventados; /about devuelve 308 a /.
- HTTP/SSR de metadatos aprobado en ocho accesos: título/description/canonical/Open Graph/Twitter, registro con nombre/edad opcional y contraseña oculta inicialmente. Imagen social servida como PNG 1200x630; no valida toggles, errores interactivos ni confirmación real.
- Render separado de PricingPlans con Starter activo: botón deshabilitado, sin checkout del mismo plan y Pro disponible. Esto no valida sesión real de usuario pagado.
- Destinos y métodos SDK Auth conservados; contenidos legales/contacto sin reescritura y aplicación del parche comprobada contra la base local de main. Sin CI remoto, login real, pagos ni validación visual/móvil; build/SSR no acreditan accesibilidad completa.

## Pendientes antes de publicar el bloque 2

- Validar interacciones reales del registro, alta/confirmación/recuperación y continuidad del nombre hacia perfil/certificado; el trigger existente no lo copia. Revisar exportación/aviso de datos añadidos antes de publicar.
- Revisar escritorio, celular, zoom, teclado completo y contraste; validar lectura comercial con configuración real, sesión real y navegación; smoke test tras READY.
- Comparar/adaptar este parche al main vigente y pasar los controles remotos antes de publicar. No declarar Fase 1 completa por pasar checks locales.

Se conservaron las condiciones legales vigentes; nombre/edad se incorporan como datos de cuenta, no como permisos. Sin prueba de alta real aún y sin cuentas creadas durante este incremento.

No contiene Career Lab como cambios del parche. No se hizo push, preview ni deployment durante esta preparación: cero deployments adicionales. El límite de Vercel debe comprobarse al ejecutar la tarea de cinco bloques; no cambiar de plan ni publicar si sigue bloqueado.

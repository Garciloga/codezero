# Garciloga Android · Código fuente

**Tipo de proyecto:** aplicación Android en Kotlin + WebView segura, ubicada en `mobile/android/` del repositorio `Garciloga/codezero`. Se compiló un **APK debug 1.0.0** con GitHub Actions (10-10-2026); el código no incluye llaves de firma comercial. Esta app no modifica por sí sola Vercel, Stripe ni Supabase.

## Estrategia

La aplicación incorpora la **web real de Garciloga**, con URL de origen inicial `https://codezero-nine.vercel.app`. En lugar de duplicar cursos, evaluaciones, competencias o permisos de cada organización, la app presenta las funcionalidades *efectivamente publicadas* en esa web. Los módulos todavía en borrador o Coming soon no pasan a ser funcionales por instalar la app: se mostrarán cuando estén listos en el servidor. De este modo se conservan la autenticación y reglas de seguridad existentes y se evitan dos lógicas de evaluación diferentes.

### Qué incluye

- Navegación integrada HTTPS únicamente para el dominio configurado y enlaces externos en navegador independiente.
- Mismo inicio de sesión web (no incluye credenciales ni secretos); cookies administradas por Android WebView.
- Inicio, lecciones, práctica, asignaciones, progreso, empresas/equipos, perfiles, idiomas ES/EN/FR/PT y administración **en la medida en que esas pantallas ya funcionen en la web**.
- Selector nativo de archivos para `input type=file`, incluidas fotografías desde almacenamiento, y descargas HTTP(S) del dominio propio.
- Manejo del botón Atrás, indicador de carga, pantalla sin conexión y colores base de marca.
- Sin acceso a archivos locales generales, sin HTTP plano, sin permisos de cámara/micrófono, sin puente JavaScript, sin secretos embebidos y sin copia de datos privados en caché para aprendizaje offline.
- Ícono vectorial **provisional** con colores de la marca. El logotipo oficial aprobado se debe importar como recurso vectorial antes de distribuir la versión final.

### Alcance y límites conocidos

1. **No hay aprendizaje offline**. Las entregas/progreso solo se contabilizan con la web conectada. No hay cola de sincronización o acceso a materiales privados sin internet.
2. **No hay notificaciones push** en esta entrega: requieren un servicio y flujo de consentimiento adicional (por ejemplo FCM y registros de token autorizados en backend).
3. Inicio de sesión por correo/contraseña dentro de la web puede funcionar como en escritorio, pero **OAuth social, SSO, MFA y enlaces mágicos deben probarse** con un proveedor real; los proveedores externos abren el navegador y sus cookies no se comparten automáticamente con WebView. Requeriría callback/deep link y ajustes server-side para completar el flujo nativamente.
4. `blob:` / descargas generadas únicamente en el navegador no funcionan con Android DownloadManager. Para exportaciones de ese tipo, desarrollar un endpoint HTTPS autenticado o un flujo de compartición seguro.
5. Stripe externo abre el navegador. La distribución por Google Play requiere revisar políticas de facturación de contenidos digitales y las obligaciones de privacidad de Google Play; no se presupone su aprobación.
6. Un APK instalable manualmente es distinto de una app aprobada para Play Store. **El build debug sí pasó en GitHub Actions** (run 38082653308), pero no se verificó aún un conjunto completo de pruebas reales de autenticación, accesibilidad ni E2E. El propietario confirmó que instaló el APK y dio una impresión positiva inicial; esto no sustituye un ciclo de QA.

## Regla permanente: sincronización de despliegues web y Android

**Solicitud del propietario (10 octubre 2026):** cuando se prepare o ejecute un nuevo despliegue de Garciloga, incluir revisión y mantenimiento de su app Android en el mismo lote y documentar ambos en Notion. **No anunciar APK nuevo ni decir «Android actualizado» sin comprobarlo**.

### Matriz de decisión por despliegue

1. **Cambios solo en web (UI, rutas, cursos, permisos, evaluaciones o backend):** esta versión Android usa WebView apuntando a la web HTTPS oficial; el contenido publicado se carga al abrir/actualizar la app, sin reinstalar el APK. Revisar en Android al menos inicio de sesión, navegación, rol/organización, subida de archivos y acciones afectadas. Si todo es compatible, dejar constancia del SHA/URL del despliegue web y estado **«Android: compatible, sin APK nuevo»**. No reconstruir por rutina ni consumir cuota de CI innecesariamente.
2. **Cambio nativo (Kotlin, permisos, WebView, dominio permitido, descarga de archivos, recursos de marca, SDK, deep links):** actualizar código dentro de `mobile/android/`, incrementar `versionCode` y ajustar `versionName`, ejecutar `Garciloga Android APK (test)` y conservar el APK como artefacto; probar instalación y regresión antes de compartir una actualización con usuarios.
3. **Cambio de dominio, acceso/SSO, política de cookies o API:** comprobar si el host de `gradle.properties`, la lista permitida de WebView o los flujos OAuth requieren cambio nativo; si sí, aplicar el paso 2. Nunca cambiar el dominio sin verificar control HTTPS y sesiones.
4. **Versión comercial Google Play:** distinta de un APK debug. Requiere revisión legal y privacidad, firma de distribución y pruebas humanas; no publicar de forma automática.
5. **Cierre del lote:** registrar en la ficha Android de Notion qué desplegó la web, qué se comprobó en Android, si hubo APK (versión, SHA y enlace a Actions), y los pendientes. Conservar `PR #42` en borrador mientras no se hayan cumplido las puertas de lanzamiento.

### Estado actual

- Primera compilación **debug 1.0.0** aprobada: [GitHub Actions run 38082653308](https://github.com/Garciloga/codezero/actions/runs/38082653308).
- El propietario confirmó instalación y satisfacción inicial; faltan pruebas funcionales sistemáticas y accesibilidad.
- Los cambios web posteriores se reflejarán a través del sitio cuando sean compatibles con WebView; **Google Play no entrega actualizaciones automáticas de código nativo para este APK instalado manualmente**.

## Compilar en Windows (Android Studio)

1. Instala Android Studio y usa **JDK 17** (el que integra Android Studio suele servir). Instala **Android SDK 36** desde SDK Manager.
2. Descomprime `Garciloga-Android.zip` y abre la carpeta `Garciloga-Android` en Android Studio (File > Open).
3. Si Android Studio avisa que falta el archivo de Gradle Wrapper, desde Terminal (PowerShell) ejecuta `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\prepare-wrapper.ps1`. Este script solo descarga **Gradle Wrapper 8.13 oficial**, cotejando la huella SHA-256 publicada por Gradle. El `gradlew.bat` hace el mismo paso automáticamente.
4. Deja sincronizar Gradle con acceso a internet. Verifica que el archivo `local.properties` apunte a tu Android SDK (Android Studio puede crearlo automáticamente).
5. Ejecuta `./gradlew.bat :app:assembleDebug` desde PowerShell dentro de la carpeta del proyecto, o Android Studio > Build > Build APK(s).
6. El resultado aparecerá en `app\build\outputs\apk\debug\app-debug.apk`. Para una distribución real, usa Android Studio > Build > Generate Signed Bundle / APK y gestiona la firma tú, sin compartir tu keystore.

### Dominio configurable

El dominio verificado en documentos del proyecto es `https://codezero-nine.vercel.app`. Si el sitio oficial cambia, modifica `gradle.properties`:

```properties
garcilogaUrl=https://tu-dominio-verificado.example
```

También puede enviarse al compilar:

```powershell
.\gradlew.bat :app:assembleDebug -PgarcilogaUrl=https://tu-dominio-verificado.example
```

Solo cambia a un dominio HTTPS bajo tu control; la política de navegación se restringe a ese host exacto. Si cambias URL, el almacenamiento WebView/cookies de un dominio anterior no se migra automáticamente.

### Versiones y firma

- Aplicación: `com.garciloga.android` (cámbialo **antes** de la primera publicación si quieres otro identificador).
- `minSdk=26` (Android 8), `targetSdk=35`, `compileSdk=36`.
- Android Gradle Plugin `8.13.2`, Gradle `8.13`, Kotlin `2.2.20`, Java/JDK `17`.
- `versionCode=1`, `versionName=1.0.0`: incrementa `versionCode` por versión publicada.
- No hay llaves privadas, certificados, tokens, credenciales, ni firma de producción en este código.

## Lista de verificación antes de publicar

- [ ] Importar el **isotipo oficial** y comprobar icono en Android 8-16.
- [ ] Inicio/cierre de sesión reales, recuperación, MFA/SSO y cambio entre organizaciones.
- [ ] Validar las rutas de alumno, manager y propietario con usuarios de prueba distintos.
- [ ] Probar ejercicios, casos de decisión, evaluaciones, registros de progreso y asignaciones autorizadas (sin fabricar competencias).
- [ ] Verificar las descargas/exportaciones; desarrollar alternativa autenticada para `blob:`.
- [ ] Probar TalkBack, texto ampliado, modo oscuro, teclado, orientación y dispositivos físicos.
- [ ] Evaluar HTTPS y cookies de sesión, política de privacidad, consentimiento y requisitos de tiendas.
- [ ] Construir y firmar el APK/AAB **solo después** de pruebas de seguridad y regresión.

### Referencias del proyecto

- Código web: https://github.com/Garciloga/codezero
- Sitio indicado en documentación: https://codezero-nine.vercel.app
- Roadmap en Notion: `Aplicación Garciloga para Android` (Coming soon, 10 octubre 2026).

**Esta entrega no desarrolla ni modifica los módulos futuros:** solo enlaza la aplicación Android con el catálogo real de la web. Las evaluaciones, competencias, datos humanos, facturación y roles siguen bajo control del backend existente.

## Experiencia móvil adaptada (borrador de lanzamiento 1.0.1)

- La web incorpora barra de navegación inferior de cinco destinos, tarjetas móviles basadas en progreso real, acceso a retos publicados, habilidades y tareas; aplica en pantallas pequeñas, también en navegador móvil.
- La app Kotlin añade la marca de agente de usuario `GarcilogaAndroid/1.0.1` **solo para mostrar funciones de interfaz**. Este identificador **se puede falsificar** y nunca debe usarse en autorización, planes, pagos o RLS.
- Exclusivo en APK 1.0.1: botón «Compartir con Android» del panel, que invoca el selector de aplicaciones del sistema sin puente JavaScript. En web móvil común el botón no se muestra.
- Al ejecutar un nuevo despliegue web compatible, la interfaz web se refleja al abrir la app sin instalar un APK. El botón exclusivo de Android necesita APK **1.0.1**; la versión instalada 1.0.0 sigue siendo funcional pero no añade acciones Kotlin nuevas.
- Seguimos sin push, aprendizaje offline o biometría: necesitan consentimiento/notificaciones y servicio servidor, cifrado/sincronización y evaluación de amenazas. No solicitar permisos que aún no se usan ni simular características.
- Verificación mínima: permisos/organizaciones, rutas reales, progreso de lecciones, sesión/MFA, accesibilidad, lector de pantalla, modo oscuro, idiomas ES/EN/FR/PT y Android físico. Compilar debug y validar antes de compartir; no automatizar publicación comercial.

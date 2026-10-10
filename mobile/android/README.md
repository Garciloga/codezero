# Garciloga Android · Código fuente

**Tipo de proyecto:** aplicación Android en Kotlin + WebView segura, compilable con Android Studio. **No incluye un APK ni una clave de firma.** Es un proyecto independiente del repositorio web `Garciloga/codezero`; no cambia Vercel, Stripe, Supabase ni Notion.

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
6. Un APK instalable manualmente es distinto de una app aprobada para Play Store. **No se realizó un build, instalación física, test de autenticación, revisión de accesibilidad ni prueba E2E.**

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

# Python y SQL ejecutables · revisión local

## Entrega

Continuación de `CodeZero_practice_learning.patch`. Se agregó un editor real de Python (Pyodide 314.0.7) y SQL (SQLite WASM 3.53.4-build2), con ejemplos originales y cuentas ficticias. Es práctica voluntaria, sin calificaciones, consumo de cuota, evidencias oficiales o diplomas. No se modificó Supabase, Auth, RLS, Stripe ni producción. No hay despliegues o cobros nuevos. Laboratorios de herramientas sigue Próximamente como oferta comercial.

La vista `/practice-preview` conserva su flag y 404 por defecto. El editor requiere además `CODEZERO_CODE_RUNTIME=1` y entorno sandbox local correctamente configurado. No se vende ni se anuncia en precios. Las seis muestras y cinco casos API anteriores permanecen disponibles en revisión.

## Arquitectura aplicada

- El motor corre en un iframe sandbox en **otro hostname y origen**: sitio `localhost:3032`, motor `127.0.0.1:3041`. Cambiar solo el puerto no separa cookies; ambas políticas rechazan esa configuración. Se rechaza producción y la referencia Supabase productiva conocida.
- El iframe permite scripts y su propio origen para soportar los motores, pero es de un origen distinto al padre. No puede leer su DOM/cookies. No usar nunca `allow-scripts allow-same-origin` en un iframe que comparta origen con el sitio.
- La CSP del motor permite únicamente sus archivos estáticos; no permite conexiones al sitio, Supabase, Stripe, proveedores de IA o internet. CORS es anónimo, sin `Access-Control-Allow-Credentials`. Se verificó que la ejecución no puede pedir `/api/health` del sitio.
- El servidor del motor es un servidor local de assets, **no un servidor de ejecución**: no recibe código por HTTP, procesa cuerpos ni registra solicitudes. Rechaza POST, queries, rutas desconocidas/escape y hosts distintos de la configuración. Whitelist de archivos propios y dependencias fijadas; no directorio público general, secretos ni CDN en tiempo de ejecución.
- Cada ejecución crea un Worker de módulo nuevo. Python y SQL corren dentro del navegador; los datos y cambios se pierden al terminar. No se pasan IDs de usuario, sesión, credenciales ni contexto personal.
- Python carga biblioteca estándar, sin instalar automáticamente paquetes/imports. SQL crea `cuentas(id,nombre,estado,asientos)` con tres filas ficticias; las sentencias se preparan y finalizan, sin shell. Cambiar/borrar datos afecta solo esa ejecución.
- Comunicación exige origen exacto, ventana de iframe exacta, canal aleatorio, ID de ejecución y resultados acotados. Los resultados **siguen siendo datos no confiables de práctica**: no se usan para aprobar exámenes o competencias.
- La CSP general del sitio se conserva. Solo la ruta de revisión puede incluir el origen local de iframe cuando se compila con la configuración sandbox válida; no se habilita WASM/eval en el sitio principal. No se relajó Auth ni se añadieron cabeceras para SharedArrayBuffer.

El primer intento con iframe opaco no cargó. La validación en navegador también identificó una restricción CSP de carga del módulo Worker; se ajustó únicamente a los assets del motor y se verificó el diseño final de origen separado. No atribuir la compatibilidad exclusivamente al origen opaco sin una prueba adicional; se conserva el diseño que pasó la suite completa.

## Límites y experiencia

- Código: 8,000 caracteres; carga del motor: 25 segundos; ejecución: 3 segundos desde que está listo.
- Salida: 4,096 caracteres; errores: 600; SQL: hasta 50 filas, longitud de valores/SQL y 64 columnas limitada mediante SQLite.
- `Detener ejecución` elimina el iframe y termina el Worker activo. Al exceder tiempo se termina; una ejecución nueva funciona después del fallo.
- Salida como texto, sin HTML. Errores de código visibles; restaurar ejemplo; textarea y controles etiquetados; botón de ejecución bloqueado mientras existe una ejecución.
- Reto original: listar cuentas activas y sumar sus asientos, excluyendo la cuenta inactiva; resultado esperado 8. Explicación y variación sugeridas, sin emitir acreditación automática.
- Vista móvil de 390×844 comprobada sin desbordamiento horizontal. No equivale a prueba en un teléfono físico o en Safari/Firefox.

**Límite material:** no hay un límite duro de RAM de proceso/navegador. Tiempo y salida no evitan toda asignación masiva de memoria. Por eso continúa siendo una revisión local y requiere evaluación adicional de rendimiento/memoria antes de ofrecer ejecución pública. No se presenta como sandbox de seguridad absoluta ni como detector/bloqueo de IA externa.

Los assets WASM/biblioteca se sirven locales y `no-store` para revisión. Antes de lanzamiento: empaquetado en origen separado público sin cookies de CodeZero, rutas versionadas y caché de assets, límites de recursos y revisión de navegadores/infra. Evita cómputo de servidor por ejecución; no implica costo total cero de alojamiento/entrega de archivos.

## Reproducir en Windows · PowerShell

Ejecutar desde la raíz del checkout preparado, después de aplicar las entregas previas. Node/npm instalados. No reutilizar credenciales Live para esta revisión.

```powershell
npm ci --ignore-scripts
npm ci --prefix sandbox-runtime --ignore-scripts
$env:NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "validation-placeholder"
$env:NEXT_PUBLIC_APP_URL = "http://localhost:3032"
$env:CODEZERO_PRACTICE_PREVIEW = "1"
$env:CODEZERO_CODE_RUNTIME = "1"
$env:CODEZERO_ENVIRONMENT = "sandbox"
$env:CODEZERO_CODE_RUNTIME_ORIGIN = "http://127.0.0.1:3041"
npm run build
npm run start -- -H 127.0.0.1 -p 3032
```

En otra terminal desde la misma raíz, para revisión manual:

```powershell
$env:CODEZERO_ENVIRONMENT = "sandbox"
$env:CODEZERO_RUNTIME_PARENT = "http://localhost:3032"
$env:CODEZERO_CODE_RUNTIME_ORIGIN = "http://127.0.0.1:3041"
npm --prefix sandbox-runtime start
```

Abrir **http://localhost:3032/practice-preview**; no sustituir localhost por 127.0.0.1 en el sitio. La configuración de cabeceras se evalúa al compilar: recompilar con estos valores para la revisión, y sin flags para builds normales. El servidor del motor se detiene con Ctrl+C. Estos pasos no despliegan ni conectan una cuenta Supabase real.

Para automatización, detener los dos servidores manuales (la suite usa esos puertos), instalar Chromium de Playwright y ejecutar:

```powershell
node sandbox-runtime/node_modules/playwright/cli.js install chromium
npm test
npm --prefix sandbox-runtime test
npm --prefix sandbox-runtime run test:browser
```

La suite levanta y detiene los dos servidores locales con datos ficticios. `CODEZERO_BROWSER_EXECUTABLE` permite usar un Chromium de pruebas ya instalado. En esta sesión la descarga estándar de Playwright falló; se utilizó Chromium 153.0.8010.0 obtenido para pruebas temporales desde el paquete @sparticuz/chromium, sin agregar ese paquete al producto.

## Validación y pendientes

- 96 pruebas unitarias del proyecto y cuatro del protocolo/servidor del motor aprobadas: **100 en conjunto**. No incluyen los 19 checks SQL de la entrega Enterprise anterior, que no se repitieron al no cambiar datos/RLS.
- Build Next.js/TypeScript aprobado con configuración ficticia sandbox. Auditoría de dependencias del motor sin vulnerabilidades reportadas al ejecutar la revisión.
- Suite Chromium real: Python, errores, cookies/origen, rechazo de mensaje falsificado, timeout, recuperación, red bloqueada hacia el sitio, límite de salida, cancelación de Worker activo, SQLite con fixtures, reinicio de datos, filas máximas, consulta larga y vista móvil.
- Revisión estática sobre nueve archivos JS/TS nuevos o modificados: seis reglas y cero hallazgos. Escaneo de secretos sin hallazgos, sin ampliar exclusiones. Las llamadas SQL se implementaron con sentencias preparadas, sin suprimir el chequeo de shell.

Antes de activar para usuarios: memoria/rendimiento, Firefox/WebKit y teléfono físico; dominio de ejecución separado y empaquetado/caché; ampliar ejercicios y comprobar pedagogía; integrar persistencia privada sandbox con versión de contenido y consentimiento. La publicación y producción siguen pendientes de aprobación específica. Auth/SMTP de Enterprise conserva el bloqueo por falta de Supabase de pruebas/Docker; conseguir Chromium desbloquea pruebas visuales, no ese E2E.

## Referencias primarias consultadas

- Pyodide, Workers de módulo: https://pyodide.org/en/stable/usage/webworker.html
- SQLite WASM, API OO1: https://sqlite.org/wasm/doc/trunk/api-oo1.md
- Distribución npm/SQLite: https://www.sqlite.org/wasm/doc/trunk/npm.md
- Aislamiento de iframe: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe

Estado y entrega incremental registrados en Facturación y planes, Módulos y cómo funcionan y Bitácora de CodeZero HQ. Parche: `CodeZero_browser_code_runtime.patch`, sobre `CodeZero_practice_learning.patch` y entregas anteriores.

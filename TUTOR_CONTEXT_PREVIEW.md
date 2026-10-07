# Tutor contextual · preparación aislada y estimación de costos

Entrega local del 7 de octubre de 2026. Rama `codex/modular-v2-approved`. No publicado.

## Qué cambió

Nueva vista `/tutor-preview` y API `/api/tutor-preview`, habilitadas únicamente con `CODEZERO_TUTOR_PREVIEW=1` y la guarda del workspace sandbox. La lección incorpora un enlace de revisión solo bajo esas condiciones. No cambia el endpoint `/api/ai/tutor` existente ni su interfaz comercial.

El navegador envía exclusivamente `lessonId` y `question`. Se rechazan contexto, identidad, score y otros campos aportados por el cliente. La sesión se verifica con `auth.getUser()` y perfil activo; el adaptador utiliza esa sesión, RLS y filtros explícitos por usuario para toda lectura privada, sin cliente administrativo.

Antes de preparar contexto, comprueba lección/nivel publicados, correspondencia entre IDs, plan y desbloqueo por evaluaciones publicadas previas. Mantiene las reglas de acceso existentes; no desbloquea niveles ni concede el add-on. Si falla una consulta, un prerrequisito falta o el catálogo es incoherente, rechaza la preparación.

Contexto acotado: versión, nivel, títulos, hasta 2.500 caracteres de lección, estado registrado de la lección y recuento de hasta 20 intentos recientes de sus ejercicios publicados. Son intentos, no ejercicios únicos ni nivel de dominio. No incluye respuestas, soluciones de exámenes, prompts evaluados, calificaciones, nombres, correo, IDs de cuenta ni datos de otras personas. El resumen de intentos no identifica cuál habilidad falló: esa taxonomía requiere evidencia y mapeo pedagógico posterior.

La vista permite revisar lo preparado y muestra explícitamente que no hay respuesta de IA. La pregunta no se guarda. Las respuestas de la API llevan `private, no-store`. La instrucción del borrador pide explicación breve, ejemplo alternativo y pregunta de comprobación; trata contexto/pregunta como datos. Es una orientación de prompting, no una garantía de impedir trampas o prompt injection.

## Formato OpenAI y límites

Se agregó un extractor reutilizable para la respuesta REST `output[].content[]`, sin depender del helper `output_text` del SDK. Maneja items de razonamiento antes de mensajes, varios bloques de texto, rechazo, salida incompleta, error y tamaño excesivo. No se conecta todavía al endpoint existente; su sustitución exige integración y evaluación.

Borrador: `store:false`, `max_output_tokens:768`, pregunta máxima de 2.000 caracteres, sin herramientas ni conversación persistente. El borrador no incluye modelo ni constituye una llamada completa. Faltan selección/configuración de modelo, credencial, medición y presupuesto atómico, derecho/quota y activación explícita del proveedor. `store:false` controla almacenamiento de Responses; no se presenta como Zero Data Retention ni ausencia de todo registro del proveedor.

No hay llamadas al proveedor, escritura de aprendizaje, cambios de cuotas ni lectura de OPENAI_API_KEY en esta revisión. No se implementó un presupuesto monetario ni se activó Tutor para venderlo.

## Estimación de IA por usuario

Modelo de referencia: GPT-6 Luna, tarifa Standard de contexto corto verificada el 7 de octubre de 2026: USD 0,10 por millón de tokens de entrada y USD 0,50 de salida. No se asume caché, Batch/Flex/Fast ni procesamiento regional.

Los tokens siguientes son supuestos, no resultados de tokenización o uso real. Entrada por llamada debe incluir instrucciones, contenido e historial. Salida significa tokens facturables, incluido razonamiento cuando aplique. El Simulador sigue Próximamente; no se construyeron sesiones conversacionales.

| Escenario mensual | Llamadas | Entrada/salida por llamada | USD de tokens | MXN con supuesto 20/USD |
| --- | --- | --- | --- | --- |
| Tutor: 100 consultas | 100 | 2.500 / 768 | 0,0634 | 1,27 |
| Simulador: 20 sesiones, 8 turnos | 160 | 3.500 / 1.000 | 0,1360 | 2,72 |
| Simulador amplio: 20 sesiones, 20 turnos | 400 | 10.000 / 1.500 | 0,7000 | 14,00 |

**20 MXN/USD es un supuesto editable; no se consultó el cambio actual.** Calculadora interactiva en la vista de revisión. Rechaza valores inválidos y no interviene en checkout, precios o cobros. No incluye impuestos, conversión/comisiones, reintentos, moderación, herramientas ni infraestructura. Historial creciente, modelos distintos o llamadas adicionales cambian el costo. No representa costo total, margen garantizado ni presupuesto enforceable. Verificar tarifas de nuevo antes de activar.

## Validación

- 115 pruebas unitarias del proyecto aprobadas: 14 nuevas de payload, autorización contextual, errores de lectura, límites, formato REST y estimaciones. Fixtures de datos/contratos; no sesión Auth real.
- Build Next.js/TypeScript aprobado con configuración local ficticia de revisión.
- Siete grupos HTTP/Chromium aprobados: rechazo de origen ajeno/usuario anónimo, vista móvil con login sin respuestas ficticias ni requests externos, calculadora y errores de conversión, IDs inválidos, flag apagado, ref productivo bloqueado y VERCEL_ENV=production bloqueado. Móvil 390×844 sin overflow horizontal; no verifica la interfaz autenticada ni la calidad de una respuesta de IA.
- Semgrep: ocho archivos de aplicación, seis reglas, cero hallazgos. Escaneo de secretos: cero hallazgos, sin nuevas exclusiones.
- Se verificaron solamente metadatos de columnas de niveles/intentos mediante consulta READ ONLY al proyecto conectado. No se leyeron registros de alumnos ni se escribió en producción.
- No se modificó SQL/RLS/Auth/cuotas/Stripe. Los 33 checks PostgreSQL de la entrega anterior conservan su alcance; no se repitieron para estas consultas nuevas. No se afirma E2E Supabase ni evaluación de respuestas reales.
- 0 despliegues, 0 correos, 0 llamadas pagadas de IA.

## Reproducir

Para smoke de guardas y vista anónima, desde el checkout preparado en Windows/PowerShell:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "validation-placeholder"
$env:NEXT_PUBLIC_APP_URL = "http://localhost:3234"
$env:CODEZERO_ENVIRONMENT = "sandbox"
$env:CODEZERO_WORKSPACE_SANDBOX = "1"
$env:CODEZERO_SANDBOX_PROJECT_REF = "local"
$env:CODEZERO_TUTOR_PREVIEW = "1"
npm run build
npm test
node sandbox-runtime/node_modules/playwright/cli.js install chromium
node scripts/tutor-preview-browser-check.mjs
```

La suite inicia/detiene Next en el puerto 3234. `CODEZERO_BROWSER_EXECUTABLE` puede indicar un Chromium de pruebas ya instalado. El placeholder solo sirve para revisión anónima: no permite login ni lectura de aprendizaje. Para contexto autenticado usar un Supabase separado con esquema MVP, sesión real y credenciales configuradas de forma segura. No reutilizar configuración Live ni pegar secretos en Notion/chat.

## Bloqueos y siguiente fase

Supabase conectado continúa mostrando solo `codezero` productivo (`kwfzhpapvpdatdfwhouf`) y ninguna rama. La autorización previa cubre pruebas aisladas, no usar producción como sandbox. Se necesita un proyecto de pruebas separado conectado y el esquema MVP para validar Auth→API→RLS→contexto con cuentas Free/Starter/Pro, suspensión, lecciones bloqueadas y accesos cruzados.

Tras esa validación: presupuesto con reserva atómica y conciliación, consumo/compensación de consulta con idempotencia, timeout y manejo de costos incluso si el proveedor falla después de generar; evaluar prompts con datos originales/sintéticos, comprobar calidad pedagógica, rechazos y salida incompleta; después reemplazar el endpoint actual. Activar derechos de Pro y compras modularizadas requiere su fase de integración y aprobación específica de cuotas/producción. Stripe Live y despliegues programados siguen sin intervención.

## Fuentes primarias

- Responses y diferencia REST/SDK: https://developers.openai.com/api/docs/guides/migrate-to-responses
- Límite de salida e instrucciones: https://developers.openai.com/api/reference/python/resources/responses/methods/create
- Modelo/tarifas de referencia: https://developers.openai.com/api/docs/models/gpt-6-luna
- Supabase SSR: https://supabase.com/docs/guides/auth/server-side

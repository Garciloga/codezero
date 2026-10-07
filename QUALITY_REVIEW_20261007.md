# CodeZero · revisión ampliada del 7 de octubre de 2026

## Cambios

- Traducciones EN/PT-BR/FR: 189 entradas editoriales revisadas y 40 textos nuevos de ejemplos escritos en los tres idiomas. Se corrigieron significados técnicos incorrectos (funciones, ramas/merges, listas/pilas/colas, recursión, exámenes, principiantes, cobros), estados de soporte, categorías, frases y terminología. Se preservan código, operadores lógicos, identificadores, nombres y mensajes del usuario. El resto del catálogo conserva traducción automática con glosario: esta revisión no equivale a una revisión nativa exhaustiva de cada párrafo.
- Diez ejemplos complementarios que cubren los quince niveles, con explicación resuelta, caso de error, variante y recurso oficial. Aparecen en las lecciones autorizadas y permanecen fuera del catálogo global del cliente. No son respuestas oficiales de evaluación. Los dos ejemplos Python y los SQL de LEFT JOIN e idempotencia se ejecutaron localmente y dieron los resultados previstos.
- Accesibilidad: enlace de salto primero en el orden de teclado, destino enfocable, reflow de tarjetas/controles/código, botones de al menos 44 px y mensajes de soporte con colores del tema. Se corrigió contraste de errores y navegación en modo oscuro.
- Soporte: ticket, mensaje, estado y auditoría se guardan en una transacción; los fallos no dejan conversaciones o cambios parciales. Las escrituras directas del cliente se revocan después del despliegue de los nuevos handlers, conservando lectura por RLS y evitando una interrupción durante la actualización.
- Rendimiento: una verificación de Auth compartida por locale y perfil en cada render; compilación reutilizable de diccionarios estáticos, limitada a los cuatro idiomas y sin guardar sesiones/usuarios globalmente. Se eliminaron precargas automáticas de cabecera, pie y vínculos legales del acceso. La matriz WebKit dejó de presentar los errores de precarga observados inicialmente.
- Documentación: HQ, facturación, módulos, técnica, soporte y decisión modular histórica en Notion distinguen estado vigente de antecedentes. Operación y control conserva commit/deployment/evidencia de publicación. El procedimiento de recuperación describe exportación, roles/esquema/datos, historial, Storage, Auth/configuración, cifrado, restauración aislada y verificación.

## Evidencia local

| Control | Resultado |
|---|---|
| Pruebas de aplicación | 168 aprobadas |
| Cobertura de traducciones | 2,925 ocurrencias de textos de código/contenido versionado; 0 faltantes |
| Recorrido real de handlers de aprendizaje con SDK/Auth simulados | 9 comprobaciones: lección, ejercicio incorrecto/correcto, rollback, bloqueo/aprobación de proyecto, examen reordenado, certificado incluido y replay |
| PostgreSQL de integración de aprendizaje | 10 comprobaciones de permisos, examen/cuota atómicos, certificados e idempotencia |
| PostgreSQL de soporte | 9 comprobaciones: creación, privacidad, roles, respuesta, reapertura, cierre y rollback |
| Equipos/práctica/lista de espera | 33 comprobaciones PostgreSQL |
| Customer Success | 9 comprobaciones PostgreSQL |
| Registro/perfil | 6 casos |
| Recuperación | Simulacro PostgreSQL local: datos, roles, RLS y denegación anónima |
| Compilación/TypeScript, auditoría npm y secretos | Aprobados; 0 vulnerabilidades npm y 0 hallazgos de secretos |
| Navegadores | Chromium, Firefox y WebKit: matriz completa aprobada |

La matriz de navegador usa la aplicación compilada y Auth/PostgREST/RPC locales ficticios. Comprueba cuatro idiomas, recarga/navegación, precios/metadatos, validación interactiva, preferencia por cuenta y sesión, conservación de nombres/valores de formularios, lección/examen, búsqueda de ayuda, creación de ticket, handler real de respuesta administrativa, respuesta del alumno y cierre. PostgreSQL se verifica aparte con las migraciones reales; el fixture de RPC del navegador no demuestra una transacción cloud.

Axe-core 4.11.1: controles WCAG 2 A/AA, 2.1 AA y 2.2 AA en login inválido con los cuatro acentos de color en claro/oscuro; perfil, ayuda, tickets y lección en claro/oscuro, incluidos detalles abiertos. Reflow a 320/768/1440 px, móvil 390 px, zoom CSS 200/400 %, Escape y retorno de foco del menú, y salto al contenido por teclado. Se comprueban idioma del documento, etiquetas, relaciones de errores, estados y semántica para tecnología asistiva.

**Límites:** no se usaron lectores físicos NVDA/JAWS/VoiceOver ni dispositivos Safari/iOS reales. WebKit es el motor de Playwright. Zoom CSS y reflow no sustituyen todas las combinaciones de zoom nativo/tecnología asistiva. El recorrido de aprendizaje se prueba con handlers y PostgreSQL locales; no se presenta como una graduación de una cuenta real de producción. Los tests no envían mensajes a personas, correos ni pagos.

## Controles permanentes

CI bloquea nuevos textos detectados sin traducción, revisa snapshots del currículo/FAQ y protege glosario, código literal y tamaño del catálogo UI. Los cambios editoriales directos en Supabase deben actualizar sus snapshots: CI no lee datos privados de producción. El nuevo job ejecuta la matriz Chromium/Firefox/WebKit sobre fixtures, además de las pruebas de handlers y PostgreSQL de soporte/aprendizaje.

Catálogo UI EN: 195,578 bytes (66,306 gzip); PT: 202,055 (64,888 gzip); FR: 208,859 (70,572 gzip). Presupuesto de regresión: 230,000 bytes por catálogo sin compresión. Estos tamaños corresponden al archivo JSON; no son el tamaño total de página ni los bytes exactos del protocolo RSC. El currículo se mantiene en servidor. Todavía se envía el catálogo UI completo del idioma elegido: una división adicional por ruta es una optimización posible, no un requisito ya implementado.

La comprobación pública repetible está en `scripts/production-localization-check.mjs`; registra TTFB, DOM ready y bytes del documento de precios por idioma. Los tiempos observados dependen del proxy, conexión y calentamiento y no establecen un SLO ni una prueba de carga.

## Recuperación cloud y validación real

Organización Supabase confirmada en Free (`tier_free`). Se completó el procedimiento en `DISASTER_RECOVERY.md` según documentación oficial. No se obtuvo un dump cloud ni se ejecutó una restauración real; no están contratados backups diarios de plan pagado ni PITR. La operación necesita conexión/contraseña de base de datos y destino privado para copias cifradas. Storage binario y configuración/secretos se recuperan aparte. El RPO/RTO actual no está garantizado.

Validación real pendiente de accesos: sesión de alumno/operador sin alterar datos existentes, correo de confirmación/recuperación y restauración cloud aislada. Las verificaciones públicas anónimas sí pueden ejecutarse después del despliegue. Tutor IA permanece desactivado.

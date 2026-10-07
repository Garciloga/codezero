# Career Guidance · Fase 0 interna

Estado: implementación para revisión, datos exclusivamente sintéticos.

## Entrada y acceso

- Ruta oculta: /internal/career-lab. No se añade a navegación ni sitemap.
- Página y POST /api/internal/career-lab verifican sesión con getUser y consultan únicamente role/status del perfil existente.
- Solo role=owner y status=active. Admin, usuarios, perfiles ausentes y suspendidos quedan fuera.
- El endpoint rechaza otro Origin, contenido no JSON y cuerpos de más de 4096 bytes; responde sin caché.
- La autenticación puede renovar cookies de sesión. No se escriben señales, feedback, consentimientos o resultados Career Guidance.

## Diagnóstico de prueba

Ocho actividades cerradas, hasta tres comparaciones adaptativas, validación del transcript completo en cada petición. El servidor deriva señales; no admite scores, texto personal, CV, experiencia libre o pesos enviados por el navegador. Se verifica versión del modelo, orden, límites de opciones y duplicados.

Rúbrica provisional: opciones de las primeras siete actividades producen valores .85/.4/.15 en dimensiones de la actividad. La octava elección y comparaciones aportan preferencia. Esto ensaya el recorrido y no sustituye las futuras tareas abiertas, evaluación de entregas o validación empírica.

35 escenarios: 16 canónicos, 16 mezclas de frontera y tres casos de evidencia ausente, escasa y en conflicto. Los canónicos se derivan de la matriz existente: no prueban utilidad real. Las mezclas usan el vecino del catálogo, no representan necesariamente una pareja de roles similares.

Se muestran confianza, afinidad, explicaciones, cobertura por posición, gates de experiencia y tensión capacidad/preferencia. Variables faltantes se mantienen ausentes. Management queda fuera del top 3 inicial y disponible como progresión.

## Aprendizaje por decisiones

Las 16 posiciones incluyen tarea, entrega, criterio de revisión y ejemplo. El usuario puede explorar cualquiera independientemente del diagnóstico y elegir fundamentos, práctica guiada o reto autónomo. Las decisiones cambian el siguiente objetivo y el nivel de apoyo. Puede volver a fundamentos, cambiar de módulo o elegir otra práctica. Afinidad no bloquea navegación.

Estas fichas son una primera capa educativa, no cursos completos ni módulos comercializados. No se cobran, habilitan suscripciones, reciben entregas ni certifican competencias en Fase 0.

Feedback, respuestas y decisiones viven temporalmente en el estado de pantalla. Reiniciar, deshabilitar la simulación o recargar elimina ese estado; no se usa almacenamiento del navegador.

## Verificación y siguiente fase

Pruebas: gates de acceso, validación maliciosa, replay y límites adaptativos, cobertura de escenarios, datos faltantes, experiencia independiente de afinidad y privacidad del código.

Antes de beta: validar rúbricas con revisores, ampliar actividades discriminadoras a desempeño real, crear contenidos completos por módulo, revisar consentimiento/retención/exportación y probar migraciones aisladas. Añadir rate limiting distribuido y observabilidad mínima antes de habilitar escrituras. Fase 0 no usa el limitador existente porque escribe en la base; sus entradas, tamaño y cálculo están acotados y el acceso es owner-only.

No se ha aplicado el schema borrador ni habilitado datos reales. El despliegue productivo y una prueba autenticada con el propietario son verificaciones separadas del build y de las pruebas locales.

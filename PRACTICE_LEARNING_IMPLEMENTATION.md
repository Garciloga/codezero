# Práctica y brechas · entrega aislada del 7 de octubre de 2026

## Estado contrastado

Se leyó “Ventajas, desventajas y competencia” de CodeZero HQ y se contrastó con código y esquema productivo mediante consultas de solo lectura. `exercises.kind` existe, pero `exercises_options_four_check` exige cuatro opciones y `exercise_solutions_answer_check` restringe respuestas A–D; `/api/exercises/submit` también. El campo por sí solo no habilita respuestas abiertas. No se modificó el esquema, las cuotas ni esa evaluación.

Precios ya omite Tutor y mantiene Equipos como **Hablar con nosotros**. No hay promesa de SSO en la pantalla pública de precios. Enterprise continúa siendo obligatorio como desarrollo, con la capa sandbox anterior; no se retrocede a “no construir”. El CTA sigue Contacto hasta validar Auth/SMTP, equipos reales y facturación. No se propone SSO para el MVP. No se modificó Stripe ni se desplegó.

Tutor tiene endpoint y cuota existentes, pero la pantalla envía contexto genérico y el endpoint recibe contexto del cliente: todavía no obtiene por sí mismo la lección autorizada y los errores recientes. Tener API key no acredita que esté listo para venta. Falta contexto obtenido en servidor, comprobar derechos/acceso, presupuesto y tiempo límite, lectura correcta de la respuesta del proveedor, pruebas de impago y evaluación pedagógica sin filtrar respuestas evaluadas. No se cambió el Tutor ni se hicieron llamadas pagadas.

## Implementado en revisión

- `/practice-preview`, **404 por defecto**; `CODEZERO_PRACTICE_PREVIEW=1` solo para revisión. Noindex; datos originales ficticios, sin acceso a datos personales ni soluciones oficiales. El flag no es autorización para publicar ni sirve para proteger datos privados.
- Seis muestras cubren ordenar pasos, completar huecos, encontrar errores y predecir salidas: lógica, Python, SQL, comunicación y seguridad. Ordenamiento con botones y etiquetas para teclado; feedback explicativo y evidencia sugerida.
- Cinco laboratorios de APIs, uno por nivel 11–15: firma de webhook, OAuth/scopes, mapeo CRM/facturación, rate limit y duplicación de efectos. Se arma método, ruta, token ficticio, JSON e hipótesis. Simulación pura local, sin fetch ni ejecución de código. La respuesta 200 es del reporte del simulador: **no significa que se reparó la integración**.
- Objetivos elegibles: CS técnico, soporte e integraciones. Brechas calculadas solamente a partir de las muestras de la sesión, sin confundir afinidad, autoevaluación y dominio acreditado. Plan semanal con responsable, fechas elegidas por el usuario y evidencia a entregar. No se guarda ni acredita.
- Checklist de siete días y pulso de una pregunta como prototipos locales. La respuesta no se envía, guarda o publica. No se presenta como testimonio autorizado.
- Link contextual desde lección solo con el flag, después del control de plan y desbloqueo ya existente. La revisión permite explorar otras muestras ficticias; no habilita cursos ni contenido de pago.
- Mensaje público sobre texto y ejemplos consultables en celular, sin prometer resultados medidos de consumo de datos.

Todo estado interactivo es temporal en memoria; se pierde al recargar. No alimenta exámenes, diplomas, cuota mensual, recomendaciones oficiales o reportes de empresa. No es todavía práctica ejecutable ni un módulo comercial activo. No se activó el add-on Laboratorios.

## Secuencia de integración

1. **Entrega presente:** formatos formativos + laboratorios de APIs + propuesta de brechas, checklist y pulso. Verificar build, lógica y rutas. Revisión visual/móvil y prueba de aprendizaje con beta aún pendientes.
2. **Código ejecutable:** Pyodide para Python y SQLite WASM para SQL, carga bajo demanda y versión fijada. Worker con reinicio/terminación por tiempo, límites de salida/código y pruebas de bucles/consultas largas. Un Worker mejora la respuesta de UI, **no es aislamiento de seguridad por sí solo**: usar origen separado sin sesión/credenciales y CSP que controle red; datos sintéticos y almacenamiento efímero. Verificar restricciones antes de habilitar imports o red. No ejecutar código de alumnos en el servidor. No cambiar headers de Auth/producción para satisfacer SharedArrayBuffer sin análisis y aprobación. Sin prometer costo total cero: evita cómputo de servidor por ejecución, pero hay descarga de WASM, entrega de assets y mantenimiento. Sin archivos runtime ni dependencias nuevas en esta entrega.
3. **Persistencia sandbox:** un catálogo versionado de prácticas y evidencias separado de los ejercicios A–D evita romper compatibilidad. Intentos privados, idempotencia y RLS por usuario; borradores/auto-check separados de evidencia aprobada. Validación final y rúbricas de examen/proyecto siempre en servidor. Diseñar mapeo lección/examen/proyecto→competencia antes de afirmar una matriz de dominio. No convertir los conteos actuales de actividades Enterprise en puntuación psicométrica.
4. **Diagnóstico y acción:** orientación gratuita vinculada a objetivo y evidencia inicial; distinguir “sin evidencia” de “no competente”. Muestra de tarea + rúbrica transparente + revisión con próximos pasos. Ruta personalizada conserva requisitos y desbloqueos; responsable y fechas son explícitos, sin asignaciones automáticas no consentidas. El diagnóstico de afinidad existente permanece intacto. Diagnóstico profundo de pago sigue Próximamente.
5. **Equipos/evidencias:** completar E2E del sandbox autorizado, invitaciones y permisos; selección de catálogo en lugar de IDs manuales; asignación, avance, matriz basada en evidencia, registro de errores y exportaciones con alcance jerárquico verificado. Proyectos con rúbrica original, historial y visibilidad elegida del portafolio. Diploma privado por bloque distinto del certificado público verificable comercial. Cobro por asiento y lanzamiento requieren aprobación correspondiente; no prometer SSO.
6. **Contenido y beta:** producir videos, comprobar subtítulos/guion/ejemplos y colocar cada video solo cuando exista. Elegir con Isaac el canal y horario de dudas; no hay grupo, invitaciones, eventos o automatizaciones creados. Pilotear primero frecuencia quincenal y ajustar según dudas/asistencia, sin anunciar disponibilidad inexistente. Guardar pulso privado con consentimiento y retención definidos; permiso de uso como testimonio separado. Validar con usuarios antes de ampliar catálogo.

## Producción de 15 videos · guiones propuestos, no producidos

Duración objetivo 3–5 minutos cada uno. Estructura original: situación real (30 s), idea/ejemplo (2 min), error frecuente (1 min), actividad y evidencia (30–60 s). Texto equivalente y subtítulos; sin autoplay. Enfocar cada introducción al objetivo y no duplicar el texto de todas las lecciones.

| Nivel | Tema del video | Actividad de cierre |
|---|---|---|
| 1 | Descomponer un onboarding | Ordenar objetivo, aceptación y prueba |
| 2 | Valores, tipos y variables en Python | Predecir una salida |
| 3 | Funciones y errores de tipos | Corregir una entrada |
| 4 | Elegir una estructura de datos | Explicar una búsqueda |
| 5 | Git y colaboración | Revisar un cambio pequeño |
| 6 | SQL para preguntas de negocio | Filtrar cuentas activas |
| 7 | Petición desde una interfaz web | Leer request y respuesta |
| 8 | Contrato y errores de una API | Diferenciar 400, 401 y 403 |
| 9 | Pruebas que comprueban comportamiento | Definir aceptación y fallo |
| 10 | Evidencia del primer proyecto | Explicar una decisión y una prueba |
| 11 | Webhooks y firma | Diagnosticar invalid_signature |
| 12 | OAuth y mínimo privilegio | Detectar insufficient_scope |
| 13 | Mapear sistemas empresariales | Validar IDs y unidades |
| 14 | Resiliencia y seguridad | Plan de backoff e idempotencia |
| 15 | Defender una integración | Redelivery, efectos y runbook |

## Reglas de alcance y autoría

Matriz, brechas, plan de acción, formación de equipos, evidencias, onboarding y pulso se adoptan como ideas de producto del texto de Isaac. **No se verificaron ni se afirman funcionalidades de Factorial o GlobalSuite**. No copiar guías internas, documentación, rúbricas, interfaces o material propietario. Contenido de esta entrega original y ficticio. Tampoco repetir la afirmación no contrastada “ningún competidor lo tiene”.

La práctica contextual, la explicación y la defensa de proyectos aportan evidencia; no bloquean de forma absoluta IA externa ni otro dispositivo. No se agregaron bloqueos de pegado, vigilancia o etiquetas automáticas de fraude.

## Fuentes técnicas primarias para la fase ejecutable

- Pyodide, uso y Web Workers: https://pyodide.org/en/stable/usage/index.html
- SQLite WASM, Worker API: https://www.sqlite.org/wasm/doc/tip/api-worker1.md
- SQLite, demo y recomendación de Worker para evitar bloquear UI: https://www.sqlite.org/wasm/doc/trunk/demo-123.md

Validaciones y estado final se registran en Notion. Esta entrega incremental se aplica después de `CodeZero_enterprise_sandbox.patch` y las entregas anteriores. Producción y Stripe Live sin cambios; despliegues programados conservan estado pausado.

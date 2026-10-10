# Garciloga — Paquete de preparación y control del roadmap
Fecha: 10 de octubre de 2026. **Rama exclusiva de borrador PR #42. No fusionar ni desplegar a producción sin validar.**

## Qué está preparado y qué todavía no
Hay 12 programas o módulos de Borrador, dos aplicaciones Coming soon y cuatro decisiones o funciones On Hold registradas en Notion. Esta carpeta reúne la documentación y las pruebas de integridad, pero no considera terminados los productos cuya funcionalidad no está implementada.

## Inventario por iniciativa
| Iniciativa | Trabajo guardado en rama | Falta para ser desplegable |
| --- | --- | --- |
| GRC avanzado | Autoría, casos, prácticas, planes de 15 niveles | Revisión GRC/ISO, banco de exámenes en servidor y traducciones |
| Detector de red flags | Curso y banco de decisiones | Calibración, escenarios encadenados y progreso persistente; no es clasificador de clientes |
| Cross-sell | Lecciones y prácticas de venta cruzada | Revisión comercial, evaluación avanzada y progreso |
| Upsell | Razonamiento de precios y casos sintéticos | Validar supuestos, rúbrica, progresión e idiomas |
| Retención | Cohortes, indicadores y decisiones sintéticas | Validación de GRR/NRR, progreso, rúbrica e idiomas |
| Onboarding corporativo 30-60-90 | Autoría, 15 niveles propuestos y prácticas | Flujo organizacional, permisos de documentación, revisiones y progreso |
| IA aplicada al puesto | Curso de uso responsable con pruebas | Revisión de datos, seguridad, autoría y motor de evaluación; no incluye Tutor IA |
| Idioma profesional | Casos EN/PT planificados, prácticas en español | Revisión por hablantes nativos y evaluación oral/escrita accesible |
| Evaluación de candidatos | Diseño de pruebas laborales no decisorias | Consentimiento, privacidad, accesibilidad, revisión de equidad; prohibidas decisiones automáticas |
| Laboratorio de métricas | Casos con datos sintéticos y cálculos | Referencias verificadas, resultados reproducibles y motor de evaluación |
| Empleabilidad | Casos de CV, evidencia y entrevistas | Compartir con consentimiento, portfolio, rúbricas e integración |
| Kit del manager | Casos de 1:1, refuerzos y competencia 0–4 | Flujos completos, permisos, historial y progreso real |
| Aplicación Android | Tarjeta Coming soon y alcance preliminar | Tecnología, cliente móvil, QA físico, seguridad, tienda; sin app binaria |
| Aplicación iOS | Tarjeta Coming soon y alcance preliminar | Tecnología, cliente móvil, QA físico, seguridad, App Store; sin app binaria |
| Leaked Password Protection | Documentación de seguridad | Depende de plan Supabase y decisión de presupuesto. No activar un plan pagado |
| Plan anual/precio fundador | Condiciones propuestas, sin código de cobro activo | Decisión de precios, fiscalidad, Stripe Test y aprobación |
| Lanzamiento con testimonios | Registro de iniciativa de marketing | Testimonios verificables, consentimiento, validación legal y lanzamiento |
| Pruebas compra/cancelación/pago fallido | Pendiente comercial documentado | Sandbox de pagos autorizado, casos end-to-end sin dinero real |

## Guía de asignación y competencias
**Flujos actuales:** un responsable autorizado puede asignar actividades publicadas o refuerzos conforme al plan. **Flujo en borrador:** planificador de cursos completos por organización, equipo, empleado, competencia principal e intensidad. Se almacena un plan en sandbox, no una matrícula en producción. El endpoint y formulario están apagados por defecto; la migración es exclusivamente de sandbox.

El responsable selecciona organización, abre Personas > Ficha de aprendizaje, verifica puesto/evidencia, escoge curso y prioridad, configura fecha e intensidad, y envía su plan solo si conserva el permiso adecuado. El permiso de ver equipo no es permiso de asignar; el backend debe comprobar jerarquía, membresía y alcance. La revisión humana puntúa conducta y evidencia observable, nunca personalidad ni desempeño laboral real inferido.

## Inventario académico verificable y deuda restante
El código contiene **246 unidades originales y 1,230 ejercicios de borrador** en 12 paquetes. El mapa de 15 etapas propone 180 niveles y 1,080 futuras unidades. No equivale a 1,080 lecciones completas. Cinco prácticas por unidad, requisitos de evidencia, mínimo por dimensión, cero faltas críticas y revisión humana son políticas editoriales, aún sin conexión completa al progreso de alumnos.

El script `scripts/roadmap-draft-gate.mjs` se incorpora al CI y valida el conteo, formatos de práctica, etiquetas Borrador, controles de revisión, mapa de 15 niveles, manual y que las asignaciones no puedan activarse fuera de sandbox. Es una comprobación **estática**: no reemplaza pruebas integrales con usuarios, seguridad o calidad de contenido.

## Centro de ayuda y venta
La rama de borrador amplía `/guides/companies`: siete pasos esquematizados, doce fichas de módulos, configuración de competencias y **39 preguntas frecuentes**. Los esquemas de procedimiento no son capturas de interfaz real. Para traducciones ES/EN/PT/FR se necesita verificación nativa; el manual extenso está originalmente en español. `/help` aún consulta preguntas dinámicas de Supabase y no heredará esta guía hasta implementar su sincronización.

## Android/iOS — especificación preparatoria, no app desarrollada
Priorizar una experiencia móvil web adaptable; antes de elegir PWA o app nativa, decidir seguridad de sesiones, cifrado/caché, revocación, offline, conflictos de entrega, notificaciones por consentimiento, multiempresa, revisión de privacidad y costos de publicación. Mantener ambas iniciativas en Coming soon sin fecha.

## Pruebas y orden correcto de publicación
1. Ejecución de `node scripts/roadmap-draft-gate.mjs`, `npm test`, `npm run typecheck` y `npm run build`, más tests de PostgreSQL descartable y seguridad.
2. Corregir el fallo WebKit de navegación y revalidar Chromium, Firefox y WebKit en el mismo SHA. Se deshabilitó prefetch automático de enlaces secundarios de marketing para reducir solicitudes RSC, pendiente de confirmar en CI.
3. Revisar académicamente **cada** lección por materia, calibrar decisiones/consecuencias/rúbricas y revisar traducciones con especialistas.
4. Conectar asignación de cursos publicados a matrículas, cuotas, permisos, historial, revocaciones, progreso persistido, evaluación y aprobación en servidor; realizar pruebas con base aislada, no Supabase producción.
5. Validar accesibilidad real, dispositivos, usuarios, privacidad, facturación de prueba y soporte.
6. Solo con estas puertas verdes, hacer **un único merge y despliegue** tras verificar disponibilidad de Vercel; comprobar SHA y realizar smoke tests. Cambiar Notion de Borrador a Hecho únicamente después de éxito verificado.

**NO activar** nuevas compras, protección de contraseñas con cambio de nivel, producto de evaluación automática de candidatos ni aplicaciones móviles sin decisiones y validaciones externas. No tocar Stripe, suscripciones ni datos productivos para preparar este lote.
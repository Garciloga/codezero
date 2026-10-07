# CodeZero · Production checklist

Estado: producción técnica; apertura comercial condicionada. Estado vigente y límites de verificación: LOCALIZATION_RELEASE_20261007.md.

## Completado

- Vercel conectado a GitHub y despliegue automático desde `main`.
- Supabase Auth con confirmación de email.
- RLS habilitado y escrituras sensibles movidas al backend.
- RLS también aplica el acceso por plan al contenido: Free solo puede leer Nivel 1 directamente desde la base; planes de pago y owner/admin pueden leer la ruta completa.
- Cuotas ejecutadas únicamente con credenciales server-side.
- Rate limiting server-side añadido a Tutor IA, ejercicios, evaluaciones, proyectos, checkout, portal, perfil y operaciones administrativas.
- Acceso por plan y avance secuencial reforzado en páginas y APIs.
- Exámenes con soluciones ocultas y validación server-side.
- Capstones con revisión, reenvío y aprobación obligatoria antes del examen correspondiente.
- Stripe Live configurado con Starter, Pro y Enterprise.
- Checkout, Customer Portal y webhook firmado.
- Webhook con idempotencia, reintentos y estados de procesamiento.
- Política Free alineada con el acceso real.
- Encabezados de seguridad, robots.txt, sitemap y metadatos.
- Recuperación de contraseña.
- Páginas base de Términos, Privacidad y Reembolsos, con responsable, contacto, jurisdicción CDMX y política de no reembolso automático salvo error/cobro duplicado.
- Política para usuarios menores: autorización/supervisión de madre, padre o tutor y confirmación en registro.
- Página pública de contacto.
- Página pública de preguntas frecuentes.
- Exportación de datos personales desde el perfil, con límite de frecuencia y respuesta no cacheable.
- Auditoría administrativa para cambios de acceso y revisiones de proyectos, visible en el panel Admin.
- Tablas de soluciones y eventos de Stripe bloqueadas explícitamente para clientes; privilegios reducidos a service_role.
- CI de GitHub y builds de Vercel.
- Pruebas unitarias para reglas de acceso y protección same-origin.
- Dependabot configurado para dependencias npm y GitHub Actions.
- CodeQL configurado; su ejecución en el repositorio privado depende de la habilitación de GitHub Code Security. No cuenta como análisis aprobado.
- Smoke test automatizado de producción para home, pricing, login, páginas legales, robots, sitemap y encabezados de seguridad; ejecución diaria y manual desde GitHub Actions.
- QA de integridad de base de datos: 15 niveles, 92 lecciones, 184 ejercicios, 15 exámenes, 75 preguntas y sin soluciones faltantes en ejercicios o evaluaciones.
- Revisión de producción sin errores de runtime recientes y sin webhooks de Stripe fallidos.
- Currículo ampliado con práctica guiada y evidencia de dominio en las 92 lecciones.
- Las 92 lecciones cuentan con una capa editorial adicional: Nivel 1 con ejemplos resueltos y mini-retos; Niveles 2–15 con casos aplicados y retos extra.
- Banco de evaluación ampliado a 75 preguntas (5 por nivel) con claves completas y escenarios prácticos.
- Todas las lecciones tienen 2 ejercicios formativos: 16 en el Nivel 1 y 12 en cada nivel del 2 al 15 (184 ejercicios totales).
- Restricciones de integridad en base de datos para planes, estados, puntuaciones, cuotas y webhooks.

## Bloqueadores manuales antes de apertura pública

1. **Leaked Password Protection** queda diferido porque requiere un plan superior de Supabase.
2. **SMTP propio** queda diferido hasta contar con un dominio controlado. Se probó Resend con un subdominio gratuito compartido, pero el proveedor DNS bloquea los registros DKIM `_domainkey` necesarios para verificación.
3. Identidad pública y contacto legal básico ya añadidos; queda revisión legal/fiscal profesional antes del lanzamiento.
4. Obtener revisión legal/fiscal de Términos, Privacidad, Reembolsos e impuestos.
5. Obtener un dominio propio cuando haya presupuesto y entonces completar Resend + SMTP de Supabase.
6. La prueba real de pago queda omitida por decisión actual del producto. El flujo técnico de Stripe se mantiene configurado y podrá validarse más adelante si se decide retomarlo.
7. Si se habilita Tutor IA, añadir `OPENAI_API_KEY` directamente en Vercel y establecer un presupuesto/límite de gasto.

## Recomendado antes de una campaña pública

- Configurar CAPTCHA o protección anti-abuso en Auth.
- Revisar rate limits de Auth.
- Revisar backups y estrategia de recuperación.
- Probar manualmente registro, confirmación de email y recuperación de contraseña con cuentas de prueba separadas cuando SMTP propio esté disponible; probar también Free, Starter/Pro/Enterprise, cancelación y proyectos.
- Idiomas español, inglés, portugués y francés implementados; navegación móvil, Escape y foco probados en Chromium con datos sintéticos. La auditoría completa de accesibilidad sigue pendiente.
- El smoke test diario cubre disponibilidad pública y existe vigilancia horaria para errores nuevos de runtime y fallos de CI.
- Revisar métricas después de los primeros usuarios antes de eliminar índices marcados como “unused”.
- Mantener secretos fuera del repositorio y rotarlos si existe sospecha de exposición.
- Cuotas reforzadas como RPC server-only y rollback automático ante fallos internos/proveedor para no descontar uso injustamente.
- Estados de error/404, navegación por teclado y enlace de salto al contenido añadidos.
- Protección same-origin en POST iniciados desde navegador para reducir riesgo CSRF.
- Rutas privadas marcadas con X-Robots-Tag para evitar indexación.
- security.txt, SECURITY.md, runbook operativo y plan de Disaster Recovery añadidos.
- Checkout exige confirmación de autorización de pago y conserva metadatos de aceptación.

## Nota sobre contenido

La estructura completa de 15 niveles está implementada y el contenido fue ampliado, pero las 316 horas representan la ruta curricular estimada; antes de presentarlo como un programa editorial completamente terminado todavía conviene añadir más material visual, proyectos guiados extensos y recursos complementarios. La profundidad textual y práctica ya fue ampliada de forma sustancial.


## Estado de despliegue

Vercel vuelve a publicar `main`; el bloqueo diario documentado anteriormente no describe el deployment READY verificado el 7 de octubre. Cada publicación debe comprobar SHA, estado READY, CI y smoke test; el historial de preparación local no sustituye esa comprobación.


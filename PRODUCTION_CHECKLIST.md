# CodeZero · Production checklist

Estado: pre-lanzamiento técnico.

## Completado

- Vercel conectado a GitHub y despliegue automático desde `main`.
- Supabase Auth con confirmación de email.
- RLS habilitado y escrituras sensibles movidas al backend.
- Cuotas ejecutadas únicamente con credenciales server-side.
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
- CI de GitHub y builds de Vercel.
- Smoke test automatizado de producción para home, pricing, login, páginas legales, robots, sitemap y encabezados de seguridad; ejecución diaria y manual desde GitHub Actions.
- QA de integridad de base de datos: 15 niveles, 92 lecciones, 92 ejercicios, 15 exámenes, 45 preguntas y sin registros huérfanos en relaciones críticas.
- Revisión de producción sin errores de runtime recientes y sin webhooks de Stripe fallidos.
- Currículo, ejercicios y banco de examen mejorados respecto al seed inicial.

## Bloqueadores manuales antes de apertura pública

1. **Leaked Password Protection** queda diferido porque requiere un plan superior de Supabase.
2. **SMTP propio** queda diferido hasta contar con un dominio controlado. Se probó Resend con un subdominio gratuito compartido, pero el proveedor DNS bloquea los registros DKIM `_domainkey` necesarios para verificación.
3. Identidad pública y contacto legal básico ya añadidos; queda revisión legal/fiscal profesional antes del lanzamiento.
4. Obtener revisión legal/fiscal de Términos, Privacidad, Reembolsos e impuestos.
5. Obtener un dominio propio cuando haya presupuesto y entonces completar Resend + SMTP de Supabase.
6. Hacer una compra real de bajo riesgo cuando sea posible para verificar el ciclo completo de pago, renovación/cancelación y cambio de plan. No es necesario para seguir desarrollando.
7. Si se habilita Tutor IA, añadir `OPENAI_API_KEY` directamente en Vercel y establecer un presupuesto/límite de gasto.

## Recomendado antes de una campaña pública

- Configurar CAPTCHA o protección anti-abuso en Auth.
- Revisar rate limits de Auth.
- Revisar backups y estrategia de recuperación.
- Probar manualmente registro, confirmación de email y recuperación de contraseña con cuentas de prueba separadas cuando SMTP propio esté disponible; probar también Free, Starter/Pro/Enterprise, cancelación y proyectos.
- Revisar accesibilidad móvil y navegación por teclado.
- El smoke test diario ya cubre disponibilidad pública; queda añadir alertas externas para errores de runtime y webhooks fallidos.
- Revisar métricas después de los primeros usuarios antes de eliminar índices marcados como “unused”.
- Mantener secretos fuera del repositorio y rotarlos si existe sospecha de exposición.

## Nota sobre contenido

La estructura completa de 15 niveles está implementada y el contenido fue ampliado, pero las 316 horas representan la ruta curricular estimada; antes de presentarlo como un programa editorial completamente terminado conviene continuar enriqueciendo cada lección con más ejemplos, prácticas, material visual y proyectos guiados.

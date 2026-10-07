# CodeZero · Operations Runbook

Última actualización: 7 de octubre de 2026.

Este documento describe respuestas operativas básicas para incidentes de producción. No contiene secretos ni credenciales.

## 1. Aplicación no disponible

1. Revisar el estado del último deployment de producción en Vercel.
2. Revisar GitHub Actions para confirmar si el último commit compiló correctamente.
3. Consultar errores de runtime de Vercel y el endpoint `/api/health`.
4. Si el incidente coincide con un deployment reciente, usar el deployment estable anterior como candidato de rollback.
5. No modificar simultáneamente aplicación, base de datos y configuración: aislar una causa por vez.

## 2. Base de datos / Supabase

1. Revisar logs de Postgres/Auth según el flujo afectado.
2. Ejecutar Security Advisor después de cualquier migración DDL.
3. No desactivar RLS para resolver un incidente.
4. No exponer tablas de soluciones, eventos de Stripe ni credenciales de servicio al cliente.
5. Todas las migraciones de producción deben quedar versionadas en `supabase/migrations`.

## 3. Fallo en progreso, ejercicios o evaluaciones

1. Confirmar que el usuario puede acceder al nivel y que su cuenta está activa.
2. Verificar que la lección/ejercicio/examen existe y está publicado.
3. Revisar límites mensuales y `usage_monthly`.
4. Si una escritura falla después de consumir cuota, el backend debe ejecutar rollback de cuota.
5. Verificar que cada pregunta tenga solución antes de permitir el intento.

## 4. Proyectos Capstone

1. Un proyecto enviado inicia con estado `submitted`.
2. Una revisión menor a 70 debe quedar `needs_revision`.
3. Una revisión de 70 o más queda `approved`.
4. Los exámenes de niveles con Capstone requieren proyecto aprobado.
5. No modificar puntuaciones directamente salvo corrección administrativa documentada.

## 5. Stripe / facturación

1. Revisar `stripe_webhook_events` y el panel Admin.
2. Un webhook fallido debe conservar su error y número de intentos.
3. No reprocesar manualmente un evento sin revisar antes su ID e idempotencia.
4. El plan de una suscripción debe derivarse del Price ID configurado.
5. No cambiar secretos o Price IDs en producción sin verificar el entorno.
6. La prueba real de cobro está diferida por decisión actual; no es requisito para continuar desarrollo.

## 6. Cuenta o acceso comprometido

1. Suspender la cuenta afectada si existe riesgo activo.
2. Rotar cualquier secreto que pueda haberse expuesto.
3. Revisar logs relacionados con el periodo afectado.
4. No enviar secretos por chat, correo o tickets.
5. Documentar qué credencial fue rotada y qué servicios dependían de ella.

## 7. Secreto expuesto

1. Considerarlo comprometido aunque el mensaje o commit haya sido eliminado.
2. Revocar/rotar primero; limpiar el historial después.
3. Actualizar Vercel/Supabase/Stripe/Resend según corresponda.
4. Confirmar que el deployment nuevo usa la credencial nueva.
5. Revisar actividad anómala posterior a la exposición.

## 8. Correo transaccional

Actualmente SMTP propio está diferido hasta contar con un dominio controlado. Supabase puede seguir usándose para desarrollo dentro de los límites del proveedor, pero antes de una apertura comercial amplia debe configurarse dominio + Resend/SMTP y probar confirmación y recuperación de contraseña.

## 9. Contacto y escalamiento

Contacto operativo: codescerooficial@gmail.com

Para un incidente que afecte datos personales, pagos o acceso generalizado, priorizar contención y preservación de evidencia antes de cambios no esenciales.


## 10. Idiomas y contenido

El selector global admite es/en/pt/fr. La preferencia de la cuenta verificada prevalece sobre la cookie del visitante. Para volver al español, usar el selector; no editar permisos ni planes. Los catálogos y la guía de mantenimiento están descritos en LOCALIZATION_RELEASE_20261007.md. Cambiar contenido curricular exige actualizar sus traducciones y ejecutar `tests/localization.test.mjs`. Los nombres, entregas, código y mensajes escritos por usuarios se conservan literalmente.

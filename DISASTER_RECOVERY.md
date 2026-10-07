# CodeZero · Disaster Recovery

Última actualización: 6 de octubre de 2026.

Este documento define cómo recuperar CodeZero ante fallos graves sin incluir credenciales ni secretos.

## Objetivos

- Mantener el esquema reproducible desde las migraciones versionadas en Git.
- Evitar cambios manuales de base de datos que no queden registrados.
- Poder reconstruir la aplicación desde GitHub + variables de entorno seguras.
- Minimizar pérdida de datos y tiempo de recuperación según las capacidades del plan disponible.

## Fuentes de recuperación

1. **Código y configuración versionada**: GitHub, rama `main`.
2. **Esquema de base de datos**: `supabase/migrations`.
3. **Variables de entorno**: almacenadas en Vercel/Supabase/Stripe/Resend, nunca en el repositorio.
4. **Datos de producción**: dependen de las capacidades de backup/restauración del plan de Supabase.
5. **Facturación**: Stripe conserva su propio historial y no debe reconstruirse manualmente desde CodeZero.

## Recuperación de aplicación

1. Identificar el último commit estable en `main`.
2. Confirmar que CI pasó.
3. Volver a desplegar ese commit o promover un deployment estable.
4. Verificar `/api/health`, páginas públicas y rutas protegidas.
5. Revisar errores de runtime antes de declarar recuperación completa.

## Recuperación de base de datos

1. No ejecutar migraciones adicionales durante un incidente hasta conocer la causa.
2. Si la base sigue disponible, preservar evidencia y verificar consistencia.
3. Si se requiere reconstrucción, crear una base limpia y aplicar las migraciones en orden.
4. Restaurar datos desde el mecanismo de backup disponible en Supabase cuando exista.
5. Validar conteos, relaciones y RLS antes de reconectar tráfico.

## Verificación posterior

- Confirmar acceso por plan y RLS.
- Confirmar que soluciones de ejercicios/exámenes siguen siendo server-only.
- Verificar cuotas y uso mensual.
- Verificar proyectos, certificados y progreso.
- Verificar webhooks de Stripe e idempotencia.
- Revisar Security Advisor y logs.

## Limitaciones actuales

El proyecto usa un plan de Supabase con capacidades limitadas. Si no existe backup automático suficiente, la prioridad es mantener todas las migraciones versionadas y establecer un procedimiento de exportación periódica antes de una apertura comercial amplia. No se deben crear copias con datos personales en repositorios o almacenamiento público.

## Simulacro recomendado

Antes de escalar a más usuarios, realizar un simulacro de recuperación en un entorno separado: aplicar migraciones desde cero, crear una cuenta de prueba, completar una lección, un ejercicio y una evaluación, y verificar que RLS y cuotas funcionen.

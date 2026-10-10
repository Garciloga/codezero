# Garciloga · Hardening de aprendizaje y recuperación · 10 oct 2026

## Alcance de este PR
- Las lecciones por puesto requieren al menos un envío cuya evaluación de decisiones sea **íntegramente correcta**. Los proyectos continúan bajo revisión humana; un texto con suficientes caracteres no se considera por sí solo trabajo aprobado.
- Se actualiza el estado del alumno para no representar una respuesta incorrecta como una lección completada.
- La validación y el registro de intentos de las lecciones principales se trasladan a una RPC transaccional, con bloqueo por alumno+actividad, clasificación de cuota atómica y deduplicación de reintentos. La finalización se confirma también dentro de una RPC con comprobación de todos los ejercicios publicados.
- La API rechaza el envío de contenido no publicado. Se mantienen las comprobaciones de acceso por nivel y origen.
- La auditoría editorial automática revisa los ocho programas adicionales y su segunda práctica. Cada lección recibe un entregable escrito contextualizado para su profesión y caso, en ES/EN/PT/FR.
- La restauración de prueba deja de ignorar errores. No considera válida una copia si falla la restauración.
- No se modifican Stripe, precios, cuota máxima por plan ni Tutor IA.

## Bloqueo de salida y orden seguro
**NO FUSIONAR NI DESPLEGAR sin:**
1. Pruebas CI + Security completas, browser Chromium/Firefox/WebKit y pruebas SQL de posición aprobadas.
2. Revisión de la migración `20261010160000_professional_lesson_integrity.sql` y prueba de las dos nuevas RPC contra una base aislada con el esquema productivo. La migración debe aplicarse y verificarse **antes del código nuevo**, porque los handlers invocan estas RPC.
3. Confirmación de rollback que no borre datos: para revertir la aplicación, restaurar los handlers anteriores; luego pueden retirarse las nuevas funciones solo tras comprobar que no existen consumidores. Revertir la regla de aprobación de las rutas por puesto requiere una migración explícita revisada; no borrar tablas ni avances.
4. Smoke con cuenta aislada: envío incorrecto y correcto, bloqueo de examen antes de aprobar lecciones, deduplicación, cuota gratuita y adicional, e intentos contra contenido no publicado. Confirmar visualización en cuatro idiomas.
5. Estado READY, commit SHA y smoke después de la publicación si esta se autoriza expresamente.

## Riesgos y limitaciones conocidas
- La restauración de archivo de datos de Supabase puede requerir roles/esquemas/objetos de Auth, Storage y extensiones que el contenedor local no tenga. Ahora el job fallará en lugar de informar falsamente un respaldo verificado. No presentar el backup parcial como recuperación completa de Supabase.
- Los nuevos entregables escritos son contextualizados y variados, pero la calidad de la respuesta libre no se califica automáticamente. Requiere revisión humana para acreditación práctica; la aprobación automática recae solo en decisiones calificadas.
- Las lecciones que históricamente se registraron como entregadas con respuesta incorrecta dejan de contarse como aprobadas para desbloquear futuros exámenes. No se eliminan esos datos.
- Una prueba de código o de fixture no sustituye transacciones concurrentes reales, restauración cloud ni recorrido editorial y lingüístico con personas.

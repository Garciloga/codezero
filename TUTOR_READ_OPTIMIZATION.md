# Tutor: reducción de lecturas en la revisión sandbox

7 de octubre de 2026. Isaac pidió continuar y dejar pendiente la clave administrativa del sandbox. Ese acceso y los recorridos administrativos completos permanecen pendientes; no se solicitan otra vez en esta fase.

## Cambio

La API de preparación contextual reutiliza el perfil propio que `workspaceUser` acaba de consultar después de verificar la sesión con Auth. La consulta incluye id, estado, rol y plan. El adaptador comprueba que ese id corresponde al usuario verificado. El perfil proviene de la base mediante la sesión y RLS, nunca de datos del navegador ni de user_metadata. Se reutiliza solamente dentro de la petición; no existe una caché compartida entre usuarios.

Los resultados recientes se obtienen en una consulta de intentos con `exercises!inner(lesson_id,status)`, filtrada por usuario propio, lección solicitada y ejercicio publicado. Se ordenan por fecha e id y se limita la respuesta a 20 intentos. Solamente los booleanos de acierto entran al contexto del Tutor. La consulta ya no necesita descargar primero la lista de ejercicios ni imponer un máximo artificial de 100 ejercicios por lección.

Para un bloque 1 con al menos un intento, las lecturas de base se reducen de siete a cinco, además de la verificación Auth existente. Las comprobaciones de publicación, plan y prerrequisitos permanecen en el flujo. El contexto sigue siendo preparación sin llamada al proveedor ni consumo de cuota.

Referencia de la sintaxis utilizada: https://supabase.com/docs/guides/database/joins-and-nesting .

## Validación

Las 115 pruebas unitarias y TypeScript pasaron. Se repitieron las ocho comprobaciones de `scripts/sandbox-app-check.py` con sesión real de Supabase: contexto de la lección con un intento incorrecto propio, rechazo de identidad adicional, falta de sesión, origen externo, alta y retiro de lista de espera, guardado de progreso y conflicto HTTP 409.

En esa ejecución, la preparación contextual respondió HTTP 200 en 8,9 segundos. La medición anterior había sido de 61–67 segundos. Son ejecuciones distintas en un entorno con proxy; no es un benchmark controlado y no permite atribuir toda la diferencia al cambio, prometer ese tiempo en producción o cerrar la validación de rendimiento. Falta medir varias ejecuciones en el despliegue de pruebas antes del lanzamiento.

Para recuperar la sesión tras desaparecer los archivos temporales, se regeneró exclusivamente la contraseña de la cuenta ficticia `learner@codezero.example.test`, comprobando su id y su marca synthetic en el sandbox aprobado. La contraseña y las claves no forman parte del paquete ni de Notion. No se cambió configuración Auth ni políticas RLS.

Estado comprobado al terminar: cero filas de cobros/add-ons activos, cero eventos Stripe y cero cuota oficial consumida. No se desplegó a Vercel ni se modificó producción o Stripe Live.

## Entrega y pendientes

`CodeZero_tutor_read_optimization.patch` incluye este documento y tres cambios de código. Aplicarlo después de `CodeZero_sandbox_cloud_validation.patch`.

`SUPABASE_SECRET_KEY` del sandbox queda pendiente por instrucción del usuario. También quedan pendientes los recorridos administrativos de navegador, la protección de contraseñas filtradas y la medición de rendimiento en el entorno de despliegue. La integración comercial del Tutor y su presupuesto siguen siendo una fase posterior.

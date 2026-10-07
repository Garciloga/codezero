with bank(lesson_slug, exercise_slug, prompt, options, explanation, correct_answer) as (
  values
  ('n10-definicion-del-producto','n10-producto-practica-2','¿Qué debe definirse antes de diseñar una solución técnica de capstone?','["Problema, usuarios, alcance y criterio de éxito","Solo el framework","El logo final","La cantidad de archivos"]'::jsonb,'A','Una definición clara del problema evita construir funcionalidades sin propósito verificable.'),
  ('n10-diseno-tecnico','n10-diseno-practica-2','¿Qué hace útil un diseño técnico antes de implementar?','["Expone componentes, datos, interfaces, riesgos y decisiones","Solo enumera tecnologías","Evita mencionar trade-offs","Describe únicamente colores"]'::jsonb,'A','El diseño técnico convierte requisitos en una estructura que puede revisarse antes de construir.'),
  ('n10-implementacion','n10-implementacion-practica-2','¿Qué estrategia reduce riesgo durante la implementación de un proyecto grande?','["Entregar incrementos pequeños y verificables","Construir todo sin ejecutar hasta el final","Cambiar requisitos constantemente","Evitar control de versiones"]'::jsonb,'A','Incrementos pequeños facilitan detectar errores y validar decisiones temprano.'),
  ('n10-pruebas-y-calidad','n10-calidad-practica-2','¿Qué conjunto representa mejor una estrategia de calidad?','["Pruebas de unidades críticas, integración y flujo end-to-end","Solo probar manualmente el happy path","No probar porque compila","Solo revisar formato"]'::jsonb,'A','La calidad combina pruebas en distintos niveles según el riesgo.'),
  ('n10-documentacion','n10-documentacion-practica-2','¿Qué documentación ayuda más a otra persona a operar tu proyecto?','["Cómo ejecutar, configurar, probar, desplegar y resolver fallos comunes","Solo una descripción comercial","Un listado de archivos sin contexto","Ninguna si el código compila"]'::jsonb,'A','La documentación operativa reduce dependencia del autor original.'),
  ('n10-entrega-capstone','n10-entrega-practica-2','¿Qué demuestra que un capstone está listo para revisión?','["Problema, solución, evidencia de pruebas, decisiones y limitaciones documentadas","Solo un repositorio creado","Un video sin código ni explicación","Una lista de ideas futuras"]'::jsonb,'A','Una entrega profesional debe permitir evaluar tanto resultado como razonamiento.'),

  ('n11-consumo-de-apis','n11-consumo-practica-2','Una API externa responde 429. ¿Qué debería hacer un cliente robusto?','["Respetar rate limits y aplicar espera/reintento controlado","Reintentar en bucle sin espera","Cambiar la URL al azar","Ignorar el código"]'::jsonb,'A','429 indica limitación de tasa; reintentos deben usar espera y límites.'),
  ('n11-diseno-de-webhooks','n11-webhooks-practica-2','¿Qué propiedad es importante al diseñar un webhook receptor?','["Responder rápido y procesar trabajo pesado de forma desacoplada cuando convenga","Mantener la conexión abierta indefinidamente","No validar payload","Depender del orden perfecto de eventos"]'::jsonb,'A','Los emisores suelen esperar respuestas rápidas y pueden reintentar si tardas demasiado.'),
  ('n11-firmas-y-reintentos','n11-firmas-practica-2','¿Qué protege la verificación criptográfica de una firma de webhook?','["Autenticidad e integridad del payload","Disponibilidad del proveedor","Velocidad de red","Orden de eventos"]'::jsonb,'A','La firma ayuda a comprobar que el mensaje proviene del emisor esperado y no fue alterado.'),
  ('n11-idempotencia','n11-idempotencia-practica-2','El mismo evento se entrega dos veces. ¿Qué comportamiento debe buscar un receptor idempotente?','["El efecto final ocurre una sola vez","Crear dos recursos siempre","Fallar en el segundo intento","Cambiar el ID del evento"]'::jsonb,'A','La idempotencia evita duplicar efectos ante reintentos o entregas repetidas.'),
  ('n11-manejo-de-errores','n11-errores-practica-2','Una integración falla temporalmente por timeout. ¿Qué respuesta operativa es razonable?','["Registrar contexto seguro y reintentar con política limitada","Descartar el evento sin rastro","Reintentar infinitamente","Mostrar secretos en logs"]'::jsonb,'A','Errores transitorios deben ser observables y manejarse con reintentos acotados.'),
  ('n11-proyecto-de-integracion','n11-proyecto-practica-2','¿Qué evidencia hace auditable una integración?','["IDs de correlación, estados de procesamiento y logs sin secretos","Solo una captura de la UI","No guardar ningún estado","Compartir tokens en logs"]'::jsonb,'A','La trazabilidad permite reconstruir qué ocurrió sin exponer información sensible.')
)
insert into public.exercises (lesson_id,slug,prompt,kind,options,explanation,sort_order,status)
select l.id,b.exercise_slug,b.prompt,'multiple_choice',b.options,b.explanation,2,'published'
from bank b join public.lessons l on l.slug=b.lesson_slug
where not exists(select 1 from public.exercises e where e.slug=b.exercise_slug);

with answers(exercise_slug,correct_answer) as (
  values
  ('n10-producto-practica-2','A'),('n10-diseno-practica-2','A'),('n10-implementacion-practica-2','A'),('n10-calidad-practica-2','A'),('n10-documentacion-practica-2','A'),('n10-entrega-practica-2','A'),
  ('n11-consumo-practica-2','A'),('n11-webhooks-practica-2','A'),('n11-firmas-practica-2','A'),('n11-idempotencia-practica-2','A'),('n11-errores-practica-2','A'),('n11-proyecto-practica-2','A')
)
insert into public.exercise_solutions(exercise_id,correct_answer)
select e.id,a.correct_answer from answers a join public.exercises e on e.slug=a.exercise_slug
where not exists(select 1 from public.exercise_solutions s where s.exercise_id=e.id);

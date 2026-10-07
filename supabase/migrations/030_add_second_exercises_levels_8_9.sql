with bank(lesson_slug, exercise_slug, prompt, options, explanation, correct_answer) as (
  values
  ('n8-http-y-rest','n8-http-practica-2','Un cliente crea correctamente un recurso. ¿Qué código HTTP suele representar creación exitosa?','["201","404","500","301"]'::jsonb,'A','201 Created comunica que un nuevo recurso fue creado correctamente.'),
  ('n8-diseno-de-apis','n8-diseno-practica-2','¿Qué decisión mejora un contrato de API?','["Definir entradas, salidas, errores y códigos HTTP antes de implementar","Cambiar la respuesta en cada petición","Ocultar todos los errores como 200","Usar nombres de rutas ambiguos"]'::jsonb,'A','Un contrato explícito hace la API predecible y más fácil de integrar.'),
  ('n8-backend-con-rutas','n8-rutas-practica-2','Una ruta recibe un ID inexistente. ¿Qué comportamiento suele ser más apropiado?','["Responder 404","Crear el recurso silenciosamente","Responder 200 con datos inventados","Cerrar el servidor"]'::jsonb,'A','404 indica que el recurso solicitado no fue encontrado.'),
  ('n8-validacion-y-errores','n8-validacion-practica-2','¿Dónde debe validarse una entrada crítica aunque el frontend ya la valide?','["También en el backend","Solo en CSS","Únicamente en el navegador","No necesita validación"]'::jsonb,'A','El backend no debe confiar en que el cliente haya validado datos correctamente.'),
  ('n8-autenticacion','n8-auth-practica-2','Un usuario autenticado intenta modificar un recurso de otra cuenta. ¿Qué falta comprobar?','["Autorización sobre el recurso","Solo su email","El tamaño de pantalla","El user-agent"]'::jsonb,'A','Autenticación identifica; autorización decide qué puede hacer esa identidad.'),
  ('n8-proyecto-api','n8-proyecto-practica-2','¿Qué conjunto de pruebas da mayor confianza en una API?','["Éxito, entrada inválida, no autenticado, prohibido y recurso inexistente","Solo el caso exitoso","Solo probar desde el navegador","No probar respuestas de error"]'::jsonb,'A','Una API robusta debe verificarse también en sus rutas de error.'),

  ('n9-arquitectura-de-software','n9-arquitectura-practica-2','¿Qué señal indica una separación de responsabilidades saludable?','["Cada módulo tiene un propósito claro y dependencias controladas","Todo vive en un único archivo","Todos los módulos acceden directamente a todo","No existe interfaz entre componentes"]'::jsonb,'A','Responsabilidades claras reducen acoplamiento y facilitan cambios.'),
  ('n9-testing','n9-testing-practica-2','¿Qué prueba verifica mejor un flujo completo de registro a dashboard?','["Una prueba end-to-end","Solo una prueba de una función pura","Un comentario manual","Un linter"]'::jsonb,'A','E2E valida la interacción de varios componentes como lo haría un usuario.'),
  ('n9-patrones-de-diseno','n9-patrones-practica-2','¿Cuándo conviene aplicar un patrón de diseño?','["Cuando resuelve un problema recurrente del contexto y mejora claridad","Siempre, aunque complique el código","Solo para impresionar","Antes de entender el problema"]'::jsonb,'A','Los patrones son herramientas, no objetivos; deben resolver una necesidad real.'),
  ('n9-observabilidad','n9-observabilidad-practica-2','Un endpoint está lento de forma intermitente. ¿Qué combinación ayuda a investigar?','["Métricas de latencia, logs con contexto y trazas","Solo el nombre del endpoint","Más comentarios","Cambiar colores de UI"]'::jsonb,'A','Observabilidad combina señales para entender qué ocurre dentro del sistema.'),
  ('n9-ci-cd','n9-cicd-practica-2','¿Qué debe ocurrir si la compilación o pruebas fallan en CI?','["Bloquear el avance del cambio hasta corregirlo","Desplegar igualmente siempre","Borrar las pruebas","Marcar éxito manualmente"]'::jsonb,'A','CI protege la rama al impedir integrar cambios que no pasan controles básicos.'),
  ('n9-proyecto-de-ingenieria','n9-proyecto-practica-2','Antes de desplegar una funcionalidad importante, ¿qué plan reduce riesgo?','["Definir verificación, observabilidad y rollback","Cambiar varias cosas no relacionadas a la vez","No guardar versión anterior","Desplegar sin comprobar nada"]'::jsonb,'A','Un despliegue profesional contempla cómo validar y cómo recuperar si algo falla.')
)
insert into public.exercises (lesson_id,slug,prompt,kind,options,explanation,sort_order,status)
select l.id,b.exercise_slug,b.prompt,'multiple_choice',b.options,b.explanation,2,'published'
from bank b join public.lessons l on l.slug=b.lesson_slug
where not exists(select 1 from public.exercises e where e.slug=b.exercise_slug);

with answers(exercise_slug,correct_answer) as (
  values
  ('n8-http-practica-2','A'),('n8-diseno-practica-2','A'),('n8-rutas-practica-2','A'),('n8-validacion-practica-2','A'),('n8-auth-practica-2','A'),('n8-proyecto-practica-2','A'),
  ('n9-arquitectura-practica-2','A'),('n9-testing-practica-2','A'),('n9-patrones-practica-2','A'),('n9-observabilidad-practica-2','A'),('n9-cicd-practica-2','A'),('n9-proyecto-practica-2','A')
)
insert into public.exercise_solutions(exercise_id,correct_answer)
select e.id,a.correct_answer from answers a join public.exercises e on e.slug=a.exercise_slug
where not exists(select 1 from public.exercise_solutions s where s.exercise_id=e.id);

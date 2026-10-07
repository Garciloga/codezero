with bank(lesson_slug, exercise_slug, prompt, options, explanation, correct_answer) as (
  values
  ('n6-modelo-relacional','n6-modelo-practica-2','¿Qué diseño evita repetir los datos completos del cliente en cada suscripción?','["Separar clientes y suscripciones en tablas relacionadas por una clave","Guardar todo en una sola columna de texto","Duplicar cliente por cada factura","Eliminar identificadores"]'::jsonb,'A','Separar entidades relacionadas reduce duplicación y mejora integridad.'),
  ('n6-select-y-filtros','n6-select-practica-2','Quieres ver solo cuentas activas creadas este mes. ¿Qué parte de SQL expresa las condiciones?','["WHERE","ORDER BY solamente","CREATE TABLE","DROP"]'::jsonb,'A','WHERE limita las filas según condiciones.'),
  ('n6-joins','n6-joins-practica-2','Necesitas todos los clientes, incluso los que no tienen suscripción. ¿Qué JOIN suele ser adecuado desde clientes?','["LEFT JOIN","INNER JOIN necesariamente","CROSS JOIN","Ningún JOIN"]'::jsonb,'A','LEFT JOIN conserva todas las filas de la tabla izquierda.'),
  ('n6-agregaciones','n6-agregaciones-practica-2','Quieres conocer cuántos usuarios hay por plan. ¿Qué combinación es típica?','["COUNT y GROUP BY","DELETE y DROP","UPDATE sin filtro","LIMIT solamente"]'::jsonb,'A','Las agregaciones por grupo permiten resumir métricas por categoría.'),
  ('n6-diseno-y-normalizacion','n6-diseno-practica-2','Una tabla guarda tres teléfonos en columnas telefono1, telefono2 y telefono3. ¿Qué problema puede indicar?','["Una estructura difícil de escalar que podría requerir una relación separada","Que faltan colores","Que SQL no soporta texto","Que toda tabla debe tener una sola fila"]'::jsonb,'A','Los grupos repetidos suelen indicar que conviene modelar una relación uno-a-muchos.'),
  ('n6-proyecto-sql','n6-proyecto-practica-2','¿Cómo validas mejor una consulta de negocio compleja?','["Comparando una muestra manual conocida con el resultado","Asumiendo que si ejecuta es correcta","Agregando más JOINs","Ocultando NULL"]'::jsonb,'A','La validación con casos conocidos ayuda a detectar duplicaciones y filtros incorrectos.'),

  ('n7-html-semantico','n7-html-practica-2','¿Qué elemento es preferible para una acción clickeable que envía un formulario?','["button","div con click","span vacío","h1"]'::jsonb,'A','Los elementos semánticos aportan comportamiento y accesibilidad nativos.'),
  ('n7-css-y-layout','n7-css-practica-2','Una interfaz debe adaptarse a pantallas estrechas. ¿Qué enfoque ayuda?','["Layouts flexibles y media queries cuando sean necesarias","Anchos fijos enormes","Texto convertido en imagen","Ocultar todo el contenido"]'::jsonb,'A','Diseños flexibles y breakpoints razonables favorecen responsividad.'),
  ('n7-javascript-basico','n7-js-practica-2','¿Qué ventaja tiene usar const cuando una referencia no debe reasignarse?','["Hace explícita la intención y evita reasignaciones accidentales","Convierte todo en global","Elimina tipos automáticamente","Hace la red más rápida"]'::jsonb,'A','const comunica que la variable no debe recibir otra referencia.'),
  ('n7-dom-y-eventos','n7-dom-practica-2','Un formulario debe reaccionar al envío sin recargar innecesariamente. ¿Qué evento suele manejarse?','["submit","resize únicamente","scroll siempre","load de una imagen"]'::jsonb,'A','El evento submit representa la intención de enviar un formulario.'),
  ('n7-fetch-y-estado','n7-fetch-practica-2','Una petición tarda y luego falla. ¿Qué estados debería representar la UI?','["Cargando, éxito y error","Solo éxito","Solo un spinner permanente","Ninguno"]'::jsonb,'A','Modelar estados explícitos evita interfaces ambiguas.'),
  ('n7-proyecto-web','n7-proyecto-practica-2','¿Qué revisión mejora un proyecto web antes de entregarlo?','["Probar teclado, móvil, errores y estados vacíos","Solo verlo en tu computadora","Eliminar etiquetas","Usar texto muy pequeño"]'::jsonb,'A','La revisión debe cubrir accesibilidad y estados reales, no solo el caso ideal.')
)
insert into public.exercises (lesson_id,slug,prompt,kind,options,explanation,sort_order,status)
select l.id,b.exercise_slug,b.prompt,'multiple_choice',b.options,b.explanation,2,'published'
from bank b join public.lessons l on l.slug=b.lesson_slug
where not exists(select 1 from public.exercises e where e.slug=b.exercise_slug);

with answers(exercise_slug,correct_answer) as (
  values
  ('n6-modelo-practica-2','A'),('n6-select-practica-2','A'),('n6-joins-practica-2','A'),('n6-agregaciones-practica-2','A'),('n6-diseno-practica-2','A'),('n6-proyecto-practica-2','A'),
  ('n7-html-practica-2','A'),('n7-css-practica-2','A'),('n7-js-practica-2','A'),('n7-dom-practica-2','A'),('n7-fetch-practica-2','A'),('n7-proyecto-practica-2','A')
)
insert into public.exercise_solutions(exercise_id,correct_answer)
select e.id,a.correct_answer from answers a join public.exercises e on e.slug=a.exercise_slug
where not exists(select 1 from public.exercise_solutions s where s.exercise_id=e.id);

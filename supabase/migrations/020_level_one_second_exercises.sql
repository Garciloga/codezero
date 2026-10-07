with bank(lesson_slug, exercise_slug, prompt, options, explanation, correct_answer) as (
  values
  ('pensamiento-computacional-introduccion','n1-intro-practica-2',
   '¿Qué debes definir antes de intentar automatizar un proceso?',
   '["El lenguaje de programación más popular","Entradas, proceso, salidas y decisiones del problema","El color de la interfaz","La cantidad de servidores"]'::jsonb,
   'Entender el problema y sus elementos permite diseñar una solución verificable antes de elegir tecnología.','B'),
  ('descomposicion-de-problemas','n1-descomposicion-practica-2',
   'Un cliente no puede completar una integración. ¿Qué acción refleja mejor la descomposición?',
   '["Cambiar todo el sistema","Separar autenticación, permisos, configuración y conectividad para probarlos por partes","Reintentar sin observar","Asumir que el proveedor falla"]'::jsonb,
   'Descomponer convierte un problema grande en hipótesis pequeñas que pueden confirmarse o descartarse.','B'),
  ('patrones-y-abstraccion','n1-patrones-practica-2',
   'Varios archivos fallan por fechas, encabezados y campos vacíos. ¿Cuál es la mejor abstracción?',
   '["Memorizar cada archivo","Crear una regla general de validación de estructura y datos antes de importar","Ignorar errores poco frecuentes","Duplicar el proceso para cada cliente"]'::jsonb,
   'La abstracción conserva la estructura relevante del problema y elimina detalles accidentales.','B'),
  ('algoritmos-paso-a-paso','n1-algoritmos-practica-2',
   '¿Qué característica hace que un algoritmo sea más útil para otra persona?',
   '["Pasos claros, ordenados y verificables","Muchas palabras técnicas","No incluir errores posibles","Depender de conocimiento implícito"]'::jsonb,
   'Un buen algoritmo debe poder seguirse y comprobarse sin depender de suposiciones ocultas.','A'),
  ('logica-y-decisiones','n1-logica-practica-2',
   'Una exportación requiere cuenta activa Y permiso de administrador. ¿Cuándo debe permitirse?',
   '["Si cualquiera de las dos condiciones es verdadera","Solo cuando ambas condiciones son verdaderas","Siempre que exista el usuario","Nunca"]'::jsonb,
   'El operador lógico Y exige que todas las condiciones indicadas se cumplan.','B'),
  ('repeticion-y-eficiencia','n1-repeticion-practica-2',
   'Procesas 500 clientes y uno falla. ¿Qué diseño suele ser más robusto?',
   '["Detener definitivamente todo el lote","Procesar cada elemento, registrar errores y continuar cuando sea seguro","Ignorar todos los resultados","Repetir manualmente 500 veces"]'::jsonb,
   'Los procesos repetitivos deben contemplar fallos parciales y trazabilidad por iteración.','B'),
  ('depuracion-y-casos-limite','n1-depuracion-practica-2',
   'Una función falla solo cuando recibe una lista vacía. ¿Qué representa ese caso?',
   '["Un caso límite que debe probarse","Una razón para borrar la función","Un error imposible de investigar","Un problema de diseño visual"]'::jsonb,
   'Los casos límite ponen a prueba los bordes de los supuestos y suelen revelar errores ocultos.','A'),
  ('proyecto-pensamiento-computacional','n1-proyecto-practica-2',
   '¿Qué evidencia demuestra mejor que un diseño de proceso está listo para implementarse?',
   '["Solo el nombre del proyecto","Entradas, salidas, pasos, decisiones, errores y casos de prueba definidos","Una imagen decorativa","Una lista de tecnologías sin problema descrito"]'::jsonb,
   'Una especificación clara permite que otra persona entienda, implemente y pruebe el proceso.','B')
)
insert into public.exercises (lesson_id, slug, prompt, kind, options, explanation, sort_order, status)
select l.id, b.exercise_slug, b.prompt, 'multiple_choice', b.options, b.explanation, 2, 'published'
from bank b
join public.lessons l on l.slug=b.lesson_slug
where not exists (select 1 from public.exercises e where e.slug=b.exercise_slug);

with answers(exercise_slug, correct_answer) as (
  values
  ('n1-intro-practica-2','B'),
  ('n1-descomposicion-practica-2','B'),
  ('n1-patrones-practica-2','B'),
  ('n1-algoritmos-practica-2','A'),
  ('n1-logica-practica-2','B'),
  ('n1-repeticion-practica-2','B'),
  ('n1-depuracion-practica-2','A'),
  ('n1-proyecto-practica-2','B')
)
insert into public.exercise_solutions (exercise_id, correct_answer)
select e.id, a.correct_answer
from answers a
join public.exercises e on e.slug=a.exercise_slug
where not exists (
  select 1 from public.exercise_solutions s where s.exercise_id=e.id
);

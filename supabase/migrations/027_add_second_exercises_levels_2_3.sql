with bank(lesson_slug, exercise_slug, prompt, options, explanation) as (
  values
  ('n2-variables-y-tipos','n2-variables-practica-2','Necesitas calcular el total de una factura. ¿Qué representación facilita operaciones matemáticas?','["Guardar el monto como número","Guardar el monto solo como texto con símbolo de moneda","Guardar todo en comentarios","Usar siempre valores booleanos"]'::jsonb,'Los datos numéricos permiten sumar, comparar y validar montos sin conversiones innecesarias.'),
  ('n2-condiciones','n2-condiciones-practica-2','Una función premium requiere cuenta activa y plan de pago. ¿Qué condición expresa mejor la regla?','["activa AND plan_de_pago","activa OR plan_de_pago","NOT activa","Siempre verdadero"]'::jsonb,'Cuando ambos requisitos son obligatorios debe usarse una condición que exija los dos.'),
  ('n2-bucles','n2-bucles-practica-2','Debes revisar el estado de cada integración de una lista. ¿Qué estructura es la más natural?','["Un bucle sobre la colección","Una sola asignación","Un comentario","Una condición que nunca se repite"]'::jsonb,'Los bucles permiten aplicar la misma lógica a cada elemento de una colección.'),
  ('n2-funciones','n2-funciones-practica-2','La misma validación de email se usa en tres partes del programa. ¿Qué mejora reduce duplicación?','["Crear una función reutilizable","Copiar el código tres veces","Eliminar la validación","Usar variables con nombres distintos"]'::jsonb,'Encapsular una responsabilidad repetida en una función facilita pruebas y mantenimiento.'),
  ('n2-colecciones','n2-colecciones-practica-2','Quieres relacionar rápidamente cada user_id con su plan. ¿Qué colección de Python suele ser adecuada?','["Un diccionario","Un número","Un booleano","Una cadena sin estructura"]'::jsonb,'Un diccionario modela asociaciones clave-valor como user_id → plan.'),
  ('n2-proyecto-python-basico','n2-proyecto-practica-2','¿Qué hace que un proyecto básico sea más confiable antes de entregarlo?','["Probar casos normales, límite e inválidos","Ejecutarlo una sola vez","Ocultar los errores","Usar muchas variables globales"]'::jsonb,'Las pruebas manuales con distintos casos ayudan a descubrir supuestos incorrectos y errores.'),
  ('n3-modulos-y-paquetes','n3-modulos-practica-2','Dos scripts necesitan la misma lógica de validación. ¿Qué organización favorece reutilización?','["Mover la lógica a un módulo importable","Copiar el archivo completo","Guardar la lógica en comentarios","Duplicar dependencias"]'::jsonb,'Los módulos permiten separar responsabilidades y reutilizar código explícitamente.'),
  ('n3-excepciones','n3-excepciones-practica-2','Una API puede responder timeout. ¿Qué manejo de excepciones es preferible?','["Capturar el error esperado y responder con contexto útil","Usar except vacío para ocultar todo","Ignorar cualquier excepción","Finalizar siempre el proceso"]'::jsonb,'Capturar errores esperados de forma específica permite recuperación y diagnóstico.'),
  ('n3-archivos-y-datos','n3-archivos-practica-2','Lees un archivo JSON externo. ¿Qué debes hacer antes de confiar en su contenido?','["Validar estructura y tipos esperados","Asumir que siempre es correcto","Ejecutar cualquier texto como código","Eliminar errores de lectura"]'::jsonb,'Los datos externos deben validarse antes de incorporarlos al flujo de la aplicación.'),
  ('n3-programacion-orientada-a-objetos','n3-poo-practica-2','¿Cuándo tiene sentido crear una clase?','["Cuando datos y comportamientos relacionados forman una entidad con responsabilidad clara","Para reemplazar cualquier variable","Siempre, incluso para una suma simple","Solo para imprimir texto"]'::jsonb,'Una clase es útil cuando ayuda a modelar una entidad y mantener juntas responsabilidades coherentes.'),
  ('n3-codigo-limpio-y-pruebas','n3-clean-practica-2','Una función hace validación, consulta datos, envía email y genera reporte. ¿Qué mejora suele ayudar?','["Separar responsabilidades en unidades pequeñas y probables","Agregar más parámetros sin dividirla","Duplicarla","Quitar pruebas"]'::jsonb,'Separar responsabilidades reduce acoplamiento y facilita pruebas aisladas.'),
  ('n3-proyecto-python-intermedio','n3-proyecto-practica-2','¿Qué evidencia mejora la mantenibilidad de un proyecto intermedio?','["README, manejo de errores y pruebas de los casos principales","Solo una captura","Un único archivo enorme","Variables sin nombres descriptivos"]'::jsonb,'Documentación, estructura clara y pruebas hacen que otra persona pueda entender y modificar el proyecto.')
)
insert into public.exercises (lesson_id, slug, prompt, kind, options, explanation, sort_order, status)
select l.id, b.exercise_slug, b.prompt, 'multiple_choice', b.options, b.explanation, 2, 'published'
from bank b
join public.lessons l on l.slug=b.lesson_slug
where not exists (select 1 from public.exercises e where e.slug=b.exercise_slug);

with answers(exercise_slug, correct_answer) as (
  values
  ('n2-variables-practica-2','A'),('n2-condiciones-practica-2','A'),('n2-bucles-practica-2','A'),('n2-funciones-practica-2','A'),('n2-colecciones-practica-2','A'),('n2-proyecto-practica-2','A'),
  ('n3-modulos-practica-2','A'),('n3-excepciones-practica-2','A'),('n3-archivos-practica-2','A'),('n3-poo-practica-2','A'),('n3-clean-practica-2','A'),('n3-proyecto-practica-2','A')
)
insert into public.exercise_solutions (exercise_id, correct_answer)
select e.id, a.correct_answer
from answers a
join public.exercises e on e.slug=a.exercise_slug
where not exists (select 1 from public.exercise_solutions s where s.exercise_id=e.id);

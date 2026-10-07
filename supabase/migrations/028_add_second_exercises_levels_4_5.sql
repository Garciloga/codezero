with bank(lesson_slug, exercise_slug, prompt, options, explanation, correct_answer) as (
  values
  ('n4-complejidad-y-eficiencia','n4-complejidad-practica-2','Una operación recorre una lista completa por cada usuario. ¿Qué pregunta ayuda a evaluar escalabilidad?','["Cómo crece el número de operaciones cuando crecen los datos","Qué color tiene la terminal","Qué nombre tiene el archivo","Cuántos comentarios hay"]'::jsonb,'A','La complejidad analiza cómo cambia el costo al crecer el tamaño de entrada.'),
  ('n4-listas-pilas-y-colas','n4-listas-practica-2','Procesas trabajos en el mismo orden en que llegaron. ¿Qué estructura modela mejor ese comportamiento?','["Pila LIFO","Cola FIFO","Conjunto sin orden","Cadena"]'::jsonb,'B','Una cola FIFO conserva el orden de llegada.'),
  ('n4-diccionarios-y-conjuntos','n4-diccionarios-practica-2','Necesitas comprobar rápidamente si un token ya fue procesado. ¿Qué estructura suele ser apropiada?','["Set","Lista recorrida siempre completa","Cadena concatenada","Tupla vacía"]'::jsonb,'A','Un set permite pruebas de pertenencia eficientes.'),
  ('n4-busqueda-y-ordenamiento','n4-busqueda-practica-2','Tienes datos ordenados y necesitas localizar un ID. ¿Qué técnica puede reducir comparaciones frente a búsqueda lineal?','["Búsqueda binaria","Recorrer desde cero siempre","Duplicar la lista","Ordenar en cada comparación"]'::jsonb,'A','La búsqueda binaria aprovecha el orden para reducir el espacio de búsqueda.'),
  ('n4-recursion-y-arboles','n4-recursion-practica-2','¿Qué elemento es indispensable en una función recursiva bien diseñada?','["Un caso base que detenga la recursión","Una variable global obligatoria","Un bucle infinito","Una clase"]'::jsonb,'A','Sin caso base la recursión puede continuar indefinidamente.'),
  ('n4-proyecto-de-algoritmos','n4-proyecto-practica-2','¿Qué evidencia fortalece una elección de algoritmo en un proyecto?','["Comparar alternativas con tamaño de datos, complejidad y claridad","Elegir el más largo","No medir nada","Usar siempre recursión"]'::jsonb,'A','La elección debe justificarse con restricciones y trade-offs reales.'),

  ('n5-terminal-y-sistema-de-archivos','n5-terminal-practica-2','Antes de borrar o mover archivos desde terminal, ¿qué práctica reduce errores?','["Confirmar directorio actual y objetivo","Ejecutar comandos sin leerlos","Usar siempre permisos elevados","Ignorar rutas"]'::jsonb,'A','Verificar contexto evita operaciones destructivas en rutas equivocadas.'),
  ('n5-git-basico','n5-git-practica-2','¿Qué aporta revisar git diff antes de un commit?','["Permite verificar exactamente qué cambios se incluirán","Borra el historial","Fusiona ramas automáticamente","Publica el código"]'::jsonb,'A','El diff ayuda a detectar cambios accidentales antes de registrarlos.'),
  ('n5-ramas-y-merges','n5-ramas-practica-2','Dos ramas modificaron la misma línea de forma incompatible. ¿Qué debe ocurrir?','["Resolver explícitamente el conflicto y validar el resultado","Elegir ambas versiones sin revisar","Borrar main","Hacer force push automáticamente"]'::jsonb,'A','Los conflictos requieren una decisión humana sobre el resultado correcto.'),
  ('n5-pull-requests','n5-pr-practica-2','¿Qué hace una pull request más fácil de revisar?','["Cambio enfocado, contexto claro y pruebas relevantes","Cientos de cambios no relacionados","Sin descripción","Archivos generados innecesarios"]'::jsonb,'A','Cambios pequeños y explicados reducen el costo de revisión.'),
  ('n5-flujo-colaborativo','n5-colaborativo-practica-2','¿Qué práctica disminuye el riesgo de sobrescribir trabajo ajeno?','["Sincronizar cambios y resolver conflictos antes de integrar","Forzar pushes por defecto","Compartir una sola rama para todo","Eliminar historial"]'::jsonb,'A','Un flujo colaborativo conserva trazabilidad y coordinación.'),
  ('n5-proyecto-con-git','n5-proyecto-practica-2','¿Qué historial de commits es más útil al entregar un proyecto?','["Commits coherentes con mensajes que explican cambios","Un solo commit llamado finalfinal","Commits vacíos","Mensajes aleatorios"]'::jsonb,'A','Un historial claro facilita revisión, diagnóstico y reversión.')
)
insert into public.exercises (lesson_id,slug,prompt,kind,options,explanation,sort_order,status)
select l.id,b.exercise_slug,b.prompt,'multiple_choice',b.options,b.explanation,2,'published'
from bank b join public.lessons l on l.slug=b.lesson_slug
where not exists(select 1 from public.exercises e where e.slug=b.exercise_slug);

with answers(exercise_slug,correct_answer) as (
  values
  ('n4-complejidad-practica-2','A'),('n4-listas-practica-2','B'),('n4-diccionarios-practica-2','A'),('n4-busqueda-practica-2','A'),('n4-recursion-practica-2','A'),('n4-proyecto-practica-2','A'),
  ('n5-terminal-practica-2','A'),('n5-git-practica-2','A'),('n5-ramas-practica-2','A'),('n5-pr-practica-2','A'),('n5-colaborativo-practica-2','A'),('n5-proyecto-practica-2','A')
)
insert into public.exercise_solutions(exercise_id,correct_answer)
select e.id,a.correct_answer from answers a join public.exercises e on e.slug=a.exercise_slug
where not exists(select 1 from public.exercise_solutions s where s.exercise_id=e.id);

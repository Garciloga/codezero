-- Assessment quality pass: add two scenario questions per level (5 total per exam).

with bank(level_number, slug, prompt, options, correct_answer, sort_order) as (
  values
  (1, 'n1-scenario-09', 'Un proceso de alta falla solo cuando el usuario no tiene segundo apellido. ¿Cuál es la mejor primera acción?', '["Ignorar el caso porque es poco común","Identificar el supuesto y convertirlo en un caso límite explícito","Reescribir todo el sistema","Agregar más pasos sin revisar el problema"]'::jsonb, 'B', 4),
  (1, 'n1-scenario-10', 'Quieres automatizar la asignación de tickets. ¿Qué descripción es un algoritmo más útil?', '["Asignar tickets correctamente","Si prioridad es alta, asignar al equipo urgente; si no, usar categoría y disponibilidad","Usar inteligencia artificial","Revisar tickets muchas veces"]'::jsonb, 'B', 5),

  (2, 'n2-scenario-09', 'En Python necesitas guardar el plan actual de un cliente y luego compararlo. ¿Qué enfoque es más claro?', '["Usar una variable con nombre descriptivo y un string","Guardar el valor solo en un comentario","Crear diez variables sin relación","Evitar almacenar el dato"]'::jsonb, 'A', 4),
  (2, 'n2-scenario-10', 'Un programa debe procesar todos los usuarios de una lista. ¿Qué herramienta encaja mejor?', '["Una condición if sin repetición","Un bucle que recorra la colección","Una variable global","Un comentario"]'::jsonb, 'B', 5),

  (3, 'n3-scenario-09', 'Una función abre un archivo que puede no existir. ¿Qué diseño es más mantenible?', '["Dejar que cualquier error termine el programa sin contexto","Capturar la excepción esperada y devolver o registrar un resultado claro","Usar except para ocultar todos los errores","Duplicar la función"]'::jsonb, 'B', 4),
  (3, 'n3-scenario-10', 'Dos módulos repiten la misma validación de email. ¿Qué mejora es preferible?', '["Copiarla una tercera vez","Extraer una función reutilizable con pruebas","Eliminar la validación","Convertir todo en una clase gigante"]'::jsonb, 'B', 5),

  (4, 'n4-scenario-09', 'Debes saber rápidamente si un email ya fue procesado entre miles de emails. ¿Qué estructura suele ser apropiada?', '["Un conjunto (set)","Una lista recorrida siempre desde el inicio","Una cadena enorme","Una pila solo por costumbre"]'::jsonb, 'A', 4),
  (4, 'n4-scenario-10', 'Una búsqueda lineal tarda demasiado al crecer los datos. ¿Qué deberías hacer antes de optimizar?', '["Medir y entender tamaño, frecuencia y estructura de los datos","Cambiar de lenguaje inmediatamente","Añadir más bucles","Ocultar el tiempo de ejecución"]'::jsonb, 'A', 5),

  (5, 'n5-scenario-09', 'Terminaste una corrección y quieres que el historial sea fácil de entender. ¿Qué commit es mejor?', '["fix","cambios varios","Corrige validación de plan en checkout","asdf"]'::jsonb, 'C', 4),
  (5, 'n5-scenario-10', 'Antes de hacer merge de una rama compartida, ¿qué práctica reduce riesgo?', '["Revisar el diff y confirmar que las pruebas pasan","Borrar la rama principal","Hacer force push sin revisar","Ignorar conflictos"]'::jsonb, 'A', 5),

  (6, 'n6-scenario-09', 'Necesitas clientes aunque todavía no tengan suscripción. ¿Qué JOIN suele conservar todos los clientes?', '["INNER JOIN desde clientes","LEFT JOIN desde clientes hacia suscripciones","CROSS JOIN","Ningún JOIN"]'::jsonb, 'B', 4),
  (6, 'n6-scenario-10', 'Una consulta de ingresos duplica totales después de unir varias tablas. ¿Qué debes revisar primero?', '["La cardinalidad de las relaciones y filas duplicadas por JOIN","El color del editor","Cambiar SELECT por DELETE","Agregar ORDER BY"]'::jsonb, 'A', 5),

  (7, 'n7-scenario-09', 'Un botón funciona con mouse pero no con teclado porque es un div con click. ¿Qué mejora es preferible?', '["Usar un elemento button semántico","Agregar más CSS","Ocultarlo en móvil","Cambiar el texto"]'::jsonb, 'A', 4),
  (7, 'n7-scenario-10', 'Una llamada fetch tarda varios segundos. ¿Qué estado debería contemplar la interfaz?', '["Solo éxito","Cargando, éxito y error","Solo error","Ninguno"]'::jsonb, 'B', 5),

  (8, 'n8-scenario-09', 'Un cliente intenta crear un recurso con datos inválidos. ¿Qué respuesta de API es más apropiada?', '["200 con error escondido","Un 4xx con mensaje de validación claro","500 siempre","Redirigir a la home"]'::jsonb, 'B', 4),
  (8, 'n8-scenario-10', 'Un usuario autenticado intenta leer un recurso de otra cuenta. ¿Qué debe verificar el backend?', '["Solo que exista sesión","Autorización sobre ese recurso además de autenticación","Solo el user-agent","Nada si conoce el ID"]'::jsonb, 'B', 5),

  (9, 'n9-scenario-09', 'Un despliegue introduce errores en producción. ¿Qué preparación reduce el tiempo de recuperación?', '["Un plan de rollback y verificación posterior al despliegue","No guardar versiones","Cambiar varias cosas a la vez","Ocultar logs"]'::jsonb, 'A', 4),
  (9, 'n9-scenario-10', 'Quieres detectar un fallo antes de que lo reporte un cliente. ¿Qué capacidad es clave?', '["Observabilidad con métricas, logs y alertas","Más comentarios en el código","Cambiar nombres de variables","Desactivar errores"]'::jsonb, 'A', 5),

  (10, 'n10-scenario-09', 'En un capstone debes elegir entre dos diseños. ¿Qué evidencia fortalece la decisión?', '["Documentar requisitos, trade-offs y riesgos","Elegir el más complejo","Elegir al azar","Evitar explicar la decisión"]'::jsonb, 'A', 4),
  (10, 'n10-scenario-10', '¿Qué hace una entrega técnica más reproducible?', '["Instrucciones para ejecutar, dependencias, pruebas y limitaciones conocidas","Solo una captura de pantalla","Solo el código sin README","Una descripción verbal"]'::jsonb, 'A', 5),

  (11, 'n11-scenario-09', 'Un proveedor reintenta el mismo webhook tres veces. ¿Qué protege contra efectos duplicados?', '["Procesamiento idempotente usando un identificador de evento","Aceptar solo el primer minuto del día","Cambiar la URL en cada intento","Eliminar el registro del evento"]'::jsonb, 'A', 4),
  (11, 'n11-scenario-10', '¿Por qué se verifica la firma de un webhook?', '["Para confirmar autenticidad e integridad del mensaje","Para acelerar el JSON","Para ocultar el endpoint","Para evitar guardar logs"]'::jsonb, 'A', 5),

  (12, 'n12-scenario-09', 'Una integración OAuth deja de funcionar porque expiró el access token. ¿Qué diseño es mejor?', '["Usar el flujo de renovación permitido y manejar errores de reautorización","Guardar la contraseña del usuario","Ignorar la expiración","Crear tokens infinitos"]'::jsonb, 'A', 4),
  (12, 'n12-scenario-10', 'Una sincronización puede tardar minutos y no debe bloquear una petición web. ¿Qué patrón ayuda?', '["Procesarla como job asíncrono con estado y reintentos","Mantener la petición abierta indefinidamente","Ejecutarla en el navegador","Omitir errores"]'::jsonb, 'A', 5),

  (13, 'n13-scenario-09', 'Dos sistemas llaman company_id y account_code al mismo concepto. ¿Qué ayuda a integrar sin acoplarlos?', '["Un modelo canónico y reglas explícitas de mapeo","Renombrar al azar en cada ejecución","Copiar ambas bases completas","Ignorar diferencias semánticas"]'::jsonb, 'A', 4),
  (13, 'n13-scenario-10', 'Un lote de 10,000 registros falla en el 7,500. ¿Qué diseño operativo es mejor?', '["Tener checkpoints, errores por registro y capacidad de reanudar","Volver a empezar siempre sin saber qué pasó","Marcar todo como exitoso","Eliminar el lote"]'::jsonb, 'A', 5),

  (14, 'n14-scenario-09', 'Una API key aparece accidentalmente en logs. ¿Qué respuesta es prioritaria?', '["Rotar/revocar la credencial y corregir la causa de exposición","Solo borrar un mensaje visual","Esperar a que expire","Publicarla para que todos sepan cuál es"]'::jsonb, 'A', 4),
  (14, 'n14-scenario-10', '¿Qué describe mejor mínimo privilegio?', '["Dar solo los permisos necesarios para la función y alcance requeridos","Dar permisos de administrador por comodidad","Compartir una credencial entre todos","No usar autenticación"]'::jsonb, 'A', 5),

  (15, 'n15-scenario-09', 'Tu integración funciona en happy path pero falla cuando el proveedor responde 429. ¿Qué falta demostrar?', '["Manejo de rate limits, reintentos/backoff y observabilidad","Más colores en el dashboard","Un nombre de proyecto distinto","Solo documentación comercial"]'::jsonb, 'A', 4),
  (15, 'n15-scenario-10', 'En una defensa técnica del capstone, ¿qué demuestra mayor madurez?', '["Explicar decisiones, riesgos, límites, operación y evidencia de pruebas","Decir que nunca fallará","Mostrar solo código","Evitar preguntas sobre incidentes"]'::jsonb, 'A', 5)
),
inserted as (
  insert into public.exam_questions (exam_id, slug, prompt, options, sort_order)
  select e.id, b.slug, b.prompt, b.options, b.sort_order
  from bank b
  join public.levels lv on lv.level_number = b.level_number
  join public.level_exams e on e.level_id = lv.id
  where not exists (select 1 from public.exam_questions q where q.slug = b.slug)
  returning id, slug
)
insert into public.exam_solutions (question_id, correct_answer)
select q.id, b.correct_answer
from bank b
join public.exam_questions q on q.slug = b.slug
where not exists (
  select 1 from public.exam_solutions s where s.question_id = q.id
);

update public.level_exams e
set question_count = 5
where exists (
  select 1
  from public.exam_questions q
  where q.exam_id = e.id
  group by q.exam_id
  having count(*) >= 5
);

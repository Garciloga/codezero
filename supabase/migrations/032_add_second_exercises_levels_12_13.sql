with bank(lesson_slug, exercise_slug, prompt, options, explanation, correct_answer) as (
  values
  ('n12-oauth-2-0','n12-oauth-practica-2','¿Qué problema resuelve OAuth 2.0 en una integración SaaS?','["Delegar acceso sin compartir la contraseña del usuario con la aplicación cliente","Comprimir archivos","Reemplazar TLS","Ordenar registros"]'::jsonb,'A','OAuth permite otorgar acceso limitado mediante tokens en lugar de compartir credenciales primarias.'),
  ('n12-scopes-y-tokens','n12-scopes-practica-2','¿Qué principio debe guiar la selección de scopes?','["Solicitar solo los permisos necesarios","Pedir todos los permisos por comodidad","Usar un token compartido para todos","Evitar expiración siempre"]'::jsonb,'A','El mínimo privilegio reduce impacto si una credencial se compromete.'),
  ('n12-automatizacion-saas','n12-automatizacion-practica-2','Una automatización crea tareas después de cada alta de cliente. ¿Qué mejora su confiabilidad?','["Registrar estado e impedir efectos duplicados","No guardar ningún ID","Ejecutar solo desde el navegador","Ignorar fallos parciales"]'::jsonb,'A','El estado e idempotencia permiten reintentar sin duplicar acciones.'),
  ('n12-jobs-y-colas','n12-jobs-practica-2','Una sincronización tarda varios minutos. ¿Por qué usar una cola?','["Desacopla la petición y permite reintentos/control de trabajo","Hace innecesaria la autenticación","Evita almacenar estado","Garantiza que nunca habrá errores"]'::jsonb,'A','Las colas permiten procesar tareas largas de forma asíncrona y controlada.'),
  ('n12-sincronizacion-de-datos','n12-sync-practica-2','Dos sistemas actualizan el mismo registro casi al mismo tiempo. ¿Qué debe definir la sincronización?','["Una política de conflicto y fuente de verdad","Que gane siempre el dato más largo","Borrar ambos registros","Ignorar timestamps y versiones"]'::jsonb,'A','La sincronización necesita reglas explícitas para resolver cambios concurrentes.'),
  ('n12-proyecto-saas','n12-proyecto-practica-2','¿Qué escenario debe incluir una prueba de integración OAuth completa?','["Autorización, expiración/renovación y revocación o reautorización","Solo la pantalla inicial","Únicamente un token válido","No probar errores de permisos"]'::jsonb,'A','El ciclo de vida de credenciales incluye éxito, expiración y recuperación.'),

  ('n13-erp-y-crm','n13-erp-practica-2','CRM y ERP usan identificadores distintos para la misma empresa. ¿Qué ayuda a relacionarlos?','["Una tabla o regla de correspondencia estable entre IDs","Comparar solo el nombre visible","Crear un ID aleatorio en cada sync","Ignorar duplicados"]'::jsonb,'A','Las correspondencias persistentes evitan depender de campos ambiguos.'),
  ('n13-sistemas-de-identidad','n13-identidad-practica-2','Un empleado deja la empresa. ¿Qué capacidad es crítica en una integración de identidad?','["Desaprovisionar acceso de forma trazable","Mantener acceso indefinidamente","Compartir su cuenta","Borrar todos los logs"]'::jsonb,'A','El ciclo de vida de identidad incluye revocación oportuna de acceso.'),
  ('n13-integraciones-batch','n13-batch-practica-2','Un lote de 20,000 filas falla cerca del final. ¿Qué diseño facilita recuperación?','["Checkpoints y procesamiento reanudable","Reiniciar siempre sin saber progreso","Guardar solo el último error","Marcar todo como exitoso"]'::jsonb,'A','Los checkpoints permiten retomar procesamiento sin repetir innecesariamente todo el lote.'),
  ('n13-etl-y-mapeo','n13-etl-practica-2','Un campo externo usa MX y tu modelo interno espera MXN. ¿Dónde debe resolverse la diferencia?','["En una regla explícita de transformación/mapeo","En la interfaz del usuario final","Ignorándola","Cambiando aleatoriamente el valor"]'::jsonb,'A','El mapeo traduce representaciones externas al modelo canónico interno.'),
  ('n13-mensajeria-empresarial','n13-mensajeria-practica-2','Un consumidor puede recibir el mismo mensaje más de una vez. ¿Qué propiedad debe tener?','["Procesamiento idempotente","Dependencia de entrega exactamente una vez siempre","Eliminar identificadores","No registrar resultado"]'::jsonb,'A','Los sistemas de mensajería suelen requerir consumidores tolerantes a duplicados.'),
  ('n13-proyecto-enterprise','n13-proyecto-practica-2','¿Qué evidencia es especialmente útil para soporte en una integración empresarial?','["Trazabilidad por lote/mensaje y reglas de reconciliación","Solo el diagrama de ventas","Ningún log","Credenciales dentro del ticket"]'::jsonb,'A','Soporte necesita reconstruir qué datos se movieron y cómo reconciliar diferencias.')
)
insert into public.exercises (lesson_id,slug,prompt,kind,options,explanation,sort_order,status)
select l.id,b.exercise_slug,b.prompt,'multiple_choice',b.options,b.explanation,2,'published'
from bank b join public.lessons l on l.slug=b.lesson_slug
where not exists(select 1 from public.exercises e where e.slug=b.exercise_slug);

with answers(exercise_slug,correct_answer) as (
  values
  ('n12-oauth-practica-2','A'),('n12-scopes-practica-2','A'),('n12-automatizacion-practica-2','A'),('n12-jobs-practica-2','A'),('n12-sync-practica-2','A'),('n12-proyecto-practica-2','A'),
  ('n13-erp-practica-2','A'),('n13-identidad-practica-2','A'),('n13-batch-practica-2','A'),('n13-etl-practica-2','A'),('n13-mensajeria-practica-2','A'),('n13-proyecto-practica-2','A')
)
insert into public.exercise_solutions(exercise_id,correct_answer)
select e.id,a.correct_answer from answers a join public.exercises e on e.slug=a.exercise_slug
where not exists(select 1 from public.exercise_solutions s where s.exercise_id=e.id);

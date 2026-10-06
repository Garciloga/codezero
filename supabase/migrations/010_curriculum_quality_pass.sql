-- Curriculum quality pass. Reapplies improved instructional text,
-- formative exercises and level-specific exams to a fresh database.
update public.lessons le
set content =
  'Objetivo de la lección: ' || le.title || E'.\n\n' ||
  case lv.level_number
    when 1 then E'Pensamiento computacional significa resolver problemas de forma explícita antes de pensar en sintaxis. Identifica el objetivo, las entradas disponibles, la salida esperada, las restricciones y los casos que podrían romper la solución.\n\nEjemplo guiado: imagina un SaaS que debe decidir si un usuario puede acceder a una función. Antes de programar, enumera datos necesarios (plan, estado, cuota), reglas de negocio y respuestas posibles. Después convierte esas reglas en pasos comprobables.\n\nPráctica: describe el problema con tus palabras, divídelo en al menos tres subtareas y diseña un caso normal, uno límite y uno inválido.\n\nCriterio de dominio: puedes explicar por qué tu solución funciona y qué supuestos estás haciendo.'
    when 2 then E'Python permite representar datos y comportamiento de forma legible. Trabaja la sintaxis asociada al tema y también la intención: qué datos entran, qué transformación ocurre y qué resultado sale.\n\nEjemplo guiado: modela una regla sencilla de un producto SaaS, como calcular créditos restantes o decidir si un plan tiene acceso a una función. Usa nombres descriptivos y comprueba resultados con varios ejemplos.\n\nPráctica: escribe una versión mínima, ejecútala con tres entradas diferentes y explica cada línea.\n\nCriterio de dominio: puedes modificar el ejemplo sin copiarlo y anticipar errores comunes.'
    when 3 then E'El objetivo ya no es solo que el programa funcione, sino que sea mantenible. Separa responsabilidades, controla errores esperables y diseña componentes que puedan probarse de manera aislada.\n\nEjemplo guiado: separa lectura, validación, lógica y salida.\n\nPráctica: identifica una parte que podría fallar y escribe una prueba del comportamiento esperado.\n\nCriterio de dominio: otra persona puede entender y cambiar tu código sin rehacerlo completo.'
    when 4 then E'Las estructuras de datos y los algoritmos determinan cómo escala una solución. Relaciona cada estructura con operaciones concretas como buscar, insertar, ordenar, recorrer o eliminar.\n\nEjemplo guiado: compara localizar un usuario por email en una lista frente a un diccionario indexado.\n\nPráctica: justifica la estructura elegida para un caso de producto real.\n\nCriterio de dominio: puedes argumentar una decisión de eficiencia con claridad.'
    when 5 then E'Un flujo profesional combina terminal, Git y colaboración. Cada cambio debe ser reproducible, revisable y fácil de revertir.\n\nEjemplo guiado: crea una rama, realiza cambios acotados, revisa el diff y registra un commit descriptivo.\n\nPráctica: explica qué cambiaste, cómo verificaste el resultado y cómo revertirías el cambio.\n\nCriterio de dominio: puedes explicar el historial de una funcionalidad.'
    when 6 then E'Una base de datos relacional modela hechos y relaciones. Define entidades, claves, cardinalidades y reglas de integridad antes de escribir SQL.\n\nEjemplo guiado: modela usuarios, planes y suscripciones.\n\nPráctica: escribe una consulta para responder una pregunta de negocio y verifica el resultado.\n\nCriterio de dominio: puedes explicar el modelo y la consulta.'
    when 7 then E'La web combina estructura, presentación y comportamiento. HTML expresa significado, CSS organiza la interfaz y JavaScript responde a acciones y datos.\n\nEjemplo guiado: construye una tarjeta de plan SaaS accesible, responsive y con estados de carga, error y éxito.\n\nPráctica: prueba teclado, pantalla pequeña y un fallo de red.\n\nCriterio de dominio: puedes explicar qué responsabilidad pertenece a HTML, CSS o JavaScript.'
    when 8 then E'Un backend expone capacidades mediante contratos. Una API robusta valida entradas, autentica, autoriza, ejecuta lógica y responde de forma consistente.\n\nEjemplo guiado: diseña un endpoint para actualizar un perfil con método, ruta, validaciones y respuestas.\n\nPráctica: documenta el contrato antes de implementarlo.\n\nCriterio de dominio: un consumidor puede usar tu API sin conocer su implementación.'
    when 9 then E'Ingeniería de software significa diseñar para cambiar con seguridad. Arquitectura, pruebas, observabilidad y entrega continua reducen el costo de mantenimiento.\n\nEjemplo guiado: define límites de módulos, pruebas, señales de observabilidad y un pipeline mínimo de CI.\n\nPráctica: identifica un fallo probable en producción y cómo lo diagnosticarías.\n\nCriterio de dominio: conectas decisiones de diseño con calidad y operación.'
    when 10 then E'Este nivel convierte conocimientos aislados en un producto coherente. Trabaja desde el problema y los criterios de éxito hasta implementación, pruebas, documentación y demostración.\n\nPráctica: registra decisiones técnicas y trade-offs.\n\nCriterio de dominio: puedes defender el producto y su arquitectura.'
    when 11 then E'Las integraciones por API y webhook conectan sistemas que fallan de forma independiente. Diseña pensando en autenticidad, reintentos, duplicados, orden de eventos y observabilidad.\n\nPráctica: simula el mismo evento dos veces y una entrega fuera de orden.\n\nCriterio de dominio: tu integración tolera fallos normales de red sin corromper estado.'
    when 12 then E'OAuth y automatización permiten actuar en nombre de usuarios sin compartir contraseñas. Limita scopes, protege tokens y separa trabajos interactivos de procesos asíncronos.\n\nPráctica: enumera exactamente qué permisos necesita la integración.\n\nCriterio de dominio: puedes explicar el ciclo de vida completo de una autorización.'
    when 13 then E'Las integraciones empresariales conectan sistemas con modelos de datos, ritmos y propietarios distintos. Define sistema fuente, claves de correlación, mapeo, frecuencia, errores y reconciliación.\n\nPráctica: crea una tabla de mapeo de campos.\n\nCriterio de dominio: diseñas para auditoría y recuperación.'
    when 14 then E'Arquitectura segura parte de amenazas y fallos concretos. Protege secretos, minimiza privilegios y diseña degradación controlada.\n\nPráctica: documenta qué ocurre si un proveedor está lento, una credencial se filtra o el tráfico crece 100 veces.\n\nCriterio de dominio: justificas controles por riesgo.'
    when 15 then E'El capstone final demuestra que puedes llevar una integración desde descubrimiento hasta operación. Debes transformar requisitos ambiguos en un sistema verificable, seguro y mantenible.\n\nPráctica: prepara una demo con flujo feliz y al menos un fallo realista con recuperación.\n\nCriterio de dominio: puedes explicar decisiones, riesgos, límites y operación del sistema.'
  end ||
  E'\n\nEnfoque específico: ' || le.title ||
  E'.\n\nChecklist antes de avanzar:\n- Puedo explicar el concepto sin leer la lección.\n- Puedo construir un ejemplo pequeño por mi cuenta.\n- Puedo nombrar al menos un error o caso límite.\n- Puedo relacionar el tema con una situación real de SaaS o integraciones.'
from public.levels lv
where le.level_id = lv.id;

with base as (
  select e.id as exercise_id, le.title as lesson_title, le.sort_order, lv.level_number,
    case
      when lv.level_number between 2 and 15 then
        case lv.level_number
          when 2 then 'Construir un ejemplo pequeño en Python, comprobar varias entradas y explicar el resultado.'
          when 3 then 'Separar responsabilidades, manejar fallos esperables y añadir una prueba verificable.'
          when 4 then 'Elegir una estructura o algoritmo justificando operaciones y complejidad.'
          when 5 then 'Hacer un cambio aislado, revisar el diff, validarlo y registrarlo con un commit claro.'
          when 6 then 'Modelar relaciones y escribir una consulta que responda una pregunta de negocio concreta.'
          when 7 then 'Separar estructura, presentación y comportamiento, contemplando carga y errores.'
          when 8 then 'Definir contrato, validar entradas, autenticar, autorizar y responder con códigos consistentes.'
          when 9 then 'Diseñar para cambios seguros usando pruebas, observabilidad y automatización.'
          when 10 then 'Relacionar problema, alcance, diseño, implementación, pruebas y documentación.'
          when 11 then 'Diseñar para firmas, reintentos, idempotencia, orden de eventos y trazabilidad.'
          when 12 then 'Usar permisos mínimos, proteger tokens y mover trabajos lentos a procesos asíncronos.'
          when 13 then 'Definir sistema fuente, mapeo, correlación, reconciliación y auditoría.'
          when 14 then 'Partir de amenazas y fallos concretos para elegir controles y mecanismos de resiliencia.'
          when 15 then 'Demostrar el flujo completo, incluyendo operación, fallos y recuperación.'
        end
    end as good
  from public.exercises e
  join public.lessons le on le.id=e.lesson_id
  join public.levels lv on lv.id=le.level_id
  where lv.level_number >= 2
)
update public.exercises e
set prompt='En una situación real relacionada con "' || b.lesson_title || '", ¿qué enfoque demuestra mejor comprensión profesional?',
    options=jsonb_build_array(
      case when mod(b.sort_order,4)=1 then b.good else 'Memorizar el concepto sin aplicarlo ni verificarlo.' end,
      case when mod(b.sort_order,4)=2 then b.good else 'Ignorar errores y casos límite para terminar más rápido.' end,
      case when mod(b.sort_order,4)=3 then b.good else 'Elegir la opción más compleja aunque no responda al problema.' end,
      case when mod(b.sort_order,4)=0 then b.good else 'Depender de supuestos no comprobados y evitar pruebas.' end
    ),
    explanation='La mejor respuesta conecta el concepto con una decisión verificable, considera errores y permite explicar por qué funciona.'
from base b
where e.id=b.exercise_id;

with answers as (
  select e.id as exercise_id,
    case mod(le.sort_order,4) when 1 then 'A' when 2 then 'B' when 3 then 'C' else 'D' end as answer
  from public.exercises e
  join public.lessons le on le.id=e.lesson_id
  join public.levels lv on lv.id=le.level_id
  where lv.level_number >= 2
)
update public.exercise_solutions s
set correct_answer=a.answer
from answers a
where s.exercise_id=a.exercise_id;

update public.exam_questions set prompt='¿Cuál es el mejor primer paso antes de programar una solución?', options='["Elegir un framework","Definir objetivo, entradas, salidas y restricciones","Escribir código de inmediato","Optimizar rendimiento"]'::jsonb where id=1;
update public.exam_solutions set correct_answer='B' where question_id=1;
update public.exam_questions set prompt='Si un problema es muy grande, ¿qué técnica ayuda a hacerlo manejable?', options='["Descomponerlo en subtareas verificables","Agregar más variables","Evitar casos límite","Copiar una solución completa"]'::jsonb where id=2;
update public.exam_solutions set correct_answer='A' where question_id=2;
update public.exam_questions set prompt='¿Qué valida mejor un algoritmo antes de implementarlo?', options='["Solo un caso feliz","Casos normales, límite e inválidos","Solo medir velocidad","Cambiar de lenguaje"]'::jsonb where id=3;
update public.exam_solutions set correct_answer='B' where question_id=3;
update public.exam_questions set prompt='En Python, ¿qué práctica mejora la claridad al trabajar con variables?', options='["Usar nombres descriptivos","Usar siempre nombres de una letra","Guardar todo como texto","Evitar tipos simples"]'::jsonb where id=4;
update public.exam_solutions set correct_answer='A' where question_id=4;
update public.exam_questions set prompt='¿Cuándo conviene usar una condición if?', options='["Cuando una acción depende de una regla booleana","Cuando siempre se repite una acción","Para importar módulos","Para definir una lista"]'::jsonb where id=5;
update public.exam_solutions set correct_answer='A' where question_id=5;
update public.exam_questions set prompt='¿Qué ventaja principal ofrece una función?', options='["Evita toda validación","Encapsula una tarea reutilizable con entradas y salida","Elimina la necesidad de pruebas","Hace globales todas las variables"]'::jsonb where id=6;
update public.exam_solutions set correct_answer='B' where question_id=6;
update public.exam_questions set prompt='¿Qué debe hacer un programa ante un error esperado de entrada?', options='["Ignorarlo siempre","Manejarlo explícitamente y dar una respuesta controlada","Cerrar el sistema completo","Convertirlo en comentario"]'::jsonb where id=7;
update public.exam_solutions set correct_answer='B' where question_id=7;
update public.exam_questions set prompt='¿Qué característica describe mejor una clase bien diseñada?', options='["Tiene muchas responsabilidades","Agrupa estado y comportamiento relacionados","Depende de variables globales","No puede probarse"]'::jsonb where id=8;
update public.exam_solutions set correct_answer='B' where question_id=8;
update public.exam_questions set prompt='¿Qué prueba es más útil para una función de cálculo?', options='["Una que solo comprueba que existe","Una que verifica entradas conocidas y resultados esperados","Una que nunca se ejecuta","Una que cambia el código"]'::jsonb where id=9;
update public.exam_solutions set correct_answer='B' where question_id=9;
update public.exam_questions set prompt='¿Por qué un diccionario suele ser mejor que una lista para buscar por una clave única?', options='["Porque siempre usa menos memoria","Porque ofrece acceso promedio más rápido por clave","Porque ordena automáticamente","Porque evita duplicados por sí solo"]'::jsonb where id=10;
update public.exam_solutions set correct_answer='B' where question_id=10;
update public.exam_questions set prompt='¿Qué representa O(n) en complejidad?', options='["Un algoritmo que tarda exactamente n segundos","Un costo que crece aproximadamente en proporción al tamaño de entrada","Un algoritmo sin bucles","Una estructura de datos"]'::jsonb where id=11;
update public.exam_solutions set correct_answer='B' where question_id=11;
update public.exam_questions set prompt='¿Qué estructura es natural para procesar elementos en orden FIFO?', options='["Pila","Cola","Árbol","Conjunto"]'::jsonb where id=12;
update public.exam_solutions set correct_answer='B' where question_id=12;
update public.exam_questions set prompt='¿Qué comando de Git guarda una instantánea lógica de cambios preparados?', options='["git commit","git pull","git clone","git status"]'::jsonb where id=13;
update public.exam_solutions set correct_answer='A' where question_id=13;
update public.exam_questions set prompt='¿Para qué sirve una rama de Git?', options='["Para borrar el historial","Para aislar una línea de trabajo","Para reemplazar commits","Para ejecutar tests"]'::jsonb where id=14;
update public.exam_solutions set correct_answer='B' where question_id=14;
update public.exam_questions set prompt='¿Qué hace una pull request útil?', options='["Oculta los cambios","Facilita revisión, discusión y validación antes de integrar","Elimina la necesidad de ramas","Fusiona automáticamente sin controles"]'::jsonb where id=15;
update public.exam_solutions set correct_answer='B' where question_id=15;
update public.exam_questions set prompt='¿Qué problema resuelve una clave primaria?', options='["Define el color de una tabla","Identifica de forma única cada fila","Ordena todas las consultas","Cifra los datos"]'::jsonb where id=16;
update public.exam_solutions set correct_answer='B' where question_id=16;
update public.exam_questions set prompt='¿Cuándo necesitas un JOIN?', options='["Cuando combinas datos relacionados de varias tablas","Cuando renombras una columna","Cuando borras todos los datos","Cuando creas un índice CSS"]'::jsonb where id=17;
update public.exam_solutions set correct_answer='A' where question_id=17;
update public.exam_questions set prompt='¿Qué busca la normalización?', options='["Duplicar datos para leer más rápido","Reducir redundancia y anomalías de actualización","Eliminar claves foráneas","Guardar todo en una sola tabla"]'::jsonb where id=18;
update public.exam_solutions set correct_answer='B' where question_id=18;
update public.exam_questions set prompt='¿Qué aporta HTML semántico?', options='["Solo estilos visuales","Estructura con significado para accesibilidad y mantenibilidad","Hace peticiones HTTP","Reemplaza JavaScript"]'::jsonb where id=19;
update public.exam_solutions set correct_answer='B' where question_id=19;
update public.exam_questions set prompt='¿Qué herramienta de CSS es apropiada para layouts bidimensionales?', options='["Grid","JSON","DOM","Fetch"]'::jsonb where id=20;
update public.exam_solutions set correct_answer='A' where question_id=20;
update public.exam_questions set prompt='¿Qué debe manejar una interfaz al usar fetch?', options='["Solo el caso de éxito","Carga, éxito y error","Solo errores 404","Nada, fetch nunca falla"]'::jsonb where id=21;
update public.exam_solutions set correct_answer='B' where question_id=21;
update public.exam_questions set prompt='¿Qué código HTTP representa normalmente una creación exitosa?', options='["201","404","500","301"]'::jsonb where id=22;
update public.exam_solutions set correct_answer='A' where question_id=22;
update public.exam_questions set prompt='¿Qué diferencia principal hay entre autenticación y autorización?', options='["No hay diferencia","Autenticación identifica; autorización decide permisos","Autorización identifica; autenticación cifra","Ambas solo aplican a bases de datos"]'::jsonb where id=23;
update public.exam_solutions set correct_answer='B' where question_id=23;
update public.exam_questions set prompt='¿Qué debe hacer una API con entrada inválida?', options='["Procesarla igualmente","Validarla y responder con un error consistente","Guardar datos parciales","Devolver siempre 200"]'::jsonb where id=24;
update public.exam_solutions set correct_answer='B' where question_id=24;
update public.exam_questions set prompt='¿Qué beneficio aporta separar módulos por responsabilidad?', options='["Aumenta acoplamiento","Facilita cambios, pruebas y comprensión","Elimina la documentación","Impide reutilización"]'::jsonb where id=25;
update public.exam_solutions set correct_answer='B' where question_id=25;
update public.exam_questions set prompt='¿Qué señal ayuda más a diagnosticar un fallo en producción?', options='["Logs estructurados con contexto","Comentarios del código","Nombre del repositorio","Número de ramas"]'::jsonb where id=26;
update public.exam_solutions set correct_answer='A' where question_id=26;
update public.exam_questions set prompt='¿Qué objetivo cumple CI?', options='["Ejecutar validaciones automáticas ante cambios","Reemplazar la base de datos","Evitar commits","Diseñar interfaces"]'::jsonb where id=27;
update public.exam_solutions set correct_answer='A' where question_id=27;
update public.exam_questions set prompt='Antes de construir un capstone, ¿qué debe quedar claro?', options='["Solo el nombre del proyecto","Problema, usuario, alcance y criterios de éxito","El color del logo","La herramienta de despliegue"]'::jsonb where id=28;
update public.exam_solutions set correct_answer='B' where question_id=28;
update public.exam_questions set prompt='¿Qué debe incluir un diseño técnico defendible?', options='["Decisiones, alternativas y trade-offs","Solo una captura de pantalla","Solo código","Ningún supuesto"]'::jsonb where id=29;
update public.exam_solutions set correct_answer='A' where question_id=29;
update public.exam_questions set prompt='¿Qué evidencia demuestra que el capstone está listo para revisión?', options='["Que compila una vez","Que puede ejecutarse, probarse, documentarse y explicarse","Que tiene muchas funciones","Que usa varias tecnologías"]'::jsonb where id=30;
update public.exam_solutions set correct_answer='B' where question_id=30;
update public.exam_questions set prompt='¿Por qué un webhook debe ser idempotente?', options='["Para que solo acepte GET","Para tolerar entregas duplicadas sin repetir efectos","Para evitar firmas","Para eliminar logs"]'::jsonb where id=31;
update public.exam_solutions set correct_answer='B' where question_id=31;
update public.exam_questions set prompt='¿Qué protege una firma de webhook?', options='["Confirma que el mensaje proviene de una fuente autorizada y no fue alterado","Cifra toda la base de datos","Evita cualquier reintento","Autentica al usuario final"]'::jsonb where id=32;
update public.exam_solutions set correct_answer='A' where question_id=32;
update public.exam_questions set prompt='¿Qué estrategia es correcta ante un fallo temporal del receptor?', options='["Descartar el evento","Reintentar con política controlada y observabilidad","Duplicar datos manualmente","Cambiar el payload al azar"]'::jsonb where id=33;
update public.exam_solutions set correct_answer='B' where question_id=33;
update public.exam_questions set prompt='¿Qué problema resuelve OAuth 2.0 en una integración?', options='["Compartir contraseñas entre apps","Delegar acceso limitado sin compartir la contraseña","Eliminar scopes","Cifrar archivos locales"]'::jsonb where id=34;
update public.exam_solutions set correct_answer='B' where question_id=34;
update public.exam_questions set prompt='¿Qué principio debe seguir la selección de scopes?', options='["Solicitar todos por si acaso","Pedir solo los permisos necesarios","Usar siempre permisos de administrador","Evitar expiración"]'::jsonb where id=35;
update public.exam_solutions set correct_answer='B' where question_id=35;
update public.exam_questions set prompt='¿Cuándo conviene usar una cola o job asíncrono?', options='["Para tareas lentas o reintentables fuera de la respuesta inmediata","Para cambiar CSS","Para definir una variable local","Para renderizar un texto estático"]'::jsonb where id=36;
update public.exam_solutions set correct_answer='A' where question_id=36;
update public.exam_questions set prompt='En una integración CRM-ERP, ¿qué debe definirse primero para sincronizar registros?', options='["Una clave de correlación y el sistema fuente","El color del dashboard","El proveedor de hosting","Un webhook sin contrato"]'::jsonb where id=37;
update public.exam_solutions set correct_answer='A' where question_id=37;
update public.exam_questions set prompt='¿Qué función cumple un mapeo de datos?', options='["Relaciona campos y transformaciones entre modelos distintos","Elimina todos los errores","Sustituye autenticación","Reemplaza pruebas"]'::jsonb where id=38;
update public.exam_solutions set correct_answer='A' where question_id=38;
update public.exam_questions set prompt='¿Qué mejora la auditabilidad de una integración empresarial?', options='["No guardar historial","Registrar identificadores, estados y errores de sincronización","Ocultar fallos","Usar solo procesos manuales"]'::jsonb where id=39;
update public.exam_solutions set correct_answer='B' where question_id=39;
update public.exam_questions set prompt='¿Qué busca un threat model?', options='["Enumerar amenazas, activos, límites de confianza y controles","Elegir un framework","Aumentar logs sin objetivo","Ocultar arquitectura"]'::jsonb where id=40;
update public.exam_solutions set correct_answer='A' where question_id=40;
update public.exam_questions set prompt='¿Dónde deben almacenarse secretos de producción?', options='["En el repositorio","En un gestor/entorno seguro fuera del código","En comentarios","En el navegador del usuario"]'::jsonb where id=41;
update public.exam_solutions set correct_answer='B' where question_id=41;
update public.exam_questions set prompt='¿Qué patrón mejora resiliencia ante un proveedor externo inestable?', options='["Reintentos ilimitados inmediatos","Timeouts, reintentos con backoff y circuit breaker cuando aplica","Ignorar errores","Duplicar todas las peticiones"]'::jsonb where id=42;
update public.exam_solutions set correct_answer='B' where question_id=42;
update public.exam_questions set prompt='¿Qué debe incluir el descubrimiento de una integración final?', options='["Objetivos, sistemas, actores, datos, restricciones y éxito","Solo endpoints","Solo credenciales","Solo UI"]'::jsonb where id=43;
update public.exam_solutions set correct_answer='A' where question_id=43;
update public.exam_questions set prompt='¿Qué hace una prueba end-to-end?', options='["Valida un componente aislado","Verifica el flujo completo entre componentes reales o representativos","Solo revisa estilos","Solo compila TypeScript"]'::jsonb where id=44;
update public.exam_solutions set correct_answer='B' where question_id=44;
update public.exam_questions set prompt='¿Para qué sirve un runbook operativo?', options='["Documentar cómo detectar, diagnosticar y responder a incidentes","Diseñar tablas","Reemplazar monitoreo","Ocultar dependencias"]'::jsonb where id=45;
update public.exam_solutions set correct_answer='A' where question_id=45;

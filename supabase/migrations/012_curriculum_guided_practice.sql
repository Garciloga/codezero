-- Curriculum quality pass 2: guided practice, transfer tasks and evidence of mastery.
-- Appends a level-specific practice block to every published lesson.

update public.lessons l
set content = coalesce(l.content, '') || E'\n\n---\n\n' ||
case lv.level_number
  when 1 then
    'LABORATORIO GUIADO · ' || l.title || E'\n' ||
    '1. Reescribe el problema de esta lección con tus propias palabras y separa entradas, proceso y salida.\n' ||
    '2. Divide la solución en pasos suficientemente pequeños para que otra persona pueda seguirlos sin preguntarte nada.\n' ||
    '3. Prueba el procedimiento con un caso normal, uno extremo y uno incorrecto.\n' ||
    '4. Señala qué parte podrías automatizar después con código.\n\n' ||
    'RETO DE TRANSFERENCIA\nElige una situación real de un producto SaaS —por ejemplo alta de un cliente, recuperación de contraseña o asignación de un ticket— y modela el flujo aplicando el concepto de esta lección. Incluye al menos una decisión y un caso límite.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes explicar por qué elegiste cada paso, detectar una ambigüedad y mejorar el proceso sin depender de sintaxis de programación.'
  when 2 then
    'LABORATORIO GUIADO · ' || l.title || E'\n' ||
    'Abre un archivo Python nuevo y construye un ejemplo pequeño centrado únicamente en este concepto. Ejecuta una versión mínima, imprime resultados intermedios y después agrega una segunda variante que maneje un dato inesperado.\n\n' ||
    'RETO SaaS\nModela una parte sencilla de una aplicación: validar un plan, calcular consumo mensual, clasificar un ticket o transformar datos de un usuario. Usa nombres descriptivos y evita valores mágicos.\n\n' ||
    'PRUEBAS MANUALES\nEjecuta al menos tres casos: válido, límite e inválido. Anota qué esperabas y qué ocurrió.\n\n' ||
    'EVIDENCIA DE DOMINIO\nDebes poder modificar el ejemplo sin copiarlo, anticipar el resultado antes de ejecutar y explicar el error si Python no hace lo esperado.'
  when 3 then
    'LABORATORIO GUIADO · ' || l.title || E'\n' ||
    'Toma un script que funcione y refactorízalo para aplicar el concepto de la lección. Separa responsabilidades, elimina duplicación y conserva el comportamiento observable.\n\n' ||
    'RETO PROFESIONAL\nConstruye una pequeña utilidad reutilizable para un equipo SaaS: lectura de datos, validación, transformación o reporte. Añade manejo explícito de errores y una interfaz clara.\n\n' ||
    'CALIDAD\nEscribe casos de prueba o una tabla de pruebas con entradas, salida esperada y salida real. Revisa nombres, tamaño de funciones y dependencias.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes justificar la estructura del código y distinguir entre código que “funciona” y código mantenible.'
  when 4 then
    'LABORATORIO GUIADO · ' || l.title || E'\n' ||
    'Implementa una solución directa y después una segunda versión con una estructura de datos o algoritmo más apropiado. Compara cantidad de operaciones y legibilidad.\n\n' ||
    'RETO DE ESCALA\nImagina que el conjunto de datos pasa de 10 a 10,000 elementos. Explica qué cambia en tiempo, memoria y diseño. Usa ejemplos de usuarios, eventos, tickets o integraciones SaaS.\n\n' ||
    'ANÁLISIS\nDescribe complejidad aproximada, supuestos y casos extremos. No basta con decir que una solución es “más rápida”: explica por qué.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes elegir una estructura de datos razonable y defender la decisión frente a otra alternativa.'
  when 5 then
    'LABORATORIO GUIADO · ' || l.title || E'\n' ||
    'Practica el flujo completo en un repositorio de prueba: inspecciona estado, realiza un cambio pequeño, revisa el diff y conserva un historial entendible.\n\n' ||
    'RETO DE EQUIPO\nSimula una tarea real: crea una rama, implementa el cambio, documenta qué hiciste y prepara una revisión como si otra persona tuviera que aprobarla.\n\n' ||
    'HÁBITO PROFESIONAL\nAntes de cada operación destructiva verifica dónde estás, qué rama usas y qué archivos cambiarán. Evita comandos memorizados sin entender su efecto.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes reconstruir qué ocurrió en el repositorio y explicar cómo revertirías un error sin perder trabajo ajeno.'
  when 6 then
    'LABORATORIO GUIADO · ' || l.title || E'\n' ||
    'Diseña o consulta un conjunto de datos relacionado con clientes, cuentas, suscripciones y actividad. Escribe primero la pregunta de negocio y después la consulta SQL.\n\n' ||
    'RETO SaaS\nResponde una pregunta operacional —por ejemplo clientes activos por plan, cuentas sin actividad o consumo agregado— y valida manualmente una muestra del resultado.\n\n' ||
    'CALIDAD DE DATOS\nConsidera NULL, duplicados, relaciones faltantes y filtros de fecha. Explica qué filas deberían quedar fuera y por qué.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes traducir una necesidad de negocio a tablas, relaciones y una consulta verificable.'
  when 7 then
    'LABORATORIO GUIADO · ' || l.title || E'\n' ||
    'Construye una interfaz pequeña y observable. Empieza con estructura, añade presentación y finalmente comportamiento; prueba cada capa antes de continuar.\n\n' ||
    'RETO DE PRODUCTO\nCrea una pantalla relacionada con SaaS: onboarding, lista de integraciones, estado de cuenta o panel de uso. Debe funcionar con teclado y conservar jerarquía semántica.\n\n' ||
    'PRUEBAS\nVerifica viewport móvil y escritorio, estados vacío/cargando/error cuando corresponda y comportamiento ante datos inesperados.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes explicar qué responsabilidad pertenece a HTML, CSS y JavaScript y detectar cuándo estás mezclando capas innecesariamente.'
  when 8 then
    'LABORATORIO GUIADO · ' || l.title || E'\n' ||
    'Diseña una operación de API desde el contrato hacia la implementación: método, ruta, entrada, salida, códigos HTTP y errores esperados.\n\n' ||
    'RETO BACKEND\nImplementa o escribe el pseudocódigo de una operación SaaS como crear cliente, actualizar integración o consultar uso. Valida tipos, autorización y estados inexistentes.\n\n' ||
    'PRUEBAS DE CONTRATO\nIncluye caso exitoso, entrada inválida, usuario no autenticado, recurso inexistente y conflicto. Evita devolver detalles internos sensibles.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes defender el contrato de la API independientemente del framework utilizado.'
  when 9 then
    'LABORATORIO GUIADO · ' || l.title || E'\n' ||
    'Toma una funcionalidad pequeña y descríbela como un sistema operable: componentes, dependencias, pruebas, despliegue, señales de salud y estrategia de recuperación.\n\n' ||
    'RETO DE INGENIERÍA\nPropón cómo llevarías un cambio desde una rama hasta producción reduciendo riesgo. Incluye una verificación previa, una posterior y una forma de volver atrás.\n\n' ||
    'REVISIÓN\nPregunta qué fallaría si una dependencia responde lento, si llega un dato inválido o si el despliegue queda a medias.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes razonar sobre calidad y operación, no solo sobre implementar la “happy path”.'
  when 10 then
    'TALLER CAPSTONE · ' || l.title || E'\n' ||
    'Aplica esta lección directamente a tu proyecto profesional. Produce un artefacto revisable: decisión de producto, diagrama, implementación, prueba, documentación o evidencia de entrega según corresponda.\n\n' ||
    'CRITERIO PROFESIONAL\nCada decisión debe tener una razón, una alternativa considerada y una consecuencia. Evita construir por intuición sin registrar supuestos.\n\n' ||
    'REVISIÓN DE ENTREGA\nComprueba que otra persona pueda entender el problema, ejecutar o evaluar tu solución y saber qué queda pendiente.\n\n' ||
    'EVIDENCIA DE DOMINIO\nEl resultado de esta lección debe poder incorporarse al capstone final sin rehacerlo desde cero.'
  when 11 then
    'LABORATORIO DE INTEGRACIÓN · ' || l.title || E'\n' ||
    'Modela el intercambio entre dos sistemas como si estuviera en producción. Define identificadores, autenticación, payload, respuesta, timeout y política de reintento.\n\n' ||
    'RETO SaaS\nDiseña una integración que reciba o envíe eventos de clientes. Incluye duplicados, entrega fuera de orden y caída temporal del receptor.\n\n' ||
    'OBSERVABILIDAD\nDefine qué registrarías para investigar un incidente sin guardar secretos ni datos innecesarios.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes explicar cómo evitar efectos duplicados y cómo demostrar que un evento fue procesado correctamente.'
  when 12 then
    'LABORATORIO DE AUTOMATIZACIÓN · ' || l.title || E'\n' ||
    'Diseña un flujo que conecte una aplicación SaaS con un proveedor externo. Separa claramente autorización, ejecución, renovación de credenciales y sincronización.\n\n' ||
    'RETO\nSimula expiración de token, permisos insuficientes, reintento y actualización parcial. Define qué estados guardarías para retomar el trabajo de forma segura.\n\n' ||
    'SEGURIDAD\nAplica mínimo privilegio y evita registrar tokens. Explica cuándo una tarea debe ser síncrona y cuándo conviene una cola o job.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes describir el ciclo de vida completo de una integración OAuth sin confundir autenticación con autorización.'
  when 13 then
    'LABORATORIO ENTERPRISE · ' || l.title || E'\n' ||
    'Trabaja con un escenario donde los datos provienen de sistemas con modelos distintos, ventanas de mantenimiento y reglas organizacionales. Define un contrato canónico antes de mapear campos.\n\n' ||
    'RETO\nDiseña una sincronización de cuentas o usuarios entre dos sistemas empresariales. Incluye altas, cambios, bajas, conflictos, lotes parciales y trazabilidad.\n\n' ||
    'OPERACIÓN\nEspecifica cómo reconciliarías diferencias y qué evidencia necesitaría soporte para investigar una discrepancia.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes separar el problema de transporte del problema de semántica de datos.'
  when 14 then
    'LABORATORIO DE ARQUITECTURA SEGURA · ' || l.title || E'\n' ||
    'Dibuja el flujo de confianza de una integración: actores, fronteras, secretos, datos sensibles y puntos de entrada. Después identifica al menos tres modos de fallo o abuso.\n\n' ||
    'RETO\nPropón controles preventivos, detectivos y de recuperación para un servicio que procesa eventos externos. Incluye límites, autenticación, autorización, validación y rotación de credenciales.\n\n' ||
    'TRADE-OFF\nExplica qué costo operativo añade cada control y qué riesgo reduce.\n\n' ||
    'EVIDENCIA DE DOMINIO\nPuedes priorizar riesgos en lugar de tratar todos como equivalentes.'
  when 15 then
    'TALLER CAPSTONE PROFESIONAL · ' || l.title || E'\n' ||
    'Convierte esta lección en evidencia concreta del sistema final: documento, diagrama, código, prueba end-to-end, tablero de observabilidad o runbook.\n\n' ||
    'ESCENARIO DE PRODUCCIÓN\nPrueba el sistema bajo éxito, error recuperable y error que requiere intervención humana. Documenta cómo detectarías cada situación y cuál sería la respuesta operativa.\n\n' ||
    'DEFENSA TÉCNICA\nResume arquitectura, riesgos, decisiones y límites actuales como si presentaras la solución a ingeniería, soporte y negocio.\n\n' ||
    'EVIDENCIA DE DOMINIO\nEl entregable debe demostrar que puedes construir, operar y explicar una integración profesional de extremo a extremo.'
end
from public.levels lv
where l.level_id = lv.id
  and l.status = 'published'
  and coalesce(l.content,'') not like '%EVIDENCIA DE DOMINIO%';

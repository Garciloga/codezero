update public.lessons
set content = coalesce(content,'') || E'\n\nEJEMPLO RESUELTO\nUn equipo recibe la petición “automatiza el onboarding”. Antes de pensar en código, separa entrada, proceso y salida: datos del cliente; validación y asignación; onboarding listo. Luego identifica decisiones y errores posibles.\n\nMINI-RETO\nElige una tarea cotidiana y escribe sus entradas, proceso, salida y dos decisiones.'
where slug='pensamiento-computacional-introduccion'
  and coalesce(content,'') not like '%EJEMPLO RESUELTO%';

update public.lessons
set content = coalesce(content,'') || E'\n\nEJEMPLO RESUELTO\nProblema: “un cliente no puede activar una integración”. Divídelo en autenticación, permisos, configuración, conectividad, datos enviados y respuesta del proveedor. Cada bloque debe convertirse en una pregunta comprobable.\n\nMINI-RETO\nDescompón “un usuario no puede iniciar sesión” en cinco subproblemas y escribe una señal para confirmar o descartar cada uno.'
where slug='descomposicion-de-problemas'
  and coalesce(content,'') not like '%EJEMPLO RESUELTO%';

update public.lessons
set content = coalesce(content,'') || E'\n\nEJEMPLO RESUELTO\nTres clientes fallan al importar CSV por razones distintas. Al revisar casos aparecen patrones: encabezados faltantes, fechas inválidas y campos vacíos. La abstracción útil es una regla general de validación previa a importar.\n\nMINI-RETO\nPiensa en tres problemas parecidos y escribe qué cambia, qué se repite y qué regla general los representa.'
where slug='patrones-y-abstraccion'
  and coalesce(content,'') not like '%EJEMPLO RESUELTO%';

update public.lessons
set content = coalesce(content,'') || E'\n\nEJEMPLO RESUELTO\nPara asignar un ticket: leer prioridad, decidir si es crítica, leer categoría, buscar agente disponible, asignar, registrar y notificar. El orden importa y cada paso debe ser verificable.\n\nMINI-RETO\nEscribe un algoritmo de 7 a 10 pasos para restablecer una contraseña de forma segura, incluyendo validación, decisión y salida de error.'
where slug='algoritmos-paso-a-paso'
  and coalesce(content,'') not like '%EJEMPLO RESUELTO%';

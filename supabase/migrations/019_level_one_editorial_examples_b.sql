update public.lessons
set content = coalesce(content,'') || E'\n\nEJEMPLO RESUELTO\nUna plataforma permite exportar datos solo si la cuenta está activa Y el usuario tiene permiso de administrador. Cambiar Y por O haría la regla más permisiva y podría abrir acceso indebido.\n\nMINI-RETO\nDefine la lógica para permitir una función premium: cuenta activa, plan compatible y usuario no suspendido. Escribe tres casos permitidos y tres bloqueados.'
where slug='logica-y-decisiones'
  and coalesce(content,'') not like '%EJEMPLO RESUELTO%';

update public.lessons
set content = coalesce(content,'') || E'\n\nEJEMPLO RESUELTO\nEnviar el mismo recordatorio a 500 clientes repite la misma secuencia: leer cliente, preparar mensaje, enviar y registrar resultado. La automatización debe manejar cada iteración sin detener todo si una falla.\n\nMINI-RETO\nDescribe una tarea repetitiva de al menos 20 elementos. Define qué cambia, qué permanece igual y qué debería ocurrir si una iteración falla.'
where slug='repeticion-y-eficiencia'
  and coalesce(content,'') not like '%EJEMPLO RESUELTO%';

update public.lessons
set content = coalesce(content,'') || E'\n\nEJEMPLO RESUELTO\nUna calculadora funciona en casos normales pero falla cuando un divisor vale cero. El bug aparece en un caso límite. Depurar implica reproducir, aislar la causa, corregir y volver a probar casos que antes funcionaban.\n\nMINI-RETO\nPara un formulario de edad, define casos normal, mínimo, máximo, vacío, texto y fuera de rango, con resultado esperado.'
where slug='depuracion-y-casos-limite'
  and coalesce(content,'') not like '%EJEMPLO RESUELTO%';

update public.lessons
set content = coalesce(content,'') || E'\n\nEJEMPLO RESUELTO\nProyecto modelo: diseñar el alta de una cuenta SaaS. Define actores, entradas, pasos, decisiones, errores y resultado final. Añade un caso exitoso y otro rechazado por datos incompletos.\n\nMINI-PROYECTO\nDiseña un proceso completo de onboarding, soporte, reserva, compra o registro. Entrega problema, entradas, salidas, algoritmo, decisiones, repeticiones, casos límite y qué automatizarías primero.'
where slug='proyecto-pensamiento-computacional'
  and coalesce(content,'') not like '%EJEMPLO RESUELTO%';

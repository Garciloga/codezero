update public.level_projects
set
  brief = 'Construye y documenta un producto SaaS funcional de extremo a extremo. La entrega debe partir de un problema concreto y mostrar una solución reproducible con frontend, backend, base de datos, autenticación, validación, pruebas y operación básica. Debes explicar decisiones, límites y evidencia de que el flujo principal funciona. La evaluación considera claridad del problema, calidad técnica, seguridad básica, pruebas, documentación y capacidad de demostrar la solución.',
  requirements = '[
    "Definir problema, usuario objetivo y criterio de éxito verificable",
    "Delimitar alcance e incluir al menos dos elementos fuera de alcance",
    "Diseñar arquitectura con frontend, backend, datos y autenticación",
    "Implementar un flujo principal completo y reproducible",
    "Aplicar validación y autorización en operaciones sensibles",
    "Documentar modelo de datos y contratos principales de API",
    "Incluir manejo explícito de estados de carga, error y vacío",
    "Agregar pruebas sobre reglas críticas y al menos un flujo integrado",
    "Documentar instalación, configuración, ejecución y limitaciones conocidas",
    "Preparar demo, evidencia de pruebas y explicación de decisiones técnicas"
  ]'::jsonb
where id=1;

update public.level_projects
set
  brief = 'Diseña y demuestra una integración empresarial de extremo a extremo entre dos sistemas SaaS. La solución debe contemplar autenticación, contratos de datos, sincronización, reintentos, idempotencia, observabilidad, seguridad y operación. La entrega debe incluir tanto el happy path como fallos recuperables y un runbook que permita diagnosticar incidentes sin depender del autor.',
  requirements = '[
    "Definir sistemas origen/destino, actores, objetivo y volumen esperado",
    "Documentar modelo canónico y reglas de mapeo entre ambos sistemas",
    "Diseñar autenticación, scopes y estrategia de gestión de secretos",
    "Implementar al menos un flujo completo de sincronización o evento",
    "Evitar efectos duplicados mediante idempotencia y claves estables",
    "Manejar timeouts, rate limits y reintentos con límites explícitos",
    "Definir estrategia de reconciliación y recuperación ante fallos parciales",
    "Agregar logs correlacionados, métricas y estados de procesamiento",
    "Probar happy path, duplicado, error de permisos y fallo transitorio",
    "Entregar runbook, diagrama de arquitectura, demo y defensa de trade-offs"
  ]'::jsonb
where id=2;

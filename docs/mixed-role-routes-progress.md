# Rutas mixtas por puesto · borrador, no publicado

Isaac aprobó el mapa combinado y autorizó sustituir sandbox cloud por desarrollo aislado, controles completos y una publicación productiva con flag. La entrega conserva seis unidades de ocho pasos y excluye el resto de unidades. Las capturas de ruta, manager y actividad móvil son referencias estructurales para C · Vivo.

## Avance real

Se preparó feature/mixed-role-routes sobre la instantánea productiva 317c7d55ad4bdffe0ab9e1488ce9bc835b9e8615. Separada del trabajo anterior de comunidad/mentorías; no incorpora su migración pendiente.

mixed-role-content.ts define las seis unidades, 48 pasos, dos de cada tipo, empresa ficticia Faro y referencias a actividades publicadas. No duplica rutas ni agrega entradas al catálogo de 361. Tech Support T2/T3 comparte unidad entre dos perfiles. Product Specialist tiene una inserción de perfil propuesta reutilizando inicialmente los valores de Project Manager; necesita revisión de sus expectativas antes de publicar.

mixed-role-model.ts asigna las diez competencias a un único tipo. Los promedios se calculan sobre los niveles existentes validados, no sobre calificaciones ponderadas ni autoevaluaciones. Equipo vacío no recibe nivel ficticio. Sin evidencia suficiente no se identifica un tipo como debilidad demostrada.

La migración aditiva propuesta crea pasos, asociación de entregas y flag de activación inicialmente falso. Reutiliza submit_training_practice y evidencias existentes. Una guarda propuesta impide revisión propia de entregas mixtas incluso a un administrador. No cambia RLS existente, precios, Stripe, Auth ni cuotas. No se ha aplicado ni probado en PostgreSQL.

API y políticas de activación iniciales están escritas, pero no verificadas end-to-end. No hay todavía páginas funcionales para las tres vistas, escenarios completos de herramientas ni datasets técnicos encadenados.

## Validación y bloqueo

Cinco pruebas nuevas del modelo pasan. La suite completa falla en cobertura de traducciones nuevas: ES/EN/PT/FR todavía no está completo. No se declara build, seguridad, PostgreSQL, recorrido de navegador ni CI final en verde.

Firefox y WebKit se descargaron, pero WebKit no arranca por bibliotecas faltantes. Instalación de dependencias falla por permisos del sistema (setgroups y escritura en /var/cache/apt/archives/partial); el intento alternativo de instalación evita el primer fallo pero no el segundo. Se detuvo el trabajo ante ese bloqueo según la instrucción de Isaac. CI en un runner con dependencias sería una alternativa para resolver la validación, pero no se ha ejecutado para esta entrega.

## Pendientes

Completar vistas de ruta/actividad/manager con tokens actuales, seis escenarios completos, datasets de práctica conectados al paso anterior y ejercicios sin red; traducciones equivalentes en cuatro idiomas; prueba de aislamiento, rúbrica/revisión propia/roles/idempotencia/privacidad y preservación de evidencias; PostgreSQL, build, seguridad y Chromium/Firefox/WebKit en verde; un PR consolidado; migración, publicación, READY/SHA/smoke y activación controlada.

No hay migración productiva, cambio de main, despliegue ni activación. Los antecedentes de fallo del conector Supabase requieren comprobación al retomar la migración, sin dar por resuelto ni actual un error anterior.

Horas estimadas no equivalen a validación pedagógica, revisión nativa o desempeño laboral real. Las marcas solo podrán usarse como ejemplos de categoría; el proveedor excluido por Isaac no aparece en contenido ni casos.

# Career Guidance · Fase 0 interna

Estado: implementación para revisión, datos exclusivamente sintéticos.

## Entrada y acceso

- Ruta oculta: /internal/career-lab. No se añade a navegación ni sitemap.
- Página y POST /api/internal/career-lab verifican sesión con getUser y consultan únicamente role/status del perfil existente.
- Solo role=owner y status=active. Admin, usuarios, perfiles ausentes y suspendidos quedan fuera.
- El endpoint rechaza otro Origin, contenido no JSON y cuerpos de más de 4096 bytes; responde sin caché.
- La autenticación puede renovar cookies de sesión. No se escriben señales, feedback, consentimientos o resultados Career Guidance.

## Diagnóstico de prueba

Ocho actividades cerradas, hasta tres comparaciones adaptativas, validación del transcript completo en cada petición. El servidor deriva señales; no admite scores, texto personal, CV, experiencia libre o pesos enviados por el navegador. Se verifica versión del modelo, orden, límites de opciones y duplicados.

Rúbrica provisional: opciones de las primeras siete actividades producen valores .85/.4/.15 en dimensiones de la actividad. La octava elección y comparaciones aportan preferencia. Esto ensaya el recorrido y no sustituye las futuras tareas abiertas, evaluación de entregas o validación empírica.

35 escenarios: 16 canónicos, 16 mezclas de frontera y tres casos de evidencia ausente, escasa y en conflicto. Los canónicos se derivan de la matriz existente: no prueban utilidad real. Las mezclas usan el vecino del catálogo, no representan necesariamente una pareja de roles similares.

Se muestran confianza, afinidad, explicaciones, cobertura por posición, gates de experiencia y tensión capacidad/preferencia. Variables faltantes se mantienen ausentes. Management queda fuera del top 3 inicial y disponible como progresión.

## Aprendizaje por decisiones

Las 16 posiciones incluyen tres misiones introductorias cada una (48 en total):

- Fundamentos: explicación, ejemplo y una decisión con feedback específico por opción.
- Práctica guiada: tarea, tres pasos concretos, ejemplo consultable y criterios de revisión.
- Reto autónomo: una condición nueva del caso, entrega y autoevaluación sin mostrar el ejemplo.

El usuario puede explorar cualquiera independientemente de las recomendaciones y elegir fundamentos, práctica guiada o reto autónomo. Las decisiones cambian el siguiente objetivo y el nivel de apoyo. Una respuesta incorrecta ofrece refuerzo; una correcta comprueba comprensión pero deja al usuario elegir el siguiente paso. Afinidad no bloquea navegación.

El progreso temporal se conserva por posición al cambiar de módulo, sin transferir avances entre posiciones. Se registran misiones revisadas, no dominio profesional: fundamentos se revisa con una comprobación de comprensión; práctica/reto requieren tres confirmaciones de autoevaluación. Repetir una misión no incrementa el contador. Se conservan hasta 50 decisiones recientes por módulo y se muestran las últimas diez.

Estas misiones son una primera capa educativa, no cursos completos ni módulos comercializados. No se cobran, habilitan suscripciones, reciben entregas ni certifican competencias en Fase 0.

Feedback, respuestas y decisiones viven temporalmente en el estado de pantalla. Reiniciar, deshabilitar la simulación o recargar elimina ese estado; no se usa almacenamiento del navegador.

## Piloto con decisiones ramificadas · Developer

La misión «Corrige un formulario» añade ocho nodos: regla, refuerzo de regla, servidor, refuerzo de servidor, pruebas, refuerzo de pruebas, reflexión y cierre. Cada opción muestra una consecuencia específica antes de continuar. Una alternativa abre refuerzo; el usuario puede reintentar o explorar otro aspecto sin bloqueo por afinidad.

Las tres comprobaciones de comprensión (regla, servidor y casos de prueba) se cuentan una vez cada una, separadas del progreso de las 48 misiones introductorias y del diagnóstico. Cerrar el recorrido no completa criterios omitidos: la pantalla muestra qué sigue pendiente. No ejecuta código, recibe entregas, certifica habilidades ni modifica la afinidad.

Se puede volver al paso anterior y reiniciar solo el piloto. El estado se conserva al cambiar de modalidad o posición durante la misma sesión del laboratorio; reiniciar el laboratorio lo elimina. Historial acotado a 30 decisiones y 20 pasos de retorno. El cambio de nodo mueve el foco a su encabezado; las consecuencias usan role=status.

Este piloto existe solo en Developer. Antes de ampliar a las otras 15 posiciones, validar caminos de refuerzo y cierre parcial en navegador, accesibilidad y utilidad educativa con revisores.

## Verificación y siguiente fase

Pruebas: gates de acceso, validación maliciosa, replay y límites adaptativos, cobertura de escenarios, datos faltantes, experiencia independiente de afinidad y privacidad del código.

La ampliación de aprendizaje cuenta con pruebas de elecciones libres, feedback correctivo, revisión completa de las 16 rutas, autoevaluaciones incompletas, progreso sin duplicados, aislamiento entre módulos e historial acotado. También se comprobó el render de las 48 misiones y sus controles. Esto no sustituye la prueba visual/interactiva con navegador y sesión real del propietario.

Bloqueo observado en CodeQL del primer commit: GitHub rechazó publicar SARIF porque Code Scanning no está disponible en el repositorio privado. Por autorización de Isaac, se sustituyó el CodeQL automático por CodeZero Security (Semgrep CE con reglas locales y fixtures, detect-secrets y npm audit). CodeQL queda manual pendiente de licencia; no se presenta como aprobado ni equivalente al sustituto. Antes de integrar, exigir Security checks y build exitosos del commit vigente; si una regla de rama aún requiere CodeQL, debe ajustarla el administrador sin eludirla. Véase SECURITY.md.

Antes de beta: validar rúbricas con revisores, ampliar actividades discriminadoras a desempeño real, crear contenidos completos por módulo, revisar consentimiento/retención/exportación y probar migraciones aisladas. Añadir rate limiting distribuido y observabilidad mínima antes de habilitar escrituras. Fase 0 no usa el limitador existente porque escribe en la base; sus entradas, tamaño y cálculo están acotados y el acceso es owner-only.

No se ha aplicado el schema borrador ni habilitado datos reales. El laboratorio anterior al piloto (commit a746e7c) se validó con sesión real de propietario en escritorio: página/API, ocho actividades, elección libre, revisión sin duplicados y borrado al reiniciar/recargar. Eso no verifica las nuevas ramas del piloto. Móvil, lector de pantalla y recorrido completo por teclado siguen pendientes; producción se verifica por separado.

# CodeZero · cuatro idiomas y cierre técnico

Fecha: 7 de octubre de 2026. Este documento sustituye las notas históricas de preparación local; no implica apertura comercial completa.

## Comportamiento

El selector global ofrece Español, English, Português y Français. Visitantes conservan su elección con cookie segura; cuentas verificadas guardan locale como metadato informativo de Auth. La cuenta prevalece sobre la cookie y la selección permanece al navegar y recargar. El idioma solo cambia presentación. Roles, planes, moneda MXN, derechos, cuotas, calificaciones y valores enviados por formularios conservan sus contratos.

Se traducen navegación, acceso, perfil, administración, equipos, ayuda, contenidos comerciales y legales, lecciones, ejercicios, preguntas/opciones de exámenes, proyectos, prácticas y certificados. Fechas y números usan el idioma elegido. Metadatos e imágenes sociales incluyen el idioma. Nombres, correos, código y texto escrito por usuarios permanecen literales.

Catálogos generados con Argos Translate local y glosario técnico, más revisión manual de navegación y textos clave. No se ha realizado revisión humana exhaustiva de todo el contenido en tres idiomas. Hay 1,490 cadenas en el inventario de cliente, 2,437 en el de servidor y 1,498 entradas curriculares/FAQ; los inventarios comparten algunas cadenas. El currículo conserva 15 niveles, 92 lecciones, 184 ejercicios, 15 exámenes, 75 preguntas y 2 proyectos. Los catálogos curriculares se cargan únicamente en servidor, después de los controles existentes; no contienen soluciones oficiales ni entregas de alumnos.

## Otros pendientes cerrados

- Guía de cuatro pasos añadida a cada lección: explicación, predicción, comprobación y evidencia con datos ficticios.
- Búsqueda de ayuda admite términos de FAQ traducidos, sin depender de búsqueda exclusivamente española.
- FAQ y diploma alineados con exámenes/certificados incluidos; no existe un cargo separado de emisión ni una acreditación oficial.
- Registro sincroniza nombres válidos al perfil y repara únicamente nombres vacíos. La migración conserva roles/planes por defecto y la creación de cuota. Metadatos nunca autorizan acceso.
- Exportación incluye preferencia de idioma y metadatos informativos de registro; aviso de privacidad actualizado.
- Simulacro local de backup/restauración verifica datos, roles, RLS y rechazo anónimo. La recuperación de Supabase cloud sigue sin validarse.
- Documentación histórica marcada como antecedente, con checklist y runbook actualizados.

## Comprobación y límites

163 pruebas de aplicación; 33 comprobaciones PostgreSQL de equipos/práctica, 9 de Customer Success, 6 de nombre/registro y restauración local aprobadas. TypeScript y compilación de producción aprobados. Chromium prueba cuatro idiomas, persistencia de visitante y cuenta, formularios, examen con sitting, búsqueda, móvil, Escape/foco y ausencia de errores de página. Auth/PostgREST del navegador son fixtures sintéticas locales, no un registro real ni una prueba de pago o correo. npm audit: cero vulnerabilidades. El detector de secretos conserva reglas generales y exceptúa solo hashes exactos de etiquetas de contraseña y encabezados curriculares revisados.

Migración profile_registration_name aplicada y verificada en producción; cero nombres válidos pendientes de reparación. Security Advisor conserva dos avisos informativos de tablas exclusivamente de servidor y el aviso preexistente de protección contra contraseñas filtradas. No se habilita acceso cliente a esas tablas.

La publicación requiere verificar el SHA de main, CI, deployment READY y smoke público. La evidencia exacta de publicación queda en Operación y control de CodeZero HQ.

## Mantenimiento de traducciones

Los archivos source-ui, source-server, source-curriculum y templates son inventarios versionados de esta entrega. Para un texto nuevo, incorporarlo al inventario correcto y a los tres catálogos; contenido restringido solo pertenece a servidor/curriculum. Mantener código, variables y números literalmente. Ejecutar pruebas de localización y revisar opciones distintas antes de publicar. No reutilizar scripts de extracción/partición inicial sobre inventarios ya particionados sin una revisión de sus diferencias.

Para regenerar desde los inventarios, instalar argostranslate y modelos es→en/en→pt/en→fr fuera del repositorio, ejecutar scripts/localization-build.py y después scripts/localization-curate.py. Caches de traducción son locales e ignoradas. No se requiere Tutor IA ni llamadas de traducción durante el uso de la plataforma. Actualizar la allowlist solo tras revisar cada hallazgo literal; nunca excluir un catálogo completo del detector.

## Dependencias externas abiertas

Dominio/SMTP verificable y pruebas reales de confirmación/recuperación; revisión legal/fiscal; Stripe sandbox separado y validación de facturación conjunta; despliegue autorizado de runtime Python/SQL aislado; backup/restauración cloud; habilitación comercial de CodeQL en el repositorio privado. Tutor IA permanece desactivado y no se solicita nuevamente su credencial ni presupuesto. No se reactivan automatizaciones pausadas.

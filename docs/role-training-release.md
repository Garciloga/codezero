## Validación posterior a la publicación inicial

El cierre del PR #7 (`edfd964`) aprobó CI y seguridad: Chromium/Firefox/WebKit para navegador general, piloto alumno/manager en Chromium, reflow y axe WCAG. Los informes de la publicación inicial que siguen conservaron la limitación visual existente en esa fecha. Ese pendiente automático está resuelto; sesiones humanas reales, lectores físicos, calibración editorial y restauración cloud siguen pendientes. Referencias verificables y árbol publicado: `sandbox-production-parity.md`.

# Publicación · formación por puesto y aprobación de proyectos

Isaac autorizó «Pasa todo a producción» el 7 de octubre de 2026 a las 22:37 CDMX. Se publica todo el alcance previamente aprobado: matriz, tronco común, piloto CS y manager v1, más revisión de proyectos por supervisor/manager y flujos opcionales. No se activan rutas futuras ni Tutor IA, ni se modifica Stripe o precios. Capstones conservan Admin; práctica simulada sigue identificada como tal.

La migración productiva real `20261008044128_production_role_training_and_project_approval.sql` reúne los cinco archivos revisados de sandbox y el catálogo idempotente. Aplicada únicamente al ref productivo `kwfzhpapvpdatdfwhouf`, después de comprobar tablas, columnas, restricciones y permisos previos. Agrega ocho tablas, columnas nullable de puesto/refuerzo, nuevos tipos de asignación, funciones servidor, políticas RLS y triggers invoker; conserva datos y configuración Auth. No repetir las migraciones sandbox en ese proyecto.

Catálogo productivo: 53 actividades y 16 perfiles de puesto. Ningún equipo recibe un flujo inventado: cada manager lo configura cuando lo necesite. La transacción de verificación productiva pasó y se revirtió; dejó cero entregas, evidencias, flujos u organizaciones de prueba. El perfil existente y certificados previos quedaron intactos. SQL reproducible: `supabase/validate_production_role_training.sql`, sin crear/cambiar cuentas Auth.

La activación utiliza `CODEZERO_ROLE_TRAINING=1` y `CODEZERO_ROLE_TRAINING_PRODUCTION=1`, ambas solo en el target production de Vercel, además del guard productivo del workspace ya existente. La URL debe ser exactamente el ref productivo y VERCEL_ENV production; previews no reciben acceso productivo. El sandbox conserva sus guardas anteriores.

Se agregan accesos al menú Vivo: formación por puesto, revisión de proyectos y configuración de aprobaciones para líderes. Esos tres títulos tienen traducciones EN/PT/FR; el contenido editorial del piloto permanece en español y esto se declara en la vista. Se retira “sandbox” de las pantallas productivas. El mismo panel sirve a colaborador y manager.

Verificación previa al envío: 181 pruebas/regresión, 17 grupos PostgreSQL sobre la migración consolidada, siete grupos HTTP con handlers Next reales y fixtures Auth/REST; TypeScript, traducciones y build aprobados. Se corrigió la expectativa desactualizada del script Chromium: la cola del colaborador existe para proyectos delegados y está vacía si no tiene ninguno. El navegador visual no estuvo disponible en el entorno; no se afirma prueba visual, lector físico o flujo con una sesión Auth productiva real.

GitHub mantiene el origen de la revisión en `sandbox/role-training-phases-0-1` y reúne la publicación en un único envío a main, para evitar despliegues pequeños. El resultado READY, URL y SHA se registran en Módulos, Bitácora y Roadmap después de verificarse. No se altera el autodespliegue de otras ramas.

Reversión del código: restaurar la versión Vercel anterior o desactivar la bandera específica del piloto. Las tablas y evidencias nuevas se conservan; no se propone borrar historial ni revertir columnas en caliente. No se realizó una restauración cloud o rollback de deployment como prueba.

Los límites editoriales y de validación se mantienen tras la publicación: 165 horas son estimadas de trabajo, no video producido; calibración con alumnos, revisión visual/accesibilidad, Auth real y organización de capacidad de revisión a volumen siguen pendientes. La publicación no convierte práctica simulada en desempeño laboral real.

# Procesos y actividades — investigación inicial

Investigación y matriz completa: https://app.notion.com/p/3f252732bf948182a932cc70e47ec6cf?pvs=204

Esta entrega refuerza las 16 posiciones del laboratorio interno existente:
proceso, tres prácticas adicionales, entregable, decisión y criterio de revisión.
Son 48 propuestas adicionales, no 48 misiones aprobadas ni un curso terminado.
Las ocho rutas futuras solo tienen investigación editorial y catálogo Próximamente;
no hay cursos nuevos, checkout ni cambio de motor de afinidad.

## Aplicación y validación

Parche CodeZero_role_processes.patch sobre el laboratorio del PR #6
(head auditado 831c366f470482fe7858839a780e5c3fecdc75f7).
Revisar diferencias contra el head actual antes de aplicar. No aplicar directamente
a producción. Requiere lib/career-guidance.ts y learning-path.tsx existentes.

77 pruebas locales y build/TypeScript aprobados con configuración ficticia.
Los tests existentes confirman progresión/decisiones; la revisión visual del panel
sigue pendiente. No se crearon usuarios ni solicitudes de IA/cargos/despliegues.

## Continuidad editorial

Antes de convertir una propuesta en unidad completa: preparar dataset ficticio,
plantilla, ejemplo de entrega, feedback para alternativas y rúbrica; revisión del
proceso por alguien con experiencia; validación con alumnos. Compartir fundamentos
para evitar duplicar comunicación, privacidad, priorización y datos.

La documentación distingue respaldo de fuentes primarias de propuestas propias.
Ninguna fuente aislada representa todo el mercado ni valida afinidad psicológica.
El catálogo futuro no debe anunciar disponibilidad, certificados o fechas.

## Continuación: plantillas y caso Customer Success

16 plantillas de entrega específicas por posición en ROLE_DELIVERY_TEMPLATES.
Caso Cuenta Faro: ocho etapas explorables en cualquier orden, cuatro semanas de
datos ficticios, decisiones/consecuencias, ejemplos y criterios de revisión.
Incluye handoff, plan de éxito, onboarding, adopción, riesgo, revisión de resultados,
renovación y voz del cliente. Un borrador opcional por etapa permanece solo en memoria,
limitado a 4,000 caracteres, sin envío, persistencia, puntos ni certificados.
Recargar o cambiar de posición elimina el borrador; usar solo datos inventados.

Validación de esta continuación: 79 pruebas locales y build/TypeScript aprobados;
Semgrep 89 archivos TS/TSX y detector de secretos sin hallazgos.
Revisión visual/editorial sigue pendiente. No convierte el laboratorio en ruta
comercial ni sustituye validación de entregas/progreso persistente.
Parche versión 2 sustituye versión 1; no aplicar ambos consecutivamente.

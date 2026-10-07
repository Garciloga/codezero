# Modelo modular v2 — primera implementación aislada

Isaac aprobó la oferta híbrida el 6 de octubre de 2026, 23:12 CDMX.
Planes simples; módulos mensuales agregados desde siguiente renovación;
Tutor 50→100 como promoción informada; pagos únicos conservados en Free.

## Entregado

- `lib/modular-offers.ts`: catálogo comercial v2, cálculo separado de mensualidad
  y pagos únicos, eliminación de duplicados, inclusiones Pro y bloqueo de módulos
  no operativos. No es un resolver de autorización ni procesa pagos.
- Vista `/modular-preview`: calculadora interactiva sin checkout, noindex y
  desactivada por defecto. Habilitar solo en entorno aislado con
  `CODEZERO_MODULAR_PREVIEW=1`; usa disponibilidad simulada explícita para explicar
  precios, nunca para conceder acceso.
- Menú móvil: cierre al navegar, Escape con retorno de foco y estilos de estado;
  movimiento reducido respetado.

## Validación

- 76 pruebas locales aprobadas, cinco nuevas de reglas comerciales.
- Build/TypeScript aprobado con URL y publishable key ficticias. La primera
  ejecución sin configuración local falló al prerenderizar reset-password;
  se resolvió configurando el fixture, sin modificar Auth.
- Semgrep: seis reglas, 86 archivos TS/TSX, cero hallazgos.
- Detector de secretos: cero hallazgos.
- HTTP/SSR: comprobar bandera desactivada=404 y activada=200, catálogo y
  calculadora presentes. No acredita interacción ni recorrido de pago real.
- Prueba interactiva pendiente: Playwright está instalado pero falta el binario
  Chromium. No declarar móvil/teclado visualmente validado por solo revisar código.

## Continuación y límites

### Catálogo de rutas futuras aprobado, 23:21 CDMX

Operaciones (RevOps/Sales Ops/CS Ops), QA y Datos/BI se agregan como
Próximamente. Producto y Management para etapa posterior; Solutions Engineer /
Integraciones y Capacitación/Enablement para considerar después; Growth queda
en exploración futura. UX/UI, RR. HH. y Finanzas quedan fuera del alcance.
No construir estos cursos con cero alumnos: priorizar interés real y único
de lista de espera. Operaciones es una hipótesis inicial, no fecha ni prioridad
de desarrollo comprometida. No alterar afinidad ni recomendar cursos inexistentes.
Estas ocho rutas están bloqueadas incluso con Pro y flags de lanzamiento activos.
Customer Success conserva el alcance de lanzamiento previamente aprobado.

No se modificaron checkout/webhooks activos, Supabase, Stripe Live, Auth, RLS,
cuotas ni configuración Vercel. Cero despliegues y cero cargos.

Antes de conectar ventas: sandbox Stripe y Supabase aislado, catálogo persistente,
waitlist, resolver por item/derecho, contratos con precio congelado, transición
50→100 preservando todos los items, idempotencia y política de impago conjunto.
La lista de espera todavía no guarda datos; no presenta un botón ficticio.
Customer Success y certificado requieren terminar contenido/progreso/verificación.
Producción, Live, Auth, RLS y cuotas requieren autorización específica.

El parche de esta entrega es incremental sobre `CodeZero_phase1_base.patch`
versión 2. Aplicar y revisar en rama aislada, nunca directamente en producción.
No equivale al cierre de las fases 1–6 del plan modular.

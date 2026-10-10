# Garciloga · lote de publicación · 11 octubre 2026

**ESTADO: BORRADOR. No autoriza desplegar, activar cobros ni modificar datos reales.**

## Estado comprobado
- Rama base `main`: `0f8b0172a4d0384909fcab0da3f8f4fb09c3d893`.
- Última producción `READY`: `024d204605b9e9676fe2d584db5cba43bfeaaa87`. Confirmar que Vercel publica el nuevo SHA antes de anunciar funciones.
- Vercel Hobby devolvió HTTP 402 `api-deployments-free-per-day` (más de 100 despliegues en ventana diaria). No reintentar mientras el límite esté vigente; no subir de plan.
- Las pruebas unitarias y compilación de `0f8b017` pasaron; seguridad pasó; los tres navegadores fallaron en la prueba sintética del portafolio al faltar `reviewed_by`. Esta rama **corrige el fixture y refuerza la regresión**, no reduce la política de privacidad.

## Alcance ya programado desde main
1. Proyecto final obligatorio por los nueve puestos, con rúbrica, evidencia y revisión humana. El examen final no se libera sin aprobación. Preservar claves históricas y progreso.
2. Español principal. EN/PT/FR beta en selector/programas, con reporte contextual de traducciones.
3. Portafolio personal opt-in con revisor humano distinto del alumno, calificación aprobatoria y cero errores críticos; información empresarial excluida.
4. Preparación de Stripe Test sin transacciones ni alteraciones a Stripe Live. Consultar `docs/stripe-test-checkout-validation.md`.

## Checklist de aceptación y publicación
- [ ] GitHub CI de la rama: build, tests y TypeScript en verde.
- [ ] Seguridad en verde y sin secretos.
- [ ] Chromium, Firefox y WebKit en verde, incluyendo publicación/revocación de portafolio y respuesta 403 de solicitudes no autorizadas.
- [ ] Límite de despliegue Vercel restablecido y confirmar disponibilidad antes de publicar.
- [ ] Rebase/revisión contra `main` si hubiera commits concurrentes; no sobrescribir a terceros.
- [ ] Un solo merge a `main` y **un solo deploy de producción**; comprobar `READY`, SHA y URL pública.
- [ ] Smoke: fichas por puesto; inscripción y permisos; rubrica/aprobación N15; portafolio; etiquetas beta y formulario traducciones; móviles, teclado, contraste, cuatro idiomas.
- [ ] Actualizar Notion según evidencia; retirar estados «Próximamente» solo a funciones totalmente operativas.

## Dependencias que NO se resuelven con este merge
- Checkout: conectar un entorno aislado de Stripe **Test** y ejecutar nueve escenarios E2E sin cobro real. No habilitar Live.
- Revisión humana de briefs y traducciones académicas. Beta continúa hasta revisión nativa.
- Respaldos: comprobar secretos, backup cifrado y restauración real.
- GitGuardian: verificar y cerrar avisos en origen, no solo scanner de CI.
- Career Guidance avanzado y liderazgo: decisiones/revisión y garantías de privacidad independientes.

## Reversión
Si fallan los recorridos de producción, volver a una versión Vercel previamente verificada sin activar Stripe Live ni tocar datos de usuarios. Documentar incidencia y SHA.

## Refuerzo de controles de borrador · 10 octubre 2026
- La comprobación de asignaciones reutiliza el bloqueo estricto de sandbox, incluido el identificador exacto de proyecto Supabase.
- Las fechas inexistentes del calendario se rechazan sin normalización silenciosa.
- CI ejecuta una migración de borrador en PostgreSQL descartable con verificaciones de permisos separados de visualización, RLS, revocación, perfiles suspendidos y aislamiento multiempresa.
- No se ha aplicado ninguna migración a Supabase producción: solo hay un proyecto conectado, de producción.
- Conservar el lote en Draft hasta CI del nuevo SHA, revisión humana y piloto con cuentas/sandbox aislados.

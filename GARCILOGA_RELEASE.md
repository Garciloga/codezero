# Garciloga · entrega del 8 de octubre de 2026

## Diferencia entre sandbox y producción

Antes de esta entrega, main y el deployment de producción apuntaban a `1ef9166f8c29d11afd4fa2549510c502f6021f01`. Las pantallas C · Vivo estaban sin commit en el entorno anterior, detenido por indisponibilidad del entorno. Se recuperaron en un checkout aislado y se consolidaron con la instrucción ampliada, sin reemplazar cambios anteriores de main. La diferencia de `lib/supabase-server.ts` es únicamente BOM y salto final; el archivo remoto se conserva.

La migración de organizaciones ya está aplicada en ambos proyectos (véase `VIVO_ENTERPRISE_VALIDATION.md`). Producción tiene cero organizaciones y cero membresías: un plan Enterprise por sí solo no constituye una jerarquía. Un operador global autorizado puede crear la primera organización desde Administración. No se insertaron personas ficticias en producción.

## Producto

- Nombre visible: Garciloga, incluyendo pantallas, metadatos, certificados y traducciones. Se conservan identificadores técnicos históricos para evitar romper URLs, cookies, datos, Stripe y contratos existentes.
- C · Vivo compartido, fuentes, tokens, sidebar y pantallas de equipo con alcance por jerarquía y comprobación en el servidor. Ver documentación detallada de permisos y estados vacíos.
- Orientación ampliada: programación, cursos, decisiones, procesos y desarrollo profesional desde primeros puestos hasta supervisión, gerencia y dirección. Cuatro prácticas introductorias originales de decisiones por puesto; no se anuncian como un curso completo, certificación o evaluación oficial.
- Mentoría de puestos, procesos y decisiones: referencia **$699 MXN por 45 minutos**, en la plataforma y Notion. Sigue en Próximamente: no se vende un servicio todavía no disponible.
- Equipos: referencia **$249 MXN por asiento/mes, mínimo 5**, en la plataforma y Notion. No se modifica el checkout, catálogo Stripe, precio contractual o cuota de un plan base. La cotización empresarial se solicita por contacto.
- Roadmap público con todos los módulos futuros del catálogo, orientación profesional, comunidad, ejecución aislada de código, opciones anuales y Comunicador Enterprise para mensajes, emojis, información y actualizaciones de líderes. Son funciones planificadas, sin fecha ni checkout inventados. Los pendientes operativos (sesiones reales, restauración, revisión legal/fiscal, dominio/correo y pruebas de cobro) permanecen en Notion; no son funciones disponibles ni promesas de lanzamiento. SSO no se anuncia.
- Privacidad: trabajo de adopción de ISO/IEC 27001:2022, 27002:2022, 27701:2025 y GDPR cuando corresponda; no se afirma una certificación o auditoría de cumplimiento inexistente. Se explica visibilidad organizacional y contacto de derechos.
- Robustez: formulario administrativo con límite de bytes, validación de puesto, ausencia de métricas ficticias, fallos de lectura visibles, RPC restringidas y permisos transaccionales.

## Investigación

Fuentes primarias revisadas para el alcance de seguridad, privacidad y prácticas de decisión:

- [ISO/IEC 27001](https://www.iso.org/standard/27001): sistema de gestión de seguridad de la información.
- [ISO/IEC 27002:2022](https://www.iso.org/standard/75652.html): controles de seguridad.
- [ISO/IEC 27701:2025](https://www.iso.org/standard/27701): gestión de información de privacidad.
- [GDPR — Reglamento 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng).
- [O*NET — General and Operations Managers](https://www.onetonline.org/link/summary/11-1021.00): tareas de planificación, supervisión y decisiones. Las prácticas son redacción original y orientación introductoria, no acreditación profesional.

Para poder afirmar cumplimiento completo hacen falta inventario de datos, análisis de riesgos, responsables, acuerdos con proveedores, gestión de incidentes, evidencias y revisión especializada. Para robustez operativa también queda pendiente el simulacro cloud completo ya descrito en `DISASTER_RECOVERY.md`.

## Validación de esta entrega

| Control | Resultado antes de publicar |
|---|---|
| Pruebas unitarias | 171 aprobadas |
| Build Next.js / TypeScript | Aprobado |
| Traducciones | 3,086 ocurrencias, cero faltantes |
| PostgreSQL local de equipos | 26 comprobaciones aprobadas |
| RLS en sandbox cloud | Ocho usuarios sintéticos; Dueño 8, Admin 8, Gerentes 4 y 2, Supervisor 2, Colaboradores 1; transacción revertida |
| Soporte / Customer Success / registro | 9 / 9 / 6 comprobaciones aprobadas |
| Handlers y PostgreSQL de aprendizaje | 9 y 10 comprobaciones aprobadas |
| Auditoría npm de producción | Cero vulnerabilidades |
| Recuperación local | Simulacro sintético aprobado; no equivale a restauración cloud |
| Navegadores / axe / móvil 390 px | Suite de tres motores preparada en CI; descarga local de motores falló |
| Sesiones reales de alumno y operador | Pendientes: no se dispone de cuentas autorizadas de prueba |
| NVDA / JAWS / VoiceOver físicos | Pendientes: no hay estación física disponible |
| Restauración cloud completa | Pendiente: requiere respaldo externo, conexión protegida y destino aislado |

Los resultados de CI, el commit y el deployment final se registran en Operación y control de Notion después de publicar. Ningún fixture de navegador o RLS se presenta como una sesión Auth real de producción. La primera ejecución remota detectó un paréntesis faltante en la prueba de navegador añadida; se corrigió, se verificó la sintaxis y se consolidó en el mismo commit final. Se pausaron builds automáticos durante la validación para limitar despliegues.

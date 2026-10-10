# Garciloga · Próximamente: borradores académicos (no liberados)

## Nuevos módulos que aparecieron después de la primera consulta de Notion
Al repetir la auditoría del roadmap aparecieron **siete entradas adicionales**. La primera estructura académica y funcional está en [seven-adjacent-modules.json](./seven-adjacent-modules.json):
- Onboarding 30-60-90 por empresa (workflow con aprobación, acceso por organización y evidencias).
- IA aplicada a los puestos (curso sin Tutor IA, datos sintéticos y revisión de respuestas).
- Idioma profesional EN/PT por puesto (curso beta sujeto a docentes nativos).
- Evaluación de candidatos (workflow de piloto, consentimiento, equidad, accesibilidad, **sin contratación o rechazo automáticos**).
- Laboratorio de métricas (curso con GRR, NRR, CSAT y forecast, operaciones verificables y cohortes).
- Empleabilidad, CV y entrevistas (curso/workflow opt-in sin inventar experiencia).
- Kit del manager y refuerzos (workflow sobre evidencia y matriz autorizada, sin decisiones laborales automáticas).

**Borrador estructural adicional:** siete módulos × cinco etapas = **35 etapas**, 105 unidades didácticas o de diseño de procesos, 70 decisiones y 280 retos de razonamiento, con siete capstones. No confundir con software funcional ni con una implementación de IA, motor de contratación o carga de playbooks. Antes de publicar se requiere diseño de datos, permisos, validación editorial, investigación de marcos laborales, protección de datos, traducciones y QA. El inspector académico actual solo muestra cinco cursos; ampliar su ámbito después de revisar cómo presentar correctamente los tres workflows empresariales.


Se crearon **cinco rutas originales en español**, que no se agregaron a rutas públicas, datos de alumnos ni cobros. La vista futura de revisión exclusiva de propietario está en `/admin/curriculum/drafts`. El código vive solamente en la rama candidata de la PR #42, pendiente de merge.

| Ruta | Niveles | Unidades | Decisiones ramificadas | Retos escritos de nivel | Proyectos |
|---|---:|---:|---:|---:|---:|
| GRC avanzado | 15 | 45 | 30 | 120 | 2 |
| Detector de red flags (curso) | 8 | 24 | 16 | 64 | 2 |
| Cross-sell | 8 | 24 | 16 | 64 | 2 |
| Upsell | 8 | 24 | 16 | 64 | 2 |
| Retención | 8 | 24 | 16 | 64 | 2 |
| **Total** | **47** | **141** | **94** | **376** | **10** |

## Nivel académico y revisión
- No basta enviar una palabra ni marcar «terminado». Cada unidad exige hipótesis, evidencias, alternativas, riesgos, dueños, criterios de aceptación y revisión.
- Las evaluaciones por nivel tienen ocho entregables de razonamiento y **rúbrica de 100 puntos**, mínimo 80; evaluación humana independiente en la futura implementación. Cualquier nota generada automáticamente solo puede ser orientativa, no aprobar.
- Casos sintéticos de SaaS, procesos empresariales y GRC. Las decisiones conservan consecuencias y el nivel siguiente hereda supuestos; la interfaz definitiva deberá persistir estas consecuencias en servidor y aplicar controles transaccionales antes de abrir a alumnos.
- GRC integra fuentes públicas: ISO/IEC 27001:2022, ISO/IEC 27002:2022, ISO 31000:2018 (no certificable), ISO 37301:2021, ISO 22301:2019 + enmienda 2024, ISO/IEC 27701:2025, ISO/IEC 42001:2023, ISO 19011:2026 (la edición 2018 fue retirada), ISO 37001:2025 y NIST CSF 2.0.
- Las fuentes ISO son propiedad de sus respectivos editores; este contenido es redacción formativa original basada en resúmenes públicos. No se reproduce la norma completa ni se ofrece certificación de tercera parte.
- **Idiomas:** ES escrito; EN, PT, FR beta pendiente de traducción real (no se inventan traducciones).
- No cambia `lib/grc-content.ts`, su catalogación de 4 etapas, el currículo de nueve puestos, claves de avance, precios ni Stripe.
- Las secciones escritas actualmente son una **primera autoría editorial sometida a revisión**; hay 47 módulos y 141 unidades pero todavía faltan enseñanza técnica independiente por unidad, pruebas de preguntas por alumnos, validación académica nativa, examen con claves secretas del lado servidor, seguimiento persistente de consecuencias y pruebas en navegador. **No llamar completo ni eliminar «Coming soon» hasta que pasen estos requisitos.**

## Fuentes verificadas octubre 2026
- [ISO/IEC 27001:2022](https://www.iso.org/es/norma/27001)
- [ISO/IEC 27002:2022](https://www.iso.org/standard/75652.html)
- [ISO 31000:2018](https://www.iso.org/standard/31000)
- [ISO 37301:2021](https://www.iso.org/es/contents/data/standard/07/50/75080.html)
- [ISO 22301:2019](https://www.iso.org/standard/75106.html)
- [ISO/IEC 27701:2025](https://www.iso.org/standard/27701)
- [ISO/IEC 42001:2023](https://www.iso.org/standard/42001)
- [ISO 19011:2026](https://www.iso.org/standard/19011)
- [ISO 37001:2025](https://www.iso.org/es/norma/37001)
- [NIST CSF 2.0](https://www.nist.gov/cyberframework)
- [Retención y cohortes SaaS](https://stripe.com/es/resources/more/net-revenue-retention)

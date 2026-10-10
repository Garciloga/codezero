# Garciloga · 12 paquetes de prácticas didácticas — borrador académico
**Estado: BORRADOR**, rama `release/garciloga-lote-20261011`, PR #42. **No es contenido publicado ni integrado al motor de calificaciones.**

## Material construido
| Programa | Niveles/etapas | Unidades | Prácticas nuevas |
|---|---:|---:|---:|
| GRC avanzado | 15 | 45 | 225 |
| Detector de red flags | 8 | 24 | 120 |
| Cross-sell | 8 | 24 | 120 |
| Upsell | 8 | 24 | 120 |
| Retención | 8 | 24 | 120 |
| Onboarding corporativo 30-60-90 | 5 | 15 | 75 |
| IA aplicada al puesto | 5 | 15 | 75 |
| Idioma profesional | 5 | 15 | 75 |
| Evaluación de candidatos | 5 | 15 | 75 |
| Laboratorio de métricas | 5 | 15 | 75 |
| Empleabilidad | 5 | 15 | 75 |
| Kit del manager | 5 | 15 | 75 |
| **Total** | **82** | **246** | **1.230** |

Cada unidad recibe teoría aplicada, caso contextualizado, cálculo explicado sobre **datos ficticios independientes**, procedimiento profesional de siete pasos, fallos típicos, cinco prácticas de naturaleza diferente (auditoría de evidencias, cálculo, decisiones encadenadas, elaboración de entregable y defensa adversarial) y criterios privados de revisión. Su formato parte de los borradores de cada tema en este directorio; no reemplaza el temario de puestos ni sus niveles publicados.

## Control de calidad y límites
- Pruebas de autoría: doce cursos; 246 claves únicas; 1.230 actividades; cinco modalidades; evaluación de 100 puntos; cifras de referencia recalculadas; cadenas de evidencia y revisión humana.
- **Subir de nivel:** diseño de un motor de revisión progresiva **todavía no conectado a producción**. Política prototipo `lib/draft-review-policy.ts` exige cinco prácticas diferentes, cinco evidencias únicas, un revisor humano distinto del alumno, puntuaciones 0–4 con mínimo 3 por competencia, ausencia de errores críticos y umbral gradual de 80 a 90 puntos según nivel.
- El inspector `/admin/curriculum/drafts/practices` será solo de propietario (guard `requireOwner` en servidor). Las respuestas y rúbricas privadas no deben viajar al navegador de alumnos ni ser importadas por componentes públicos.
- **Calidad pedagógica:** esta es una ampliación programática de contenido basada en casos originales de borrador; la repetición de métodos transversales aún exige revisión y diversificación editorial para alcanzar el estándar de 92 lecciones por puesto de los cursos publicados. No afirmar que 246 unidades equivalen a 246 lecciones ya verificadas, ni que existe un certificado oficial.
- **Idiomas:** español original; inglés, portugués y francés siguen beta pendientes de redacción nativa.
- **Confidencialidad:** los cursos para managers y reclutadores nunca autorizan clasificación laboral o contratación automáticas. Los datos y exámenes deberán tener RLS multiempresa, consentimiento cuando aplique y revisión de equidad.
- **Publicación pendiente:** extender cada programa según nivel/rol y necesidades académicas, conectar RPC de entrega/revisión y bloqueo de nivel, versionado de decisiones persistentes, calibración con estudiantes, QA accesibilidad y navegadores, aprobación académica nativa y despliegue único cuando sea posible. No habilitar pagos para este material.

El objetivo es entregar material editable y verificable, no simular que las 12 rutas están listas para comercializarse.

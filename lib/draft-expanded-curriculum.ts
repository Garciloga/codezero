import "server-only";
import {DRAFT_PRACTICE_NAMES,ownerDraftPractice} from "./draft-practice-packs";
/** Curriculum expansion remains an editable owner-only editorial map, not released learner content.
 * Each level depends on the preceding case and requires a fresh decision under uncertainty.
 */
export const FIFTEEN_LEVEL_TOPICS={
  "grc-advanced": "Mandato e independencia;Contexto y materialidad;Riesgos y oportunidades;Activos y flujos;Controles y SoA;Cumplimiento y contratos;Privacidad y consentimiento;Terceros y cadena de suministro;Programa de auditoría;Respuesta a incidentes;Continuidad RTO RPO;Gobierno y sesgos de IA;Antisoborno e investigación;Comité y presupuesto de riesgos;Defensa GRC integral",
  "red-flags": "Definir señales;Calidad y periodos;Pérdida de sponsor;Contratos y compromisos;Incidentes críticos;Estacionalidad y cohortes;Precisión y falsas alertas;Priorizar cartera;Modelos explicables;Revisión humana;Rescate y seguimiento;Investigación causal;Calibración y drift;Diseño del detector;Comité de riesgo de cuentas",
  "cross-sell": "Valor adyacente;Descubrimiento de necesidad;Mapa de stakeholders;Fit de producto;Factibilidad técnica;Prioridad y capacidad;Piloto con criterios;Protección de datos;Economía de entrega;ROI por escenarios;Negociación y concesiones;Objeciones y trato justo;Handoff y adopción;Forecast veraz;Defensa de expansión",
  "upsell": "Necesidad y valor premium;Licencias y uso;Funciones premium;Precio y consumo;Derechos y contratos;Permisos y migración;Prueba de valor;Fallas operativas;ROI y sensibilidad;Concesiones y margen;Renovación y reversión;Activación posventa;Riesgo de downgrade;Plan de expansión;Defensa de upgrade",
  "retention": "GRR y NRR;Cohortes;Adopción;Incidentes que afectan valor;Champion y sponsor;Entrevista de diagnóstico;Segmentación por riesgo;Playbooks de prevención;Reparación de confianza;Pronóstico con incertidumbre;Objeciones y contrato;Renovación voluntaria;Contracción y expansión;Capacidad del equipo;Comité de retención",
  "onboarding-30-60-90": "Contenido de empresa;Permisos y control;Hitos primeros 30 días;Práctica guiada;Feedback y mentoría;Hitos primeros 60 días;Handoff y colaboración;Calidad y errores críticos;Brechas y refuerzos;Autonomía a 90 días;Incidentes y escalamiento;Productividad y retrabajo;Cohortes y equidad;Calibración del manager;Defensa 30-60-90",
  "ai-at-work": "Límites de IA;Minimización de datos;Prompts verificables;Alucinaciones;Fuentes autorizadas;QBR con IA;Soporte asistido;Ofertas sin ficción;Inyección y seguridad;Calidad por segmento;Automatización responsable;Supervisión humana;Cambios de modelo;Ataques y errores;Flujo IA gobernado",
  "professional-languages": "Correo profesional;Léxico por puesto;Promesas y compromisos;Escucha y aclaración;Llamadas difíciles;Incidentes EN/PT;QBR con cifras;Objeciones de compras;Registro y regionalismos;Presentación al sponsor;Contratos y revisión legal;Handoff internacional;Crisis multicanal;Evaluación no discriminatoria;Defensa bilingüe",
  "candidate-assessment": "Finalidad y aviso;Tareas relacionadas con puesto;Rúbricas y criterios;Casos equivalentes;Minimización de identidad;Accesibilidad;Caso de soporte;Caso comercial;Evidencia versus fluidez;Revisores independientes;Consistencia de puntajes;Impugnación;Conservación y borrado;Piloto sin decisión automática;Evaluación justa",
  "metrics-lab": "Diccionario de datos;Periodos y cohortes;GRR y NRR;CSAT;Salud de cuenta;Forecast;Medianas y outliers;Precisión y recall;Sensibilidad económica;Calidad de fuentes;Causalidad y correlación;Visualización accesible;Comunicación ejecutiva;Decisión incompleta;Defensa cuantitativa",
  "employability": "Evidencia personal;Permisos de portafolio;Competencias revisadas;CV sin inventar;Logros simulados;ATS y keywords;Plan de competencias;Carta de presentación;Entrevista STAR;Caso técnico;Objeciones del reclutador;Seguimiento y feedback;Portafolio accesible;Candidatura coherente;Defensa profesional",
  "manager-toolkit": "Permisos de equipo;Competencias 0–4;Ausencia de evidencia;1:1 basado en hechos;Planes de refuerzo;Capacidad y carga;Calibración;Apoyos accesibles;Errores críticos;Seguimiento sin vigilancia;Mapas de capacidades;Conversación difícil;Planes 30-60-90;Métricas de mejora;Plan de talento justo"
} as const;
export type DraftSkillDimension="diagnosis"|"data"|"planning"|"documentation"|"communication"|"collaboration"|"prioritization"|"negotiation"|"technical"|"deescalation";
const focus:ReadonlyArray<{name:string;competencies:readonly DraftSkillDimension[];kind:string;objective:string}>= [
 {name:"Análisis de hechos y causas",competencies:["diagnosis","documentation"],kind:"evidence",objective:"Distinguir hechos, incertidumbre y hipótesis alternativas con fuentes verificables"},
 {name:"Métricas, unidades y límites",competencies:["data","technical"],kind:"calculation",objective:"Reproducir cálculo, denominador, supuestos y sensibilidad antes de concluir"},
 {name:"Decisión y consecuencias acumuladas",competencies:["planning","prioritization"],kind:"decision",objective:"Elegir entre tres alternativas, conservar efectos y actualizar el plan con la nueva restricción"},
 {name:"Entregable y control negativo",competencies:["documentation","technical"],kind:"deliverable",objective:"Diseñar evidencia, responsable, fecha y prueba de falla que permita validar un control"},
 {name:"Escucha y comunicación ética",competencies:["communication","collaboration"],kind:"conversation",objective:"Parafrasear, preguntar, reconocer objeciones y comunicar límites sin inventar compromisos"},
 {name:"Defensa y transferencia al siguiente nivel",competencies:["negotiation","deescalation"],kind:"defense",objective:"Sostener una decisión frente a auditor/cliente/manager y rectificar al aparecer nueva evidencia"}
] as const;
const twists=[
 "La fuente inicial contiene datos contradictorios. Identifica la prueba independiente que necesitas antes de afirmar éxito.",
 "El presupuesto o capacidad desciende un 30%; protege primero obligaciones y controles críticos.",
 "El responsable del proceso rechaza el resultado y exige una alternativa más barata y reversible.",
 "Auditoría encuentra que el aprobador también ejecutó la actividad: revisa segregación y evidencia.",
 "Una persona afectada plantea una barrera de accesibilidad: modifica el plan y justifica la adaptación.",
 "La segunda medición contradice la inicial: declara el cambio de hipótesis sin borrar versiones anteriores."
];
export function draftExpandedCurriculum(courseId:string){
 const topics=FIFTEEN_LEVEL_TOPICS[courseId as keyof typeof FIFTEEN_LEVEL_TOPICS]?.split(";");
 const original=ownerDraftPractice(courseId.replaceAll("-","_"));
 if(!topics||!original)return null;
 return {key:courseId,title:original.title,status:"draft" as const,levels:topics.map((topic,i)=>{
  const seed=original.levels[Math.floor(i*original.levels.length/topics.length)];
  const twist=twists[i%twists.length];
  return {number:i+1,title:topic,difficulty:i<3?"fundamentos aplicados":i<7?"operación":i<11?"análisis especializado":i<14?"liderazgo":"defensa directiva",
    priorEvidenceRequired:i>0,sourceCase:seed.caseFacts,baseConflict:seed.caseConflict,newConstraint:twist,
    lessons:focus.map((f,j)=>({key:courseId+"-expanded-"+(i+1)+"-"+(j+1),title:topic+" · "+f.name,
     objective:f.objective,competencies:f.competencies,type:f.kind,
     teaching:"En "+topic.toLowerCase()+", "+f.objective.toLowerCase()+". Caso: "+seed.caseFacts+" Conflicto: "+seed.caseConflict+" El nuevo requisito es: "+twist+" El alumno debe discriminar fuentes, proponer soluciones con restricciones y explicar cómo su decisión afecta al siguiente nivel. Se revisa evidencia observable, no una personalidad inferida.",
     task:"Analiza «"+topic+"». "+seed.caseFacts+" "+twist+" Redacta tres opciones, costo y consecuencias de cada una, un dato que invalida la hipótesis, una prueba positiva y otra negativa y el nombre funcional del responsable. Entrega evidencia reproducible y explica qué corregirías al recibir nueva información.",
     decision:{context:"Aparece nueva evidencia que cuestiona el plan previo de «"+topic+"».",
     grading:"human-rubric-no-single-correct-option" as const,
     phases:[
      {phase:"diagnóstico",pressure:seed.caseConflict,alternatives:[
       {id:"a",action:"Solicitar una comprobación independiente de las fuentes críticas antes de renovar el compromiso",benefit:"Mayor certeza y menor exposición a una afirmación falsa",cost:"Retrasa la entrega y consume capacidad técnica",risk:"El cliente podría perder confianza si no recibe actualizaciones",authorization:"validación de responsable de proceso y fuente"},
       {id:"b",action:"Continuar con un piloto de alcance limitado, dejando incertidumbre y condiciones de interrupción por escrito",benefit:"Obtiene evidencia operativa en el plazo previsto",cost:"Requiere seguimiento cercano y controles compensatorios",risk:"Puede exponer un subconjunto de usuarios si se definió mal el alcance",authorization:"aprobación de líder y de seguridad para el alcance del piloto"},
       {id:"c",action:"Escalar al comité para renegociar fechas y obligaciones con el cliente antes de ejecutar el cambio",benefit:"Alinea las obligaciones comerciales, legales y técnicas",cost:"Mayor coordinación y riesgo de dilación",risk:"Puede congelar trabajo útil si la escalación no tiene plazo",authorization:"decisor contractual y dueño del riesgo"}
      ]},
      {phase:"ejecución",pressure:twist,alternatives:[
       {id:"a",action:"Reasignar horas al control con mayor impacto y diferir tareas de menor criticidad",benefit:"Protege riesgos materiales y capacidad limitada",cost:"Se retrasa una entrega secundaria",risk:"La priorización puede ignorar dependencia de otro equipo",authorization:"responsable operativo y afectado"},
       {id:"b",action:"Mantener hitos mediante una prueba paralela de alcance reducido",benefit:"Produce evidencia de uso sin perder totalmente el calendario",cost:"Duplica temporalmente control y validación",risk:"Puede crear dos versiones de la misma fuente",authorization:"responsable de calidad y de acceso a datos"},
       {id:"c",action:"Renegociar el hito externo y reservar la capacidad para remediar la causa raíz",benefit:"Reduce el riesgo de reincidencia",cost:"Afecta expectativas comerciales",risk:"La nueva fecha puede ser impracticable si no hay recursos",authorization:"titular del compromiso y sponsor"}
      ]},
      {phase:"revisión",pressure:"La nueva medición difiere de tu escenario inicial y requiere explicar la variación sin ocultar decisiones previas.",alternatives:[
       {id:"a",action:"Mantener la decisión solo si una muestra independiente confirma su efecto, con fecha de reevaluación",benefit:"Continuidad si los datos son sólidos",cost:"Nueva verificación y demora para cerrar",risk:"Muestras pequeñas pueden ocultar fallos",authorization:"revisor independiente"},
       {id:"b",action:"Volver a la alternativa reversible y ensayar otra hipótesis con registro de versiones",benefit:"Limita consecuencias negativas tempranas",cost:"Retrabajo y menor avance aparente",risk:"La reversión puede afectar dependencias",authorization:"dueño del proceso y del impacto"},
       {id:"c",action:"Escalar una excepción temporal con condición de expiración y análisis de residual",benefit:"Permite continuidad controlada bajo circunstancias excepcionales",cost:"Aumenta las tareas de monitoreo",risk:"Normalizar excepciones sin cierre",authorization:"autoridad formal de aceptación del riesgo"}
      ]}
     ],
     writtenJustificationRequired:["evidencia y fuente por fase","comparación de tres alternativas con costo y riesgo","criterio que cambiaría la opción elegida","responsables y límites de autoridad","razones de la rectificación","seguimiento verificable"],
     transferToNextLevel:["hipótesis nueva o rechazada","historial de las tres decisiones","costo y riesgo residual","responsable y plazo","evidencia de resultados"],
     neverInferTraits:true,requiresIndependentHumanReview:true},
     observableIndicators:["verifica fuentes antes de concluir","documenta corrección sin borrar histórico","escucha objeciones y responde con evidencias","separa decisión autorizada de recomendación","colabora con límites de datos y permisos"],
     assessor:{minScore:i>=11?90:i>=7?88:i>=3?84:80,rubric:[20,20,20,20,20],independentHumanReviewer:true,criticalErrorsAllowed:0,personalityInferenceForbidden:true}
    })),
    project:i===7||i===14?{mandatory:true,review:"human",artifact:"Expediente integrador de "+topic+" con simulaciones encadenadas, evaluación de riesgos, rúbrica y defensa del historial"}:null
   };})};
}
export const DRAFT_EXPANSION_COUNTS={courses:DRAFT_PRACTICE_NAMES.length,levels:DRAFT_PRACTICE_NAMES.length*15,lessons:DRAFT_PRACTICE_NAMES.length*15*focus.length} as const;

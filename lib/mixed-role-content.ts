import type {CompetencyKey} from './competency-matrix.ts';
import {COMPETENCY_WORK_TYPE,type WorkType} from './mixed-role-model.ts';
import {findTrainingActivity} from './role-training-content.ts';
export type MixedFormat='decision'|'deliverable'|'python'|'sql'|'simulation';
export type MixedStep={key:string;type:WorkType;title:string;format:MixedFormat;sourceKey:string;primary:CompetencyKey;category?:string;task:string};
export type MixedUnit={key:string;positions:string[];title:string;caseTitle:string;company:'Faro';route:string;steps:MixedStep[]};
const step=(type:WorkType,title:string,format:MixedFormat,sourceKey:string,primary:CompetencyKey,task:string,category?:string):MixedStep=>({key:'',type,title,format,sourceKey,primary,task,category});
export const MIXED_UNITS:MixedUnit[]=[
 {key:'account-manager-renewal',positions:['account_manager'],title:'Account Manager',caseTitle:'Renovación con expansión',company:'Faro',route:'customer_success',steps:[
 step('comercial','Preparar la revisión de negocio (QBR) de renovación','decision','cs-qbr','communication','Decide qué resultados, brechas y personas deben estar en la QBR. Conserva periodo, módulos y siguiente decisión.'),
 step('tecnica','Consultar el uso por módulo antes de la QBR','sql','data_bi-unit-1-3','technical','Consulta los módulos y el periodo definidos en la QBR. Diferencia usuarios activos de eventos y declara faltantes.'),
 step('herramientas','Actualizar la oportunidad de renovación','simulation','common-documentation','documentation','Completa etapa, valor, fecha prevista, evidencia y siguiente paso. No marques ganada una oportunidad sin firma.','CRM'),
 step('procesos','Registrar la interacción y el siguiente paso del pipeline','decision','cs-renewal','planning','Elige responsable y fecha según la oportunidad anterior. Distingue un compromiso confirmado de una hipótesis.'),
 step('tecnica','Calcular el forecast de renovación de la cartera','python','cs-forecast','data','Calcula forecast ponderado con importes y probabilidades ficticios del pipeline. Explica que no equivale a ingresos asegurados.'),
 step('comercial','Proponer el upsell de un módulo adicional','decision','cs-expansion','negotiation','Usa el forecast y la necesidad confirmada para decidir si procede expansión. No vendas antes de resolver el valor actual.'),
 step('procesos','Emitir el contrato y dar seguimiento a la firma','deliverable','cs-renewal','planning','Redacta el contrato simulado, condiciones pendientes, responsables y seguimiento, respetando la propuesta anterior.'),
 step('herramientas','Enviar la renovación a firma','simulation','common-documentation','documentation','Comprueba versión, firmantes, autoridad y orden de firma. Registra envío y pendientes sin afirmar firma real.','Firma digital'),
 ]},
 {key:'onboarding-implementation',positions:['onboarding'],title:'Onboarding Specialist',caseTitle:'Implementación de un cliente nuevo',company:'Faro',route:'customer_success',steps:[
 step('comercial','Alinear expectativas en la llamada de arranque','decision','cs-kickoff','communication','Confirma objetivo, alcance, responsable y criterio de primer valor con el cliente.'),
 step('procesos','Armar el plan de implementación con milestones','deliverable','cs-success-plan','planning','Convierte los acuerdos del kickoff en hitos, fechas, dependencias y criterios de aceptación.'),
 step('tecnica','Limpiar y validar el CSV de usuarios del cliente','python','data_bi-unit-1-2','data','Limpia el CSV ficticio del hito anterior. Identifica duplicados, correos inválidos y campos vacíos; no conviertas faltantes en cero.'),
 step('herramientas','Mapear columnas en la plantilla de migración','simulation','common-documentation','documentation','Mapea columnas de la salida limpia y registra reglas de transformación y validación.','Hoja de cálculo'),
 step('tecnica','Importar los datos en lote y revisar errores','python','cs-integration','technical','Simula una importación local del mapeo anterior. Separa registros aceptados y rechazados; conserva errores sin red ni datos reales.'),
 step('procesos','Medir el tiempo al primer valor (Time-to-Value)','decision','cs-success-plan','planning','Decide si se alcanzó el primer valor usando importación, fechas y criterio del kickoff; una importación correcta no basta.'),
 step('herramientas','Grabar un tutorial de configuración','simulation','common-documentation','documentation','Completa guion, pasos, advertencias y comprobación final de un tutorial simulado; no se graba ni sube video real.','Video asíncrono'),
 step('comercial','Cerrar el onboarding y entregar la cuenta a Customer Success','decision','cs-kickoff','communication','Decide qué está aceptado y qué queda abierto. Entrega a CS el tutorial, responsables y pendientes sin inventar conformidad.'),
 ]},
 {key:'support-sync-incident',positions:['tech_support_l2','tech_support_l3'],title:'Tech Support T2/T3',caseTitle:'Integración que dejó de sincronizar',company:'Faro',route:'solutions',steps:[
 step('procesos','Categorizar el ticket y fijar el SLA','decision','common-priority','prioritization','Clasifica por impacto, urgencia y alternativa. Registra alcance y hora ficticios antes de fijar el SLA.'),
 step('tecnica','Reproducir el error llamando a la API','python','solutions-unit-1-2','technical','Analiza respuestas HTTP ficticias precargadas del ticket; compara códigos y permisos. No hagas llamadas de red.'),
 step('herramientas','Leer los logs del incidente','simulation','common-documentation','documentation','Selecciona registros ficticios por correlación y hora del fallo. Redacta secretos y separa hechos de hipótesis.','Observabilidad'),
 step('comercial','Comunicar el estado al cliente bajo presión','decision','common-deescalation','deescalation','Comunica impacto, diagnóstico pendiente y próxima actualización usando los logs, sin prometer resolución no verificada.'),
 step('tecnica','Depurar el webhook que falla y leer el JSON','python','solutions-unit-1-3','technical','Analiza JSON local asociado al incidente comunicado. Comprueba campos, tipos, duplicados y errores de contrato.'),
 step('procesos','Escalar el bug confirmado a Ingeniería','deliverable','solutions-unit-1-5','collaboration','Entrega reproducción, esperado/observado, evidencia del JSON, impacto y mitigación con responsable.'),
 step('herramientas','Documentar la incidencia','simulation','common-documentation','documentation','Completa incidencia enlazada a la escalación: cronología, pruebas, responsable y estado confirmado.','Gestión de incidencias'),
 step('comercial','Cerrar el caso y confirmar la solución con el cliente','decision','common-deescalation','communication','Decide cierre o seguimiento a partir de la incidencia y la verificación del flujo del cliente. Mitigación no significa solución.'),
 ]},
 {key:'product-low-adoption',positions:['product_specialist'],title:'Product Specialist',caseTitle:'Función nueva con baja adopción',company:'Faro',route:'product',steps:[
 step('comercial','Traducir la necesidad del cliente en caso de negocio','decision','product-unit-1-1','communication','Explica tarea, impacto y población; diferencia necesidad de la solución solicitada.'),
 step('tecnica','Medir la adopción de la función con eventos','sql','data_bi-unit-1-3','technical','Consulta eventos ficticios de la población definida; deduplica usuarios y conserva denominador y periodo.'),
 step('procesos','Priorizar el feedback recibido','decision','product-unit-1-2','prioritization','Prioriza feedback con señales de adopción, esfuerzo, riesgo y supuestos explícitos.'),
 step('herramientas','Registrar las solicitudes','simulation','common-documentation','documentation','Registra solicitud, problema, evidencia, prioridad y estado sin prometer fechas.','Gestión de feedback'),
 step('tecnica','Comparar el comportamiento esperado contra el real','sql','product-unit-1-3','data','Contrasta eventos del flujo solicitado con criterios esperados. Declara muestra y límites sin atribuir causalidad.'),
 step('herramientas','Revisar el prototipo del flujo','simulation','common-documentation','documentation','Selecciona el flujo simulado que atiende la brecha medida y registra criterios de aceptación.','Prototipos'),
 step('procesos','Redactar las release notes y la guía interna','deliverable','product-unit-1-4','collaboration','Redacta cambio propuesto, límites, guía y handoff a partir del prototipo; no lo presentes como lanzamiento real.'),
 step('comercial','Presentar la recomendación a Producto','decision','product-unit-1-5','communication','Defiende recomendación, incertidumbre y siguiente validación con la guía anterior.'),
 ]},
 {key:'customer-success-risk',positions:['customer_success'],title:'Customer Success Manager',caseTitle:'Cuenta en riesgo de baja',company:'Faro',route:'customer_success',steps:[
 step('comercial','Leer la señal: el cliente dejó de usar dos módulos','decision','cs-roleplay-1','communication','Distingue señal de causa; elige una conversación para confirmar objetivos y uso.'),
 step('tecnica','Consultar el uso por módulo de los últimos 90 días','sql','data_bi-unit-1-3','technical','Consulta 90 días de datos ficticios de los módulos de la señal anterior; conserva ventana y usuarios únicos.'),
 step('procesos','Abrir la alerta de riesgo de baja y asignar responsable','decision','cs-churn','planning','Define severidad, responsable y siguiente revisión con la caída de uso comprobada.'),
 step('herramientas','Registrar la cuenta y su plan de éxito','simulation','common-documentation','documentation','Registra alerta, objetivo, responsables, módulos y plan en una pantalla simulada.','Plataforma de Customer Success'),
 step('tecnica','Calcular el health score de la cuenta','python','cs-health','data','Calcula un score hipotético 0–100 usando uso y encuesta de la cuenta registrada. Explica pesos y faltantes; no cambia la matriz 0–4.'),
 step('comercial','Preparar la llamada de recuperación de valor','decision','cs-roleplay-3','communication','Elige preguntas y opciones de recuperación a partir del score, sin confundirlo con diagnóstico causal.'),
 step('procesos','Redactar el plan de éxito a 60 días','deliverable','cs-success-plan','planning','Redacta hitos, responsables, medidas y fechas del acuerdo de recuperación; distingue objetivos de resultados.'),
 step('herramientas','Diseñar la encuesta NPS de seguimiento','simulation','common-documentation','documentation','Define pregunta, población, momento, consentimiento y cierre del feedback en relación con el plan.','Encuestas'),
 ]},
 {key:'manager-rising-churn',positions:['manager_team_lead'],title:'Manager / Team Lead',caseTitle:'Trimestre con churn al alza',company:'Faro',route:'leadership',steps:[
 step('comercial','Revisar el pipeline global de renovación y upsell','decision','cs-ebr','negotiation','Distingue renovación, expansión y riesgo; decide qué hipótesis de cartera deben comprobarse.'),
 step('tecnica','Calcular NDR y churn de la cartera','sql','data_bi-unit-1-3','technical','Calcula NDR y churn con la cartera anterior. Excluye nuevas cuentas de NDR y explicita denominadores y periodo.'),
 step('herramientas','Leer críticamente el dashboard ejecutivo','simulation','common-documentation','documentation','Identifica escala, denominadores, periodo y diferencias entre actividad y resultados del cálculo.','Business Intelligence'),
 step('procesos','Definir los OKRs del trimestre','deliverable','leadership-unit-1-1','planning','Define objetivos y resultados verificables a partir del dashboard, con línea base, responsables y capacidad.'),
 step('tecnica','Cruzar SLA y CSAT por persona del equipo','sql','data_bi-unit-1-3','technical','Consulta dataset ficticio del equipo de los OKRs. Usa personas de ejemplo, muestra y faltantes sin inferir desempeño real.'),
 step('procesos','Conducir un 1-on-1 de desempeño','decision','leadership-unit-1-2','collaboration','Elige preguntas y apoyo basados en SLA/CSAT, contexto y evidencia; no juzgues a una persona por una sola métrica.'),
 step('herramientas','Auditar la calidad de las llamadas','simulation','common-documentation','documentation','Revisa una transcripción ficticia con rúbrica, contexto y consentimiento, enlazada al plan del 1-on-1.','Telefonía y revisión de llamadas'),
 step('comercial','Defender el plan de ARR ante dirección','decision','cs-ebr','communication','Defiende escenarios, riesgos y necesidades del plan de equipo usando la auditoría; no presentes forecast como ARR garantizado.'),
 ]},
].map(unit=>({...unit,company:'Faro' as const,steps:unit.steps.map((s,i)=>({...s,key:unit.key+':'+(i+1)}))}));
export function validateMixedUnits(units:MixedUnit[]=MIXED_UNITS){
 for(const unit of units){
  if(unit.steps.length!==8)throw Error('MIXED_STEP_COUNT');
  for(const type of ['tecnica','comercial','procesos','herramientas'])if(unit.steps.filter(s=>s.type===type).length!==2)throw Error('MIXED_TYPE_BALANCE');
  unit.steps.forEach((s,i)=>{
   if(i>=2&&s.type===unit.steps[i-1].type&&s.type===unit.steps[i-2].type)throw Error('MIXED_INTERLEAVING');
   const source=findTrainingActivity(s.sourceKey);if(!source||!source.competencies.includes(s.primary)||COMPETENCY_WORK_TYPE[s.primary]!==s.type)throw Error('MIXED_SOURCE_MAPPING:'+s.key);
  });
 }
 return true;
}

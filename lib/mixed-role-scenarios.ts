import type {MixedUnit,MixedStep} from './mixed-role-content.ts';
export type MixedArtifact={submission_id:string;step_key:string;payload:Record<string,unknown>;draft:string;created_at:string};
export const MIXED_SCENARIOS:Record<string,Record<string,unknown>>={
 'account-manager-renewal':{company:'Faro',period:'2026-Q3',renewal_date:'2026-12-15',currency:'MXN',modules:['CRM','Analytics'],usage:[{module:'CRM',active_users:36,licensed_users:50},{module:'Analytics',active_users:12,licensed_users:50}],pipeline:[{account:'Faro',renewal:120000,probability:0.7},{account:'Puente',renewal:80000,probability:0.5},{account:'Nube',renewal:60000,probability:null}]},
 'onboarding-implementation':{company:'Faro',kickoff:'2026-09-01',first_value_target:'2026-09-15',acceptance:'First report reviewed by the customer',csv:'name,email,department\nAna,ana@example.test,Sales\nAna,ana@example.test,Sales\nLuis,invalid-email,Support\nCarla,carla@example.test,\nDiego,diego@example.test,Support',required_fields:['name','email','department'],column_map:{name:'full_name',email:'email',department:'team'},import_errors:[{email:'carla@example.test',code:'MISSING_TEAM'}]},
 'support-sync-incident':{company:'Faro',correlation_id:'faro-sync-42',opened_at:'2026-09-08T10:00:00Z',affected_records:42,http:[{time:'10:02',status:401,body:{error:'invalid_token'}},{time:'10:04',status:200,body:{received:42,synced:41}}],logs:[{time:'10:02',correlation:'faro-sync-42',status:401,token:'[REDACTED]'},{time:'10:04',correlation:'faro-sync-42',status:200}],webhooks:[{event_id:'evt-1',user_id:101,active:true},{event_id:'evt-1',user_id:101,active:true},{event_id:'evt-2',user_id:'invalid',active:'yes'}],verification:{received:42,synced:41,customer_confirmed:false}},
 'product-low-adoption':{company:'Faro',period:'2026-Q3',eligible_users:50,events:[{user_id:1,event:'open'},{user_id:1,event:'open'},{user_id:1,event:'complete'},{user_id:2,event:'open'},{user_id:3,event:'open'},{user_id:3,event:'error'}],feedback:[{id:'F1',problem:'Cannot find the first action',users:3,effort:2},{id:'F2',problem:'Missing color option',users:1,effort:1}],expected_flow:['open','configure','complete'],prototype:{A:['open','configure','complete'],B:['open','complete']}},
 'customer-success-risk':{company:'Faro',period_start:'2026-07-01',period_end:'2026-09-29',licensed_users:50,modules_contracted:4,modules_active:2,survey_response:6,survey_scale:[0,10],usage:[{period:1,module:'CRM',active_users:40},{period:1,module:'Analytics',active_users:32},{period:2,module:'CRM',active_users:35},{period:2,module:'Analytics',active_users:18},{period:3,module:'CRM',active_users:30},{period:3,module:'Analytics',active_users:8}],hypothetical_weights:{usage:0.6,nps:0.4},success_plan_days:60},
 'manager-rising-churn':{company:'Faro',period:'2026-Q3',currency:'MXN',portfolio:[{account:'Faro',opening_arr:120000,churn:0,contraction:20000,expansion:10000},{account:'Puente',opening_arr:80000,churn:80000,contraction:0,expansion:0},{account:'Nube',opening_arr:0,churn:0,contraction:0,expansion:60000}],team:[{person:'A',tickets:12,sla_met:10,csat_count:5,csat_sum:21},{person:'B',tickets:5,sla_met:5,csat_count:0,csat_sum:0},{person:'C',tickets:8,sla_met:6,csat_count:4,csat_sum:12}],call_transcript:'Customer: The report is late. Agent: I will review the incident, confirm its impact and send an update at 15:00. Customer: Please confirm the next step.'},
};
export const TOOL_FIELDS:Record<string,string[]>={
 CRM:['Etapa','Valor previsto','Fecha prevista','Evidencia','Siguiente paso'],
 'Firma digital':['Versión','Firmantes','Autoridad de firma','Orden de firma','Pendientes'],
 'Hoja de cálculo':['Columnas de origen','Columnas de destino','Reglas de transformación','Validaciones'],
 'Video asíncrono':['Guion','Pasos','Advertencias','Comprobación final'],
 Observabilidad:['Correlación','Hora del fallo','Hechos observados','Hipótesis','Redacción de secretos'],
 'Gestión de incidencias':['Resumen','Esperado y observado','Reproducción','Responsable','Estado confirmado'],
 'Gestión de feedback':['Problema','Población','Evidencia','Prioridad','Estado'],
 Prototipos:['Flujo elegido','Brecha atendida','Criterios de aceptación','Siguiente validación'],
 'Plataforma de Customer Success':['Módulos en riesgo','Objetivo de valor','Responsable','Próxima revisión','Plan de éxito'],
 Encuestas:['Pregunta','Población','Momento','Consentimiento','Cierre del feedback'],
 'Business Intelligence':['Periodo','Denominador','Escala','Brecha observada','Límites del análisis'],
 'Telefonía y revisión de llamadas':['Contexto','Evidencia de la llamada','Criterio de rúbrica','Apoyo recomendado','Consentimiento'],
};
/** User content is encoded as data, never interpolated as Python or SQL statements. */
export function mixedStarter(unit:MixedUnit,step:MixedStep,previous:MixedArtifact|null){
 const dataset=MIXED_SCENARIOS[unit.key];
 const prior=previous?{step:previous.step_key,submission:previous.submission_id,draft:previous.draft,fields:previous.payload.fields??{},output:previous.payload.output??''}:null;
 const input=JSON.stringify({scenario:dataset,previous:prior});
 if(step.format==='python')return 'import json\n\ndata = json.loads('+JSON.stringify(input)+')\nscenario = data["scenario"]\nprevious = data["previous"]\n\n# Complete the calculation, validate missing data and explain assumptions.\nprint(scenario)\n';
 if(step.format==='sql')return "CREATE TABLE caso_faro(documento TEXT);\nINSERT INTO caso_faro VALUES ('"+input.replace(/'/g,"''")+"');\n\n-- Query the fictional scenario and previous artifact with SQLite JSON functions.\nSELECT json_extract(documento, '$.scenario.company') AS company FROM caso_faro;\n";
 return '';
}

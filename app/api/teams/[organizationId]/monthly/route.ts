import {loadMonthlyReport} from '../../../../../lib/monthly-report-server';
import {monthlyCsv} from '../../../../../lib/monthly-team-report';
import {reportPdf} from '../../../../../lib/report-pdf';
import {createAdminSupabase} from '../../../../../lib/admin';
import {serverTranslator} from '../../../../../lib/localization/server';
import {consumeRateLimit} from '../../../../../lib/rate-limit';
export async function GET(req:Request,{params}:{params:Promise<{organizationId:string}>}){
 const {organizationId:org}=await params,q=new URL(req.url).searchParams,month=q.get('month')??new Date().toISOString().slice(0,7),format=q.get('format');if(!['pdf','csv'].includes(format??''))return new Response(null,{status:400});let data;try{data=await loadMonthlyReport(org,month,q.get('team'));}catch{return new Response(null,{status:503});}if(!data)return new Response(null,{status:403});
 if(!(await consumeRateLimit('monthly-report:'+data.d.user.id,10,600)).allowed)return new Response(null,{status:429});
 const {error}=await createAdminSupabase().rpc('log_monthly_report_download',{p_actor:data.d.user.id,p_org:org,p_month:month,p_format:format});if(error)return new Response(null,{status:503});const t=await serverTranslator(),r=data.report;
 const lines=['Garciloga',t('Reporte mensual')+' · '+month,data.d.organization.name,t('Personas activas')+': '+r.rows.length,t('Actividades completadas')+': '+r.completed,t('Asignaciones vencidas')+': '+r.overdue,t('Objetivos cumplidos')+': '+r.goalsMet,t('Objetivos vencidos')+': '+r.goalsOverdue,t('Competencias'),...r.competencies.map(c=>`${t(c.name)}: ${c.average??t('Sin evidencia suficiente')} /4 · ${t('Cambio mensual')}: ${c.change??'—'}`),t('Fortalezas'),...r.strengths.map(c=>t(c.name)),t('Áreas a reforzar'),...r.gaps.map(c=>t(c.name)),t('Práctica revisada; no desempeño laboral real. El alcance corresponde a los miembros visibles actualmente.')];
 const body=format==='pdf'?new Uint8Array(reportPdf(lines)):monthlyCsv(r,t);return new Response(body,{headers:{'Content-Type':format==='pdf'?'application/pdf':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="garciloga-${month}.${format}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}


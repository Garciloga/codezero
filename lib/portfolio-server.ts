import 'server-only';
import {createAdminSupabase} from './admin';
import {readWorkspacePages} from './workspace-pages';
import {competencyProfile,type CompetencyEvidence} from './competency-matrix';
import {eligiblePersonalProject} from './portfolio-evidence-policy';
export async function personalPortfolioData(userId:string){const admin=createAdminSupabase();const [history,certificates,account]=await Promise.all([
 readWorkspacePages<CompetencyEvidence>((a,b)=>admin.from('learning_evidence_history').select('*').eq('user_id',userId).is('organization_id',null).in('review_source',['admin','manager']).order('observed_at').order('id').range(a,b)),
 admin.from('certificates').select('id,title,certificate_type,metadata,issued_at').eq('user_id',userId),admin.from('profiles').select('status').eq('id',userId).maybeSingle()]);
 if(history.error||certificates.error||account.error)throw Error('PORTFOLIO_DATA_UNAVAILABLE');if(account.data?.status!=='active')return null;
 const eligible=(history.data??[]).filter(e=>eligiblePersonalProject(e,userId));
 // Certificates from role routes are shareable only when their capstone is personal.
 const certs=(certificates.data??[]).filter(c=>c.certificate_type==='codezero-complete'||eligible.some(e=>e.id===c.metadata?.capstone_evidence_id));
 return {evidence:eligible,certificates:certs,summary:competencyProfile(history.data??[],null)};
}
export async function publicPortfolio(token:string){const a=createAdminSupabase();const {data:p,error}=await a.from('public_portfolios').select('user_id,display_name,evidence_ids,certificate_ids,competency_keys').eq('share_token',token).eq('published',true).maybeSingle();if(error)throw Error('PORTFOLIO_DATA_UNAVAILABLE');if(!p)return null;const personal=await personalPortfolioData(p.user_id);if(!personal)return null;return {displayName:p.display_name,projects:personal.evidence.filter(e=>p.evidence_ids.includes(e.id)).map(e=>({key:e.activity_key,date:e.observed_at.slice(0,10)})),certificates:personal.certificates.filter(c=>p.certificate_ids.includes(c.id)).map(c=>({title:c.title,date:c.issued_at.slice(0,10)})),competencies:personal.summary.competencies.filter(c=>p.competency_keys.includes(c.key)&&c.count>=3).map(c=>({key:c.key,name:c.name,level:c.level}))};}

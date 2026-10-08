import {randomUUID} from 'node:crypto';
import {workspaceUser} from '../../../lib/workspace-server';
import {createAdminSupabase} from '../../../lib/admin';
import {personalPortfolioData} from '../../../lib/portfolio-server';
import {trustedWorkspaceMutation} from '../../../lib/workspace-sandbox';
import {boundedForm} from '../../../lib/bounded-form';
import {consumeRateLimit} from '../../../lib/rate-limit';
export async function POST(req:Request){if(!trustedWorkspaceMutation(req))return new Response(null,{status:403});const s=await workspaceUser();if(!s)return new Response(null,{status:401});if(!(await consumeRateLimit('portfolio:'+s.user.id,10,600)).allowed)return new Response(null,{status:429});let f:FormData;try{f=await boundedForm(req,12000);}catch{return new Response(null,{status:400});}const a=createAdminSupabase(),action=f.get('action');let error;
 if(action==='unpublish')({error}=await a.from('public_portfolios').update({published:false,share_token:randomUUID(),updated_at:new Date().toISOString()}).eq('user_id',s.user.id));
 else if(action==='publish'){const p=await personalPortfolioData(s.user.id);if(!p)return new Response(null,{status:403});const name=String(f.get('display_name')??'').trim(),selected=(k:string)=>[...new Set(f.getAll(k).map(String))],evidence=selected('evidence'),certificates=selected('certificates'),competencies=selected('competencies');
 if(f.get('consent')!=='yes'||name.length<2||name.length>120||evidence.length>100||certificates.length>100||competencies.length>10||evidence.some(id=>!p.evidence.some(e=>e.id===id))||certificates.some(id=>!p.certificates.some(c=>c.id===id))||competencies.some(key=>!p.summary.competencies.some(c=>c.key===key&&c.count>=3)))return new Response(null,{status:400});
 // Rotating token invalidates prior selections and revoked links; no public source records are copied.
 ({error}=await a.from('public_portfolios').upsert({user_id:s.user.id,share_token:randomUUID(),published:true,display_name:name,evidence_ids:evidence,certificate_ids:certificates,competency_keys:competencies,consent_at:new Date().toISOString(),updated_at:new Date().toISOString()}));
 }else return new Response(null,{status:400});if(error)return new Response(null,{status:503});return Response.redirect(new URL('/portfolio',req.url),303);}

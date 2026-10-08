import {boundedForm} from '../../../../lib/bounded-form';
import {createHash} from 'node:crypto';
import {trustedWorkspaceMutation} from '../../../../lib/workspace-sandbox';
import {createAdminSupabase} from '../../../../lib/admin';
import {consumeRateLimit} from '../../../../lib/rate-limit';
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL))return new Response(null,{status:403});
 if(Number(req.headers.get('content-length'))>256)return new Response(null,{status:413});
 let input:FormData;try{input=await boundedForm(req,256);}catch{return new Response(null,{status:413});}
 const page=input.get('page');
 if(typeof page!=='string'||!['home','pricing','registration','roadmap'].includes(page)||[...input.keys()].length!==1)return new Response(null,{status:400});
 const network=req.headers.get('x-real-ip')??'unknown';const key=createHash('sha256').update(new Date().toISOString().slice(0,10)+':'+network).digest('hex');
 try{const rate=await consumeRateLimit('site-visit:'+key,30,3600);if(!rate.allowed)return new Response(null,{status:429});const {error}=await createAdminSupabase().rpc('record_site_visit',{p_page:page});return new Response(null,{status:error?503:204});}catch{return new Response(null,{status:503});}
}

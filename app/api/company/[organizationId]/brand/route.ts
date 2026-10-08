import {randomUUID} from 'node:crypto';
import {companyContext} from '../../../../../lib/company-server';
import {createAdminSupabase} from '../../../../../lib/admin';
import {trustedWorkspaceMutation} from '../../../../../lib/workspace-sandbox';
import {consumeRateLimit} from '../../../../../lib/rate-limit';
import {boundedForm} from '../../../../../lib/bounded-form';
import {MAX_PHOTO_BYTES} from '../../../../../lib/profile-photo';
import {normalizeCompanyBrand} from '../../../../../lib/company-brand';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
type Context={params:Promise<{organizationId:string}>};
export async function GET(req:Request,{params}:Context){
 const {organizationId:org}=await params,kind=new URL(req.url).searchParams.get('kind');
 if(!['logo','cover'].includes(kind??''))return new Response(null,{status:400,headers});
 const session=await companyContext(org);if(!session)return new Response(null,{status:403,headers});
 const version=kind==='logo'?session.company.logo_version:session.company.cover_version;
 if(!version)return new Response(null,{status:404,headers});
 const {data,error}=await session.supabase.storage.from('company-brand').download(`${org}/${kind}-${version}.webp`);
 if(error||!data)return new Response(null,{status:404,headers});
 return new Response(await data.arrayBuffer(),{headers:{...headers,'Content-Type':'image/webp'}});
}
async function mutate(req:Request,{params}:Context,remove:boolean){
 if(!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL))return Response.json({error:'FORBIDDEN'},{status:403,headers});
 const {organizationId:org}=await params;const session=await companyContext(org);
 if(!session?.canBrand)return Response.json({error:'FORBIDDEN'},{status:403,headers});
 const kind=new URL(req.url).searchParams.get('kind');if(!['logo','cover'].includes(kind??''))return Response.json({error:'INVALID_KIND'},{status:400,headers});
 const rate=await consumeRateLimit('company-brand:'+org+':'+session.user.id,10,600);if(!rate.allowed)return Response.json({error:'RATE_LIMITED'},{status:429,headers});
 const admin=createAdminSupabase();let version:string|null=null;const previous=kind==='logo'?session.company.logo_version:session.company.cover_version;
 if(remove){version=null;}
 else{
 let image:Buffer;try{const form=await boundedForm(req,MAX_PHOTO_BYTES+65536),file=form.get('image');if(!(file instanceof File))throw Error('INVALID_IMAGE');image=await normalizeCompanyBrand(new Uint8Array(await file.arrayBuffer()),file.type,kind as 'logo'|'cover');}catch{return Response.json({error:'INVALID_IMAGE'},{status:400,headers});}
 version=randomUUID();const {error}=await admin.storage.from('company-brand').upload(`${org}/${kind}-${version}.webp`,image,{contentType:'image/webp',upsert:false,cacheControl:'0'});if(error)return Response.json({error:'STORAGE_UNAVAILABLE'},{status:503,headers});
 }
 const {error}=await admin.rpc('update_company_brand',{p_org:org,p_actor:session.user.id,p_kind:kind,p_version:version});
 if(error){if(version)await admin.storage.from('company-brand').remove([`${org}/${kind}-${version}.webp`]);return Response.json({error:'BRAND_UPDATE_FAILED'},{status:503,headers});}
 if(previous)await admin.storage.from('company-brand').remove([`${org}/${kind}-${previous}.webp`]);return Response.json({version},{headers});
}
export async function POST(req:Request,context:Context){return mutate(req,context,false);}
export async function DELETE(req:Request,context:Context){return mutate(req,context,true);}

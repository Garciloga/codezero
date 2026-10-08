import {serverTranslator} from '../../../lib/localization/server';
import {loadNotices} from '../../../lib/notifications-server';
import {NOTICE_TYPES} from '../../../lib/notification-types';
import {trustedWorkspaceMutation} from '../../../lib/workspace-sandbox';
import {boundedForm} from '../../../lib/bounded-form';
import {createAdminSupabase} from '../../../lib/admin';
import {supportSession} from '../../../lib/support-session';
import {consumeRateLimit} from '../../../lib/rate-limit';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){try{const d=await loadNotices();const t=d?await serverTranslator():null;return d?Response.json({notices:d.notices.map(n=>({...n,title:t!(n.title)}))},{headers}):new Response(null,{status:401,headers});}catch{return Response.json({error:'NOTIFICATIONS_UNAVAILABLE'},{status:503,headers});}}
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req)||await supportSession())return new Response(null,{status:403,headers});let d;try{d=await loadNotices();}catch{return new Response(null,{status:503,headers});}if(!d)return new Response(null,{status:401,headers});if(!(await consumeRateLimit('notices:'+d.session.user.id,30,600)).allowed)return new Response(null,{status:429,headers});
 let f:FormData;try{f=await boundedForm(req,16000);}catch{return new Response(null,{status:413,headers});}const action=String(f.get('action')),admin=createAdminSupabase();let error;
 if(action==='preferences'){const disabled=f.getAll('disabled').map(String);if(disabled.some(k=>!Object.hasOwn(NOTICE_TYPES,k)))return new Response(null,{status:400,headers});({error}=await admin.from('notice_preferences').upsert({user_id:d.session.user.id,disabled_types:[...new Set(disabled)],updated_at:new Date().toISOString()}));}
 else if(action==='read'||action==='read_all'){const ids=action==='read_all'?d.notices.filter(n=>!n.read).map(n=>n.id):[String(f.get('id'))];if(ids.some(id=>!d!.notices.some(n=>n.id===id)))return new Response(null,{status:400,headers});if(ids.length)({error}=await admin.from('notice_read_states').upsert(ids.map(event_key=>({user_id:d!.session.user.id,event_key,read_at:new Date().toISOString()})),{onConflict:'user_id,event_key'}));}
 else return new Response(null,{status:400,headers});if(error)return new Response(null,{status:503,headers});return Response.redirect(new URL(action==='preferences'?'/profile':'/notifications',req.url),303);
}

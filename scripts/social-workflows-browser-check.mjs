// Real Next pages, form submissions and rendering. Auth/REST fixtures are synthetic;
// transaction and access checks run separately in social-workflows-db-check.mjs.
import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';import http from 'node:http';import {spawn} from 'node:child_process';import {randomUUID} from 'node:crypto';import {setTimeout as pause} from 'node:timers/promises';
import {chromium,firefox,webkit} from '../sandbox-runtime/node_modules/playwright/index.mjs';
const origin='http://localhost:3272',dbOrigin='http://127.0.0.1:5472';const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const users=[1,2,3,4].map(n=>({id:id(n),email:`synthetic${n}@codezero.example.test`,aud:'authenticated',role:'authenticated',email_confirmed_at:n===4?null:new Date().toISOString(),user_metadata:{full_name:'Synthetic '+n,locale:'es'},app_metadata:{provider:'email'}}));
const sessions=users.map(user=>{const claims={sub:user.id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)};return{access_token:[{alg:'HS256',typ:'JWT'},claims].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.')+'.fixture',refresh_token:'synthetic-refresh',token_type:'bearer',expires_in:3600,expires_at:claims.exp,user};});
const tables={profiles:users.map((u,i)=>({...u,full_name:u.user_metadata.full_name,status:'active',role:i===2?'owner':'student',plan_name:'pro'})),community_members:[],community_posts:[],community_reports:[],mentoring_profiles:[],mentoring_slots:[],mentoring_requests:[]};let calls=0;
const database=http.createServer(async(req,res)=>{
 const u=new URL(req.url,dbOrigin);res.setHeader('Content-Type','application/json');const actor=sessions.find(s=>req.headers.authorization==='Bearer '+s.access_token)?.user;
 if(u.pathname==='/auth/v1/user'){res.writeHead(actor?200:401);return res.end(JSON.stringify(actor??{message:'denied'}));}
 if(!u.pathname.startsWith('/rest/v1/')){res.writeHead(404);return res.end('{}');}const table=u.pathname.split('/').pop();
 if(u.pathname.includes('/rpc/')){
  let raw='';for await(const chunk of req)raw+=chunk;const p=JSON.parse(raw||'{}');
  if(table==='consume_api_rate_limit')return res.end(JSON.stringify({allowed:true}));if(table==='company_learning_plan')return res.end('null');calls++;
  const valid=users.find(x=>x.id===p.p_actor&&x.email_confirmed_at);const mod=p.p_actor===id(3);
  const deny=()=>{res.writeHead(403);res.end(JSON.stringify({message:'FORBIDDEN'}));};if(!valid)return deny();
  if(table==='community_feed'){let items=tables.community_posts.filter(x=>(x.status==='approved'||x.author_id===p.p_actor||mod)&&(p.p_parent?(x.id===p.p_parent||x.parent_id===p.p_parent):!x.parent_id));return res.end(JSON.stringify(items.map(x=>({...x,alias:tables.community_members.find(m=>m.user_id===x.author_id)?.alias,own:x.author_id===p.p_actor}))));}
  if(table==='community_action'){
   if(p.p_action==='join'){if(!p.p_consent||mod)return deny();tables.community_members.push({user_id:p.p_actor,alias:p.p_alias,blocked:false});return res.end(JSON.stringify(p.p_actor));}
   if(p.p_action==='post'){if(!tables.community_members.some(x=>x.user_id===p.p_actor))return deny();const old=tables.community_posts.find(x=>x.request_id===p.p_request);if(old)return res.end(JSON.stringify(old.id));const row={id:randomUUID(),request_id:p.p_request,author_id:p.p_actor,parent_id:p.p_parent,category:p.p_category,title:p.p_title||'Pregunta de aprendizaje',body:p.p_body,status:'pending',locked:false,created_at:new Date().toISOString()};tables.community_posts.push(row);return res.end(JSON.stringify(row.id));}
   if(p.p_action==='approve'){if(!mod)return deny();tables.community_posts.find(x=>x.id===p.p_target).status='approved';return res.end(JSON.stringify(p.p_target));}
   if(p.p_action==='report'){tables.community_reports.push({id:randomUUID(),post_id:p.p_target,reason:p.p_body,resolved_at:null});return res.end(JSON.stringify(p.p_target));}
  }
  if(table==='mentoring_action'){
   if(p.p_action==='owner_profile'){if(!mod||!p.p_consent)return deny();const row={user_id:p.p_actor,display_name:p.p_name,bio:p.p_bio,languages:p.p_languages,status:'approved'};tables.mentoring_profiles.splice(0,tables.mentoring_profiles.length,row);return res.end(JSON.stringify(p.p_actor));}
   if(p.p_action==='slot'){if(!mod)return deny();const row={id:randomUUID(),mentor_id:p.p_actor,starts_at:p.p_start,ends_at:new Date(Date.parse(p.p_start)+2700000).toISOString(),active:true};tables.mentoring_slots.push(row);return res.end(JSON.stringify(row.id));}
   if(p.p_action==='request'){const row={id:randomUUID(),slot_id:p.p_target,learner_id:p.p_actor,topic:p.p_topic,status:'pending',expires_at:new Date(Date.now()+86400000).toISOString(),price_cents:69900};tables.mentoring_requests.push(row);return res.end(JSON.stringify(row.id));}
   if(p.p_action==='confirm'){if(!mod)return deny();Object.assign(tables.mentoring_requests.find(x=>x.id===p.p_target),{status:'confirmed',meeting_url:p.p_url,payment_reference:p.p_reference});return res.end(JSON.stringify(p.p_target));}
  }
  return res.end('null');
 }
 let rows=(tables[table]??[]).map(x=>({...x}));
 if(table==='mentoring_requests')rows=rows.map(x=>({...x,mentoring_slots:tables.mentoring_slots.find(s=>s.id===x.slot_id)}));
 if(table==='mentoring_profiles')rows=rows.map(x=>({...x,profiles:tables.profiles.find(p=>p.id===x.user_id)}));
 if(table==='community_reports')rows=rows.map(x=>({...x,community_posts:tables.community_posts.find(s=>s.id===x.post_id)}));
 for(const[k,v]of u.searchParams){const read=r=>k.split('.').reduce((a,b)=>a?.[b],r);if(v.startsWith('eq.'))rows=rows.filter(r=>String(read(r))===v.slice(3));if(v.startsWith('gt.'))rows=rows.filter(r=>String(read(r))>v.slice(3));if(v==='is.null')rows=rows.filter(r=>read(r)==null);if(v.startsWith('in.'))rows=rows.filter(r=>v.slice(4,-1).split(',').includes(String(read(r))));}
 rows=rows.slice(0,Number(u.searchParams.get('limit')??100));if(req.headers.accept?.includes('vnd.pgrst.object'))return res.end(JSON.stringify(rows[0]??null));return res.end(JSON.stringify(rows));
});await new Promise(r=>database.listen(5472,'127.0.0.1',r));
const logs=[];const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','-H','127.0.0.1','-p','3272'],{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:dbOrigin,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic',SUPABASE_SECRET_KEY:'synthetic',NEXT_PUBLIC_APP_URL:origin,CODEZERO_ENVIRONMENT:'sandbox',CODEZERO_WORKSPACE_SANDBOX:'1',CODEZERO_SANDBOX_PROJECT_REF:'local'},stdio:['ignore','pipe','pipe']});server.stdout.on('data',x=>logs.push(String(x)));server.stderr.on('data',x=>logs.push(String(x)));let browser;let finished=false;
try{
 for(let i=0;i<120;i++){try{if((await fetch(origin+'/login')).ok)break;}catch{}await pause(250);if(i===119)throw Error('Next unavailable');}
 const cookie=n=>'sb-127-auth-token=base64-'+Buffer.from(JSON.stringify(sessions[n-1])).toString('base64url');
 const post=(n,path,form,requestOrigin=origin)=>fetch(origin+path,{method:'POST',headers:{cookie:cookie(n),origin:requestOrigin},body:new URLSearchParams(form),redirect:'manual'});
 assert.equal((await fetch(origin+'/community',{redirect:'manual'})).status,307);
 assert.equal((await post(1,'/api/community',{action:'join',alias:'Test',consent:'1'},'https://invalid.example')).status,403);assert.equal(calls,0);
 assert.equal((await post(4,'/api/community',{action:'join',alias:'Test',consent:'1'})).status,401);assert.equal(calls,0);
 assert.equal((await post(1,'/api/mentoring',{action:'request',target:'bad',request_id:randomUUID()})).status,400);
 assert.equal((await post(1,'/api/mentoring',{action:'confirm',target:randomUUID(),meeting_url:'javascript:alert(1)'})).status,403);
 assert.equal((await post(3,'/api/mentoring',{action:'confirm',target:randomUUID(),meeting_url:'javascript:alert(1)'})).status,400);
 console.log('PASS actual HTTP handlers reject anonymous, unverified, hostile origin and invalid identifiers/links');

 if(process.env.CODEZERO_HTTP_ONLY==='1'){
  const get=(n,path)=>fetch(origin+path,{headers:{cookie:cookie(n)},redirect:'manual'});
  assert.equal((await get(1,'/admin/social')).status,404);
  assert.equal((await post(1,'/api/community',{action:'join',alias:'Aprendiz de prueba',consent:'1'})).status,303);
  const html=await (await get(1,'/community')).text();assert.match(html,/Nueva conversación/);assert.match(html,/name="request_id"/);
  const request=randomUUID();const fields={action:'post',request_id:request,title:'Pregunta de prueba',body:'<script>window.injected=true</script>'};await post(1,'/api/community',fields);await post(1,'/api/community',fields);assert.equal(tables.community_posts.length,1);
  const pending=await (await get(1,'/community')).text();assert.ok(pending.includes('&lt;script&gt;'));assert.ok(!pending.includes('<script>window.injected=true</script>'));
  assert.equal((await post(1,'/api/community',{action:'approve',target:tables.community_posts[0].id})).headers.get('location').includes('result=failed'),true);
  await post(3,'/api/community',{action:'approve',target:tables.community_posts[0].id});assert.equal((await get(1,'/community/'+tables.community_posts[0].id)).status,200);
  assert.equal((await post(2,'/api/mentoring',{action:'apply',consent:'1'})).status,400);
  assert.equal((await post(2,'/api/mentoring',{action:'slot',starts_at:new Date(Date.now()+3*86400000).toISOString().slice(0,16)})).status,403);
  await post(3,'/api/mentoring',{action:'owner_profile',display_name:'Isaac sintético',bio:'Experiencia ficticia sobre liderazgo y procesos.',languages:'es',consent:'1'});
  await post(3,'/api/mentoring',{action:'slot',starts_at:new Date(Date.now()+3*86400000).toISOString().slice(0,16)});
  const catalog=await (await get(1,'/mentoring')).text();assert.match(catalog,/Isaac sintético/);assert.match(catalog,/Solicitar sesión/);
  await post(1,'/api/mentoring',{action:'request',target:tables.mentoring_slots[0].id,request_id:randomUUID(),topic:'Objetivo ficticio para una sesión de prueba'});
  assert.equal((await post(1,'/api/mentoring',{action:'confirm',target:tables.mentoring_requests[0].id,payment_reference:'synthetic-reference',meeting_url:'https://meeting.example.test/room'})).status,403);
  await post(3,'/api/mentoring',{action:'confirm',target:tables.mentoring_requests[0].id,payment_reference:'synthetic-reference',meeting_url:'https://meeting.example.test/room'});
  const confirmed=await (await get(1,'/mentoring')).text();assert.match(confirmed,/https:\/\/meeting.example.test\/room/);
  const admin=await (await get(3,'/admin/social')).text();assert.match(admin,/Mi perfil y disponibilidad de mentoría/);
  users[0].user_metadata.locale='en';const english=await (await get(1,'/community')).text();assert.match(english,/Participation rules/);
  console.log('PASS real Next HTTP pages and handlers: opt-in, replay, moderation, HTML escaping, mentor workflow, private administration and English rendering; Auth/REST are fixtures');finished=true;
 }else{
 const engine=process.env.CODEZERO_BROWSER_ENGINE??'chromium';
 browser=await ({chromium,firefox,webkit}[engine]).launch({headless:true,...(process.env.CODEZERO_BROWSER_EXECUTABLE?{executablePath:process.env.CODEZERO_BROWSER_EXECUTABLE}:{}),...(engine==='chromium'?{args:['--no-sandbox','--disable-dev-shm-usage']}:engine==='firefox'?{env:{...process.env,MOZ_DISABLE_CONTENT_SANDBOX:'1'},firefoxUserPrefs:{'security.sandbox.content.level':0}}:{})});const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const signIn=async n=>{await page.goto('about:blank');await context.clearCookies();await context.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(sessions[n-1])).toString('base64url'),url:origin}]);};
 const go=async path=>{const r=await page.goto(origin+path);assert.equal(r.status(),200);await page.waitForLoadState('networkidle');};
 await signIn(1);await go('/community');const join=page.locator('form').filter({has:page.locator('input[name=action][value=join]')});await join.locator('[name=alias]').fill('Aprendiz sintético');await join.locator('[name=consent]').check();await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),join.locator('button').click()]);assert.equal(tables.community_members.length,1);
 const form=page.locator('form').filter({has:page.locator('input[name=action][value=post]')});await form.locator('[name=title]').fill('Pregunta de aprendizaje');await form.locator('[name=body]').fill('<img src=x onerror="window.socialInjected=true"> Texto de prueba');await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),form.locator('button').click()]);assert.equal(tables.community_posts.length,1);assert.equal(tables.community_posts[0].status,'pending');assert.equal(await page.evaluate(()=>window.socialInjected),undefined);assert.equal(await page.locator('.social-body img').count(),0);
 await signIn(3);await go('/admin/social');await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),page.getByRole('button',{name:'Aprobar publicación'}).click()]);await signIn(1);await go('/community/'+tables.community_posts[0].id);assert.match(await page.locator('main').innerText(),/Texto de prueba/);
 console.log('PASS browser opt-in, form persistence, private review, moderation and escaped user content');
 await signIn(2);await go('/mentoring');assert.equal(await page.getByText('Postularme como mentor',{exact:true}).count(),0);await signIn(3);await go('/mentoring');const application=page.locator('form').filter({has:page.locator('input[name=action][value=owner_profile]')});await application.locator('[name=display_name]').fill('Isaac sintético');await application.locator('[name=bio]').fill('Experiencia ficticia de pruebas en liderazgo y procesos.');await application.locator('[name=consent]').check();await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),application.locator('button').click()]);assert.equal(tables.mentoring_profiles.length,1);assert.equal(tables.mentoring_profiles[0].status,'approved');
 const availability=page.locator('form').filter({has:page.locator('input[name=action][value=slot]')});await availability.locator('[name=starts_at]').fill(new Date(Date.now()+3*86400000).toISOString().slice(0,16));await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),availability.locator('button').click()]);assert.equal(tables.mentoring_slots.length,1);
 await signIn(1);await go('/mentoring');const request=page.locator('form').filter({has:page.locator('input[name=action][value=request]')});await request.locator('[name=topic]').fill('Objetivo ficticio: mejorar un proceso de liderazgo.');await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),request.locator('button').click()]);assert.equal(tables.mentoring_requests.length,1);
 await signIn(3);await go('/admin/social');const confirmation=page.locator('form').filter({has:page.locator('input[name=payment_reference]')});await confirmation.locator('[name=payment_reference]').fill('synthetic-payment-reference');await confirmation.locator('[name=meeting_url]').fill('https://meeting.example.test/synthetic');await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),confirmation.locator('button').click()]);await signIn(1);await go('/mentoring');assert.equal(await page.getByRole('link',{name:'Abrir sesión',exact:true}).getAttribute('href'),'https://meeting.example.test/synthetic');
 console.log('PASS browser owner profile, owner availability, learner request and owner confirmation without charges');
 for(const n of [1,3]){await signIn(n);for(const path of n===3?['/admin/social']:['/community','/mentoring']){await go(path);for(const width of [390,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,path+' responsive '+width);}await page.addScriptTag({path:'sandbox-runtime/node_modules/axe-core/axe.min.js'});const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);}}
 for(const locale of ['es','en','pt','fr']){users[0].user_metadata.locale=locale;await signIn(1);const dictionary=locale==='es'?{}:JSON.parse(readFileSync('lib/localization/'+locale+'-social.json','utf8'));for(const [route,title]of [['/community','Comunidad de alumnos'],['/mentoring','Mentorías']]){await go(route);assert.equal(await page.locator('h1').innerText(),dictionary[title]??title);}}assert.deepEqual(errors,[]);console.log('PASS mobile/desktop, English UI, unchanged field values, automated WCAG checks and no browser errors');
 finished=true;await context.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');if(server.exitCode===null)await new Promise(r=>server.once('close',r));database.close();if(!finished)console.error(logs.join('').slice(-7000));}


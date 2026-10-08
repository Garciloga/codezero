import assert from 'node:assert/strict';import fs from 'node:fs';import http from 'node:http';import { spawn } from 'node:child_process';import { setTimeout as pause } from 'node:timers/promises';import { chromium, firefox, webkit } from '../sandbox-runtime/node_modules/playwright/index.mjs';
const origin='http://localhost:3256', dbOrigin='http://127.0.0.1:5456';
const id='00000000-0000-4000-8000-000000000001';
const curriculum=JSON.parse(fs.readFileSync('localization-curriculum-source.json'));const faqs=JSON.parse(fs.readFileSync('localization-faq-source.json'));
const user={id,email:'learner@codezero.example.test',aud:'authenticated',role:'authenticated',email_confirmed_at:new Date().toISOString(),user_metadata:{full_name:'Nom de test',locale:'es'},app_metadata:{provider:'email'}};
const claims={sub:id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)};
const jwt=[{alg:'HS256',typ:'JWT'},claims].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.')+'.synthetic-fixture-signature';
const session={access_token:jwt,refresh_token:'synthetic-fixture-refresh-token',token_type:'bearer',expires_in:3600,expires_at:claims.exp,user};
const tables={
 plans:[{name:'free',price_monthly_cents:0,exercise_limit:20,exam_limit:1,project_limit:0},{name:'starter',price_monthly_cents:24900,exercise_limit:200,exam_limit:10,project_limit:5},{name:'pro',price_monthly_cents:69900,exercise_limit:1000,exam_limit:50,project_limit:20}],
 profiles:[{id,email:user.email,full_name:user.user_metadata.full_name,role:'student',plan_name:'free',status:'active'}],
 levels:[{id:1,level_number:1,slug:'fixture-level',estimated_hours:10,...curriculum.levels[0]}],
 lessons:[{id:1,level_id:1,slug:'fixture-lesson',estimated_minutes:20,sort_order:1,status:'published',...curriculum.lessons[0]}],
 lesson_progress:[{lesson_id:1,status:'completed',progress_percent:100}],
 exercises:[{id:1,lesson_id:1,...curriculum.exercises[0]}],
 level_exams:[{id:1,level_id:1,passing_score:70,...curriculum.exams[0]}],
 exam_questions:curriculum.questions.slice(0,5).map((q,i)=>({...q,id:i+1,exam_id:1,sort_order:i})),
 support_faqs:faqs.map((f,i)=>({...f,id:i+1,slug:'fixture-faq-'+i,sort_order:i})),
};
const secondUser={...user,id:'00000000-0000-4000-8000-000000000002',email:'second@codezero.example.test',user_metadata:{full_name:'Second account',locale:'pt'}};
const secondJwt=[{alg:'HS256',typ:'JWT'},{...claims,sub:secondUser.id}].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.')+'.synthetic-fixture-signature';
const secondSession={...session,access_token:secondJwt,user:secondUser};
const ownerUser={...user,id:'00000000-0000-4000-8000-000000000003',email:'owner@codezero.example.test',user_metadata:{full_name:'Fictional operator',locale:'fr'}};
const ownerJwt=[{alg:'HS256',typ:'JWT'},{...claims,sub:ownerUser.id}].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.')+'.synthetic-fixture-signature';
const ownerSession={...session,access_token:ownerJwt,user:ownerUser};
tables.profiles.push({...tables.profiles[0],id:secondUser.id,full_name:'Second account'},{...tables.profiles[0],id:ownerUser.id,role:'owner'});tables.support_tickets=[];tables.support_ticket_messages=[];
// Eight-person Enterprise fixture. These are simulated Auth sessions, not real accounts.
const orgId='10000000-0000-4000-8000-000000000001';
const actorId=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const orgMembers=[[4,'owner',null],[5,'admin',4],[6,'manager',4],[7,'manager',4],[8,'supervisor',6],[9,'learner',8],[10,'learner',7],[11,'learner',6]].map(([n,role,parent])=>({organization_id:orgId,user_id:actorId(n),display_name:'Persona Vivo '+n,role,reports_to:parent?actorId(parent):null,active:true,job_title:n===9?'Agente de Soporte N2':null}));
const scope={4:[4,5,6,7,8,9,10,11],5:[4,5,6,7,8,9,10,11],6:[6,8,9,11],7:[7,10],8:[8,9],9:[9],10:[10],11:[11]};
const allSessions=[session,secondSession,ownerSession,...orgMembers.map(m=>{const u={...user,id:m.user_id,email:`vivo${m.user_id.slice(-2)}@codezero.example.test`,user_metadata:{full_name:m.display_name,locale:'es'}};const token=[{alg:'HS256',typ:'JWT'},{...claims,sub:u.id}].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.')+'.synthetic-fixture-signature';tables.profiles.push({...tables.profiles[0],id:u.id,full_name:m.display_name,role:'student',plan_name:'enterprise'});return {...session,access_token:token,user:u};})];
tables.organizations=[{id:orgId,name:'Empresa Vivo',active:true}];tables.organization_memberships=orgMembers;
tables.learning_assignments=orgMembers.map(m=>({organization_id:orgId,user_id:m.user_id,activity_key:'exam:1',activity_type:'exam',activity_id:1,title:'Prueba de APIs',competency:'APIs'}));
tables.learning_evidence=orgMembers.map(m=>({organization_id:orgId,user_id:m.user_id,activity_key:'exam:1',completed:m.role!=='learner',score:m.role==='learner'?40:80}));tables.learning_errors=[];
let activationReturns=0;let authReads=0;const profilePhotos=new Map();
const database=http.createServer(async(req,res)=>{
 const url=new URL(req.url,dbOrigin);res.setHeader('Content-Type','application/json');
 if(url.pathname==='/auth/v1/user'){
  const selectedUser=allSessions.find(s=>req.headers.authorization==='Bearer '+s.access_token)?.user??null;
  if(!selectedUser){res.writeHead(401);return res.end(JSON.stringify({message:'Synthetic fixture rejects unauthenticated request'}));}
  if(req.method==='PUT'){let body='';for await(const chunk of req)body+=chunk;const data=JSON.parse(body);assert.deepEqual(Object.keys(data.data),['locale']);selectedUser.user_metadata={...selectedUser.user_metadata,...data.data};}
  if(req.method==='GET')authReads++;return res.end(JSON.stringify(selectedUser));
 }
 if(url.pathname.startsWith('/storage/v1/object/')) {
  const actor=allSessions.find(s=>req.headers.authorization==='Bearer '+s.access_token)?.user;
  const path=decodeURIComponent(url.pathname).replace('/storage/v1/object/authenticated/','').replace('/storage/v1/object/','');
  if(!actor || (req.method!=='DELETE' && path!==`profile-photos/${actor.id}/avatar.webp`)) {res.writeHead(403);return res.end('{}');}
  if(req.method==='POST'){const parts=[];for await(const chunk of req)parts.push(chunk);profilePhotos.set(actor.id,Buffer.concat(parts));return res.end(JSON.stringify({Key:path}));}
  if(req.method==='DELETE'){let raw='';for await(const c of req)raw+=c;assert.deepEqual(JSON.parse(raw).prefixes,[`${actor.id}/avatar.webp`]);profilePhotos.delete(actor.id);return res.end('[]');}
  if(req.method==='GET'){const photo=profilePhotos.get(actor.id);if(!photo){res.writeHead(404);return res.end('{}');}res.setHeader('Content-Type','image/webp');return res.end(photo);}
 }
 if(url.pathname.startsWith('/rest/v1/')){
  const table=url.pathname.split('/').pop();
  if(url.pathname.includes('/rpc/')) {let raw='';for await(const c of req)raw+=c;const p=JSON.parse(raw||'{}');if(table==='record_activation_return'){activationReturns++;return res.end('null');}if(table==='workspace_directory')return res.end(JSON.stringify(orgMembers.filter(m=>m.active).map(({organization_id,...m})=>m)));if(table==='workspace_current_levels')return res.end(JSON.stringify((scope[Number(p.p_actor?.slice(-12))]??[]).map(n=>({user_id:actorId(n),current_level:1}))));if(table==='consume_api_rate_limit')return res.end(JSON.stringify({allowed:true,count:1,retry_after_seconds:0}));if(table==='mutate_support_ticket'){let ticket=tables.support_tickets.find(t=>t.id===p.p_ticket);const now=new Date().toISOString();if(p.p_action==='create'){ticket={id:tables.support_tickets.length+1,user_id:p.p_actor,...p.p_payload,priority:'normal',status:'open',created_at:now,updated_at:now};tables.support_tickets.push(ticket);}if(!ticket){res.writeHead(400);return res.end(JSON.stringify({message:'TICKET_NOT_FOUND'}));}const body=p.p_action==='create'?p.p_payload.description:p.p_payload.body;if(body)tables.support_ticket_messages.push({id:tables.support_ticket_messages.length+1,ticket_id:ticket.id,sender_role:p.p_action==='update'?'admin':'user',body,created_at:now});if(p.p_action==='update'){ticket.status=p.p_payload.status;ticket.priority=p.p_payload.priority;}if(p.p_action==='reply'&&ticket.status==='waiting_user')ticket.status='open';return res.end(JSON.stringify(ticket.id));}return res.end('null');}
  let rows=table==='account_entitlements'?tables.profiles.map(p=>({user_id:p.id,plan_name:p.plan_name,exercise_limit:p.plan_name==='enterprise'?-1:p.plan_name==='free'?20:p.plan_name==='starter'?200:1000,exam_limit:p.plan_name==='enterprise'?-1:p.plan_name==='free'?1:p.plan_name==='starter'?10:50,project_limit:p.plan_name==='enterprise'?-1:p.plan_name==='free'?0:p.plan_name==='starter'?5:20,ai_query_limit:p.plan_name==='pro'?100:0,usage:{exercises:0,exams:0,projects:0,ai_queries:0}})):tables[table]??[];const actor=allSessions.find(s=>req.headers.authorization==='Bearer '+s.access_token)?.user;const allowed=scope[Number(actor?.id.slice(-12))]??[];if(table==='organizations'&&!allowed.length)rows=[];if(['organization_memberships','learning_assignments','learning_evidence','learning_errors'].includes(table))rows=rows.filter(r=>allowed.includes(Number(r.user_id.slice(-12))));for(const [key,value]of url.searchParams){if(value.startsWith('eq.'))rows=rows.filter(r=>!(key in r)||String(r[key])===value.slice(3));if(value.startsWith('neq.'))rows=rows.filter(r=>!(key in r)||String(r[key])!==value.slice(4));}

  if(req.method==='PATCH' && table==='profiles'){let raw='';for await(const c of req)raw+=c;const data=JSON.parse(raw);assert.equal(url.searchParams.get('id'),'eq.'+id);assert.deepEqual(Object.keys(data).sort(),['avatar_version','updated_at']);Object.assign(tables.profiles[0],data);return res.end('null');}
  if(req.method==='POST'){if(table==='user_preferences'){let body='';for await(const chunk of req)body+=chunk;const preference=JSON.parse(body);tables.user_preferences=[...(tables.user_preferences??[]).filter(p=>p.user_id!==preference.user_id),preference];}res.writeHead(201);return res.end('null');}
  if(req.headers.accept?.includes('vnd.pgrst.object'))return res.end(JSON.stringify(rows[0]??null));
  return res.end(JSON.stringify(rows));
 }
 res.writeHead(404);res.end('{}');
});await new Promise(resolve=>database.listen(5456,'127.0.0.1',resolve));
const logs=[];const env={...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:dbOrigin,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'validation-placeholder',SUPABASE_SECRET_KEY:'validation-placeholder',NEXT_PUBLIC_APP_URL:origin,CODEZERO_ENVIRONMENT:'sandbox',CODEZERO_WORKSPACE_SANDBOX:'1',CODEZERO_SANDBOX_PROJECT_REF:'local'};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next',process.env.CODEZERO_REVIEW_BUILT==='1'?'start':'dev','-H','127.0.0.1','-p','3256'],{env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',x=>logs.push(String(x)));server.stderr.on('data',x=>logs.push(String(x)));
let browser;
try{
 for(let i=0;i<120;i++){try{if((await fetch(origin+'/login')).ok)break;}catch{}await pause(250);if(i===119)throw Error('Local server unavailable');}
 const engine=process.env.CODEZERO_BROWSER_ENGINE??'chromium';
 browser=await ({chromium,firefox,webkit}[engine]).launch(engine==='chromium'?{headless:true,executablePath:process.env.CODEZERO_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']}:engine==='firefox'?{headless:true,timeout:30000,env:{...process.env,MOZ_DISABLE_CONTENT_SANDBOX:'1'},firefoxUserPrefs:{'security.sandbox.content.level':0}}:{headless:true,timeout:30000});
 const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',page.url(),e.stack);});const pending=new Set();page.on('request',r=>pending.add(r.url()));page.on('requestfinished',r=>pending.delete(r.url()));page.on('requestfailed',r=>pending.delete(r.url()));const navigate=page.goto.bind(page);page.goto=async(...args)=>{const result=await navigate(...args);if(result)assert.ok(result.status()<400,'navigation response '+args[0]+' '+result.status());try{await page.waitForLoadState('networkidle');}catch(e){console.error('UNFINISHED REQUESTS',args[0],[...pending]);throw e;}return result;};
 const reload=page.reload.bind(page);page.reload=async(...args)=>{await page.waitForLoadState('networkidle');const result=await reload(...args);try{await page.waitForLoadState('networkidle');}catch(e){console.error('UNFINISHED REQUESTS',args[0],[...pending]);throw e;}return result;};
 const authCookie=s=>({name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(s)).toString('base64url'),url:origin});
 if(process.env.CODEZERO_ACTIVATION_DIAGNOSTIC==='1'){user.user_metadata.locale='fr';await context.addCookies([authCookie(session)]);await page.goto(origin+'/dashboard');assert.ok(activationReturns>0,'activation reached server RPC');console.log('PASS isolated activation dashboard and server RPC');}
 if(process.env.CODEZERO_BRAND_SEATS_ONLY!=='1'){
 const expected={es:['es-MX','Mi cuenta','Saltar al contenido'],en:['en','My account','Skip to content'],pt:['pt-BR','Minha conta','Ir para o conteúdo'],fr:['fr','Mon compte','Aller au contenu']};
 for(const locale of ['es','en','pt','fr']){
  await page.goto(origin+'/login');await page.locator('#codezero-language').selectOption(locale);await page.waitForFunction(lang=>document.documentElement.lang===lang,expected[locale][0]);await page.reload();assert.equal(await page.locator('#codezero-language').inputValue(),locale);assert.equal(await page.locator('.skip-link').innerText(),expected[locale][2]);
  const invalid=await context.request.post(origin+'/api/locale',{headers:{origin},data:{locale:'de'}});assert.equal(invalid.status(),400);const hostile=await context.request.post(origin+'/api/locale',{headers:{origin:'https://example.invalid'},data:{locale:'en'}});assert.equal(hostile.status(),403);
  const title=await page.title();if(locale!=='es')assert.ok(!title.includes('Entrar o crear cuenta'));
  await page.goto(origin+'/pricing');assert.equal(await page.locator('#codezero-language').inputValue(),locale);assert.equal(await page.locator('.public-plans article').count(),3);assert.ok((await page.locator('.public-plans').innerText()).includes('249'));
  await page.goto(origin+'/about');assert.equal(await page.locator('h1').count(),1);assert.ok((await page.locator('main').innerText()).includes('Isaac López García'));assert.ok((await page.locator('main').innerText()).includes('CodeZero'),'historical name is retained');
  await page.goto(origin+'/faq');assert.equal(await page.locator('#codezero-language').inputValue(),locale);
  await page.goto(origin+'/terms');assert.equal(await page.locator('#codezero-language').inputValue(),locale);
  console.log('PASS visitor selection, reload, navigation, pricing, legal copy and metadata',locale);
 }
 await page.goto(origin+'/login');await page.locator('#codezero-language').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');await page.locator('input[name=email]').fill('synthetic@codezero.example.test');await page.locator('input[name=password]').fill('short');await page.locator('form button[type=submit]').click();assert.ok((await page.locator('#password-error').innerText()).includes('8'));assert.ok(!(await page.locator('#password-error').innerText()).includes('contraseña'));console.log('PASS interactive validation messages in chosen language');
 await page.addScriptTag({path:'sandbox-runtime/node_modules/axe-core/axe.min.js'});for(const [mode,colors]of Object.entries({light:['#2346d8','#09634d','#7133ae','#983d12'],dark:['#a5b4fc','#6ee7b7','#d8b4fe','#fdba74']})){for(const accent of colors){await page.evaluate(({mode,accent})=>{const r=document.documentElement;r.dataset.appearance=mode;r.style.setProperty('--user-accent',accent);r.style.setProperty('--user-accent-foreground',mode==='dark'?'#101828':'#fff');},{mode,accent});await page.waitForTimeout(200);const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[],'invalid login form '+mode+' '+accent);}}assert.equal(await page.locator('#password').getAttribute('aria-invalid'),'true');assert.ok((await page.locator('#password').getAttribute('aria-describedby')).includes('password-error'));console.log('PASS invalid-form semantics and contrast for all four accents in light/dark');

 await context.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),url:origin}]);
 await page.goto('about:blank');authReads=0;await context.request.get(origin+'/profile');console.log('MEASURE Auth reads for one profile HTTP render',authReads);assert.equal(authReads,1,'locale and profile must share verified Auth for one render');await page.goto(origin+'/profile');
 // Complete custom palette + profile photo journey through real handlers and fixture storage.
 await page.locator('#codezero-language').selectOption('es');await page.waitForFunction(()=>document.documentElement.lang==='es-MX');
 assert.equal(await page.locator('.vivo-position').count(),0,'plan card is absent above navigation');
 assert.equal(await page.locator('.vivo-account small').innerText(),'Free');
 await page.locator('.appearance-palette summary').click();
 await page.getByLabel('Bordes',{exact:true}).fill('#123456');
 await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--vivo-border').trim()==='#123456');
 assert.equal(await page.locator('main .card').first().evaluate(el=>getComputedStyle(el).borderTopColor),'rgb(18, 52, 86)');
 await page.getByRole('button',{name:'Guardar colores',exact:true}).click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('codezero.appearance.v1:account:00000000-0000-4000-8000-000000000001'))?.colors?.light?.border==='#123456');
 await page.reload();await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--vivo-border').trim()==='#123456');
 await page.locator('.appearance-palette summary').click();
 await page.getByLabel('Fondo de la plataforma',{exact:true}).fill('#ffffff');await page.getByLabel('Texto principal',{exact:true}).fill('#ffffff');
 assert.ok((await page.locator('.appearance-palette [role=status]').innerText()).includes('Contraste bajo'));
 await page.getByRole('button',{name:'Descartar cambios',exact:true}).click();
 await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--vivo-bg').trim()!=='#ffffff');
 await page.locator('#palette-mode').selectOption('dark');await page.getByLabel('Selección de texto',{exact:true}).fill('#13579b');
 await page.getByRole('button',{name:'Guardar colores',exact:true}).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('codezero.appearance.v1:account:00000000-0000-4000-8000-000000000001'))?.colors?.dark?.selection==='#13579b');
 await page.reload();await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--vivo-selection').trim()==='#13579b');
 await page.locator('input[name="appearance-mode"][value="light"]').click();await page.waitForFunction(()=>document.documentElement.dataset.appearance==='light');
 // Generate a valid fixture rather than depending on a remote user image.
 const sharp=(await import('sharp')).default;const validPhoto=await sharp({create:{width:20,height:20,channels:3,background:'#112233'}}).png().toBuffer();
 await page.locator('#profile-photo').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:validPhoto});
 await page.getByRole('button',{name:'Subir foto',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.vivo-account .vivo-avatar img')?.naturalWidth>0);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('garciloga-profile-photo',{detail:{userId:'00000000-0000-4000-8000-000000000002',version:null}})));
 assert.equal(await page.locator('.vivo-account .vivo-avatar img').count(),1,'photo events are scoped to the current account');
 const fetched=await context.request.get(origin+'/api/profile/photo');assert.equal(fetched.status(),200);assert.equal(fetched.headers()['content-type'],'image/webp');
 await page.reload();await page.waitForFunction(()=>document.querySelector('.vivo-account .vivo-avatar img')?.naturalWidth>0);
 await page.getByRole('button',{name:'Eliminar foto',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.vivo-account .vivo-avatar img'));
 assert.equal((await context.request.get(origin+'/api/profile/photo')).status(),404);
 assert.equal((await context.request.post(origin+'/api/profile/photo',{headers:{origin:'https://invalid.example.test'}})).status(),403);
 assert.equal((await context.request.post(origin+'/api/preferences',{headers:{origin},data:{mode:'light',accent:'blue',colors:{light:{border:'url(x)'}}}})).status(),400);
 await page.getByRole('button',{name:'Restablecer apariencia',exact:true}).click();await page.waitForFunction(()=>document.documentElement.dataset.customPalette==='false');
 console.log('PASS custom palette preview/save/reload/discard/reset/contrast and own photo upload/read/reload/delete/origin');
assert.equal(await page.locator('h1').innerText(),'Mi cuenta');await page.locator('#codezero-language').selectOption('fr');await page.waitForFunction(()=>document.documentElement.lang==='fr');await page.reload();assert.equal(await page.locator('h1').innerText(),'Mon compte');assert.equal(user.user_metadata.locale,'fr');assert.equal(tables.profiles[0].role,'student');assert.equal(tables.profiles[0].plan_name,'free');assert.equal(await page.locator('input[name=full_name]').inputValue(),'Nom de test');console.log('PASS authenticated preference persistence; name, role and plan unchanged');
 // Appearance regression: wait for the controlled inputs to finish their asynchronous API save.
 async function chooseAppearance(name,value){await page.locator(`input[name="${name}"][value="${value}"]`).click();await page.waitForFunction(({name,value})=>{const input=document.querySelector(`input[name="${name}"][value="${value}"]`);return input.checked&&!input.matches(':disabled');},{name,value});}
 assert.equal(await page.locator('.vivo-content #codezero-language').count(),1);
 // Font reflow and Firefox scroll restoration can leave a subpixel sticky offset.
 await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);});
 assert.ok(Math.abs(await page.locator('.vivo-sidebar').evaluate(x=>x.getBoundingClientRect().top))<2,'sidebar starts at viewport top without a toolbar strip');
 for(const [mode,bg] of [['dark','rgb(24, 20, 35)'],['light','rgb(243, 235, 221)']]) {
  await chooseAppearance('appearance-mode',mode);
  await page.waitForFunction(({mode,bg})=>document.documentElement.dataset.appearance===mode&&getComputedStyle(document.body).backgroundColor===bg,{mode,bg});
  for(const [accent,color] of Object.entries(mode==='dark'?{blue:'rgb(165, 180, 252)',green:'rgb(110, 231, 183)',purple:'rgb(216, 180, 254)',orange:'rgb(253, 186, 116)'}:{blue:'rgb(35, 70, 216)',green:'rgb(9, 99, 77)',purple:'rgb(113, 51, 174)',orange:'rgb(152, 61, 18)'})) {
   await chooseAppearance('appearance-accent',accent);
   await page.waitForFunction(color=>getComputedStyle(document.querySelector('.appearance-settings .pill')).color===color,color);
  }
 }
 await chooseAppearance('appearance-mode','dark');
 await chooseAppearance('appearance-accent','green');
 await page.reload();await page.waitForFunction(()=>document.querySelector('input[name="appearance-mode"][value="dark"]').checked&&document.querySelector('input[name="appearance-accent"][value="green"]').checked&&document.documentElement.dataset.appearance==='dark');assert.equal(await page.locator('input[name="appearance-mode"][value="dark"]').isChecked(),true);assert.equal(await page.locator('input[name="appearance-accent"][value="green"]').isChecked(),true);assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(24, 20, 35)');
 await chooseAppearance('appearance-mode','system');
 await page.emulateMedia({colorScheme:'light'});await page.waitForFunction(()=>document.documentElement.dataset.appearance==='light');
 await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.appearance==='dark');
 await page.emulateMedia({colorScheme:'light'});
 await chooseAppearance('appearance-mode','light');await chooseAppearance('appearance-accent','blue');
 console.log('PASS real appearance controls: both modes, all accents, persistence and device preference; no top strip');
 await page.goto(origin+'/learn/1/fixture-lesson');assert.equal((await page.locator('form[action="/api/exercises/submit"] input[type=radio]').first().getAttribute('value')),'A');assert.equal(await page.locator('input[name=lesson_slug]').first().inputValue(),'fixture-lesson');assert.ok(!(await page.locator('article').first().innerText()).includes(curriculum.lessons[0].content.slice(0,100)));console.log('PASS lesson translation with exact original submitted identifiers and answer values');
 await page.goto(origin+'/learn/1/exam');assert.equal(await page.locator('form[action="/api/exams/submit"]').count(),1);assert.equal(await page.locator('input[name=sitting_id]').count(),1);console.log('PASS translated exam renders persisted sitting and unchanged submission contract');
 await page.goto(origin+'/help?q=certificat');assert.ok(await page.locator('details').count()>0);console.log('PASS help search in French matches translated FAQ');
 await page.goto(origin+'/help/tickets');await page.locator('#ticket-subject').fill('Fictional support case');await page.locator('#ticket-description').fill('A fictional browser validation case without personal data.');await page.locator('form[action="/api/support/tickets"] button').click();await page.waitForURL(/tickets\/1/);assert.equal(await page.locator('h1').innerText(),'Fictional support case');assert.equal(tables.support_ticket_messages.length,1);
 const operator=await browser.newContext();await operator.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(ownerSession)).toString('base64url'),url:origin}]);let response=await operator.request.post(origin+'/api/admin/support/tickets/update',{headers:{origin},form:{ticket_id:'1',status:'waiting_user',priority:'normal',reply:'Fictional operator response'},maxRedirects:0});assert.equal(response.status(),303);await page.reload();assert.ok((await page.locator('main').innerText()).includes('Fictional operator response'));await page.locator('#reply-body').fill('Fictional learner follow-up');await page.locator('form button').click();await page.waitForURL(/reply=1/);assert.equal(tables.support_tickets[0].status,'open');
 for(const status of ['resolved','closed']){response=await operator.request.post(origin+'/api/admin/support/tickets/update',{headers:{origin},form:{ticket_id:'1',status,priority:'normal',reply:''},maxRedirects:0});assert.equal(response.status(),303);}await operator.close();await page.reload();assert.equal(await page.locator('#reply-body').count(),0);assert.equal(tables.support_ticket_messages.length,3);console.log('PASS browser create, actual operator handler, learner reply, resolve and close (RPC fixture; transaction tested separately)');
 await context.clearCookies();await context.addCookies([authCookie(secondSession),{name:'codezero_locale',value:'fr',url:origin}]);await page.goto(origin+'/profile');assert.equal(await page.locator('#codezero-language').inputValue(),'pt');assert.equal((await context.request.get(origin+'/help/tickets/1')).status(),404);await page.locator('#codezero-language').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');assert.equal(secondUser.user_metadata.locale,'en');assert.equal(user.user_metadata.locale,'fr');
 await context.clearCookies();await context.addCookies([authCookie(session),{name:'codezero_locale',value:'en',url:origin}]);await page.goto(origin+'/profile');assert.equal(await page.locator('#codezero-language').inputValue(),'fr');
 const newSession=await browser.newContext();await newSession.addCookies([authCookie(secondSession)]);const newPage=await newSession.newPage();await newPage.goto(origin+'/profile');assert.equal(await newPage.locator('#codezero-language').inputValue(),'en');await newSession.close();console.log('PASS two accounts, conflicting visitor cookie and fresh-session isolation');
 for(const path of ['/profile','/help','/help/tickets','/learn/1/fixture-lesson']) {await page.goto(origin+path);await page.addScriptTag({path:'sandbox-runtime/node_modules/axe-core/axe.min.js'});await page.locator('details').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));for(const appearance of ['light','dark']) {await page.evaluate(mode=>{const r=document.documentElement;r.dataset.appearance=mode;r.style.setProperty('--user-accent',mode==='dark'?'#a5b4fc':'#2346d8');r.style.setProperty('--user-accent-foreground',mode==='dark'?'#101828':'#fff');},appearance);const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[],path+' '+appearance);}console.log('PASS axe light/dark',path);}
 await context.clearCookies();await context.addCookies([{name:'codezero_locale',value:'fr',url:origin}]);await page.goto(origin+'/login');await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await page.locator('.public-header #codezero-language').count(),1);assert.equal(await page.locator('.public-header').evaluate(x=>x.getBoundingClientRect().top),0);const menu=page.locator('.public-mobile-menu');await menu.locator('summary').click();await menu.locator('summary').press('Escape');assert.equal(await menu.evaluate(x=>x.open),false);assert.equal(await menu.locator('summary').evaluate(x=>x===document.activeElement),true);await page.screenshot({path:'/tmp/codezero-french-mobile.png',fullPage:true});console.log('PASS mobile layout, Escape and focus in French');
 for (const width of [320,768,1440]) {await page.setViewportSize({width,height:900});await page.goto(origin+'/login');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 await page.setViewportSize({width:1280,height:900});
 for(const zoom of [2,4]) {await page.evaluate(z=>document.body.style.zoom=String(z),zoom);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 await page.evaluate(()=>document.body.style.zoom='1');
 await page.goto('about:blank');await page.goto(origin+'/login');await page.keyboard.press('Tab');assert.equal(await page.locator('.skip-link').evaluate(x=>x===document.activeElement),true);await page.keyboard.press('Enter');assert.equal(await page.locator('#main-content').evaluate(x=>x===document.activeElement),true);console.log('PASS keyboard skip target and focus');
 // Design and authorization acceptance checks, using the exact eight-person fixture above.
 for(const plan of ['free','starter','pro']){
 tables.profiles[0].plan_name=plan;await context.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),domain:'localhost',path:'/'}]);await page.goto(origin+'/teams');assert.equal(new URL(page.url()).pathname,'/teams');assert.equal(await page.locator('main a[href^="/teams/"]').count(),0,'unaffiliated company directory has no member links');await page.goto(origin+'/dashboard');assert.ok(activationReturns>0,'activation reached server RPC');assert.equal(await page.locator('.vivo-sidebar').count(),1);assert.ok((await page.locator('h1').innerText()).includes(tables.profiles[0].full_name));assert.equal(await page.locator('.vivo-sidebar nav section').count(),2);assert.equal(await page.locator('.vivo-sidebar a[href$="/tasks"]').count(),0);await page.goto(origin+`/teams/${orgId}/people`);assert.equal(new URL(page.url()).pathname,'/dashboard');const r=await context.request.get(origin+`/api/teams/${orgId}/people`);assert.equal(r.status(),403);console.log('PASS unaffiliated plan sidebar and URL/API denial',plan);
 }
 for(const n of [4,5,6,7,8,9,10,11]){
 const sess=allSessions.find(s=>s.user.id===actorId(n));await context.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(sess)).toString('base64url'),domain:'localhost',path:'/'}]);await page.goto(origin+'/dashboard');assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(243, 235, 221)');assert.ok((await page.evaluate(()=>getComputedStyle(document.body).fontFamily)).includes('Inter'));assert.ok((await page.locator('h1').evaluate(h=>getComputedStyle(h).fontFamily)).includes('Söhne'));const member=orgMembers.find(m=>m.user_id===actorId(n));assert.equal(await page.locator('.vivo-sidebar nav section').count(),['owner','admin'].includes(member.role)?4:member.role==='learner'?2:3);assert.equal(await page.locator(`.vivo-sidebar a[href$="/billing"]`).count(),member.role==='owner'?1:0);assert.equal(await page.locator('.vivo-sidebar a[href$="/tasks"]').count(),1);
 if(member.role!=='learner'){assert.equal(await page.locator('.vivo-person-grid .vivo-person').count(),scope[n].length-1);const r=await context.request.get(origin+`/api/teams/${orgId}/people`);assert.equal(r.status(),200);const body=await r.json();assert.deepEqual(body.people.map(p=>p.user_id).sort(),scope[n].map(actorId).sort());await page.addScriptTag({path:'sandbox-runtime/node_modules/axe-core/axe.min.js'});const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[],'team '+member.role);}
 if(n===4&&engine==='chromium')await page.screenshot({path:'/tmp/codezero-vivo-owner-desktop.png',fullPage:true});
 if(!['owner','admin'].includes(member.role)){await page.goto(origin+`/teams/${orgId}/permissions`);assert.ok(!new URL(page.url()).pathname.endsWith('/permissions'));}
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/dashboard');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);if(n===8&&engine==='chromium')await page.screenshot({path:'/tmp/codezero-vivo-supervisor-mobile.png',fullPage:true});await page.setViewportSize({width:1280,height:900});console.log('PASS role menus, scoped people, API and 390px',member.role,n);
 }
 const suspended=orgMembers.find(m=>m.user_id===actorId(9));suspended.active=false;await context.addCookies([authCookie(allSessions.find(s=>s.user.id===actorId(4)))]);await page.goto(origin+`/teams/${orgId}/permissions`);const suspendedForm=page.locator('form').filter({has:page.locator(`input[name=user_id][value="${actorId(9)}"]`)});assert.equal(await suspendedForm.count(),1);assert.equal(await suspendedForm.locator('input[name=active]').isChecked(),false);assert.equal(await page.locator('form input[name=user_id]').count(),8);suspended.active=true;console.log('PASS administrator can find and reactivate a suspended member without exposing learning data');
 await context.clearCookies();await page.goto(origin+'/login');
 // Accessibility semantics, contrast and forms; this is not a physical screen reader test.
 await page.addScriptTag({path:'sandbox-runtime/node_modules/axe-core/axe.min.js'});
 const violations=await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.map(n=>n.target)})));
 assert.deepEqual(violations,[]);console.log('PASS 320/768/1440 widths, 200%/400% CSS zoom, axe WCAG checks',engine);
 const social=await context.request.get(origin+'/social/codezero?lang=fr');assert.equal(social.status(),200);assert.match(social.headers()['content-type'],/image\/png/);console.log('PASS Vivo social image and fonts');
 if(engine==='chromium'){const brandSocial=await context.request.get(origin+'/social/codezero?lang=es');assert.equal(brandSocial.status(),200);fs.writeFileSync('/tmp/garciloga-social-check.png',await brandSocial.body());}
 await context.clearCookies();await context.addCookies([{name:'codezero_locale',value:'es',url:origin}]);
 for(const route of ['/','/pricing','/roadmap','/privacy','/companies']) {
  await page.goto(origin+route);assert.equal(await page.locator('#codezero-language').count(),1);await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,route+' mobile '+JSON.stringify(await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,80),right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).slice(0,12))));
  assert.equal((await page.locator('body').innerText()).includes('CodeZero'),false,route+' old brand');
  assert.ok((await page.title()).includes('Garciloga'));
  if(engine==='chromium'&&['/privacy','/companies'].includes(route)){await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'/tmp/garciloga-'+route.slice(1)+'-check.png',fullPage:true});await page.setViewportSize({width:390,height:844});}
  await page.addScriptTag({path:'sandbox-runtime/node_modules/axe-core/axe.min.js'});
  for(const appearance of ['light','dark']) {
   await page.evaluate(mode=>{const r=document.documentElement;r.dataset.appearance=mode;r.style.setProperty('--user-accent',mode==='dark'?'#a5b4fc':'#2346d8');r.style.setProperty('--user-accent-foreground',mode==='dark'?'#101828':'#fff');},appearance);
   const violations=await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
   assert.deepEqual(violations,[],route+' WCAG '+appearance);
  }
 }
 await page.goto(origin+'/pricing');const priceText=await page.locator('main').innerText();assert.ok(priceText.includes('699'));assert.ok(priceText.includes('249'));
 await page.goto(origin+'/roadmap');assert.ok((await page.locator('main').innerText()).includes('Comunicador Enterprise'));assert.equal(await page.locator('a[href*=checkout]').count(),0);
 await page.goto(origin+'/leadership');assert.equal(new URL(page.url()).pathname,'/login');
 await context.addCookies([authCookie(session)]);await page.goto(origin+'/leadership');assert.equal(await page.locator('main details').count(),4);await page.locator('main details').first().locator('summary').click();assert.equal(await page.locator('main details').first().evaluate(d=>d.open),true);
 console.log('PASS Garciloga public branding, commercial references, roadmap readiness, leadership access, 390px and WCAG',engine);
 }
 // End the previous document before replacing Auth cookies in this fixture.
 await page.goto('about:blank');await context.clearCookies();
 for(const locale of ['es','en','pt','fr']){await page.goto('about:blank');await context.request.post(origin+'/api/locale',{headers:{origin},data:{locale}});await page.goto(origin+'/about');assert.ok((await page.locator('main').innerText()).includes('CodeZero'),'historical name '+locale);}
 await page.goto('about:blank');await context.addCookies([authCookie(ownerSession)]);await page.goto(origin+'/admin');
 assert.equal(await page.locator('.owner-user-form').count(),1);assert.equal(await page.locator('input[name=user_id][value="'+ownerUser.id+'"]').count(),0);
 await page.setViewportSize({width:320,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'owner administration mobile');
 await page.goto('about:blank');await context.addCookies([authCookie(session)]);await page.goto(origin+'/teams/seats');
 assert.equal((await context.request.post(origin+'/api/admin/users/create',{headers:{origin},form:{email:'test@example.test',full_name:'Test User',plan_name:'free'}})).status(),403);
 assert.equal((await context.request.post(origin+'/api/stripe/seats',{headers:{origin:'https://example.invalid'}})).status(),403);
 assert.equal(await page.locator('input[name=seats]').getAttribute('min'),'5');
 assert.equal(await page.locator('input[name=permissions_acknowledged]').getAttribute('required'),'');
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});for(const route of ['/teams/seats','/about','/pricing']){await page.goto(origin+route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,route+' '+width+' '+JSON.stringify(await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth}))));}}
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(origin+'/teams/seats');assert.equal(await page.locator('main').evaluate(el=>getComputedStyle(el).animationName),'none');
 console.log('PASS institutional content, minimum five seats, consent, mobile widths and reduced motion');
 assert.deepEqual(errors,[]);console.log('Browser localization checks passed (synthetic local Auth/PostgREST fixtures only).');
}catch(error){console.error(logs.slice(-10).join('\n'));throw error;}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>database.close(resolve));}


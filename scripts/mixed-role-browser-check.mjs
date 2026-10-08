// Real Next handlers and browser rendering; Auth and REST use synthetic fixtures.
// Database permissions/transactions are checked separately against PostgreSQL.
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {setTimeout as pause} from 'node:timers/promises';
const {chromium,firefox,webkit}=await import(process.env.CODEZERO_PLAYWRIGHT_MODULE??'../sandbox-runtime/node_modules/playwright/index.mjs');
import {TRAINING_ACTIVITIES,findTrainingActivity} from '../lib/role-training-content.ts';
import {DEFAULT_JOB_PROFILES} from '../lib/competency-matrix.ts';
const appPort=Number(process.env.CODEZERO_MIXED_TEST_PORT??3280),dbPort=Number(process.env.CODEZERO_MIXED_TEST_DB_PORT??5480);
const origin='http://localhost:'+appPort,dbOrigin='http://127.0.0.1:'+dbPort;
const runtimeOrigin=process.env.CODEZERO_MIXED_TEST_RUNTIME_ORIGIN??'http://127.0.0.1:3041';
const engine={chromium,firefox,webkit}[process.env.CODEZERO_BROWSER_ENGINE??'chromium'];

import {PROFESSIONAL_ACTIVITIES} from '../lib/professional-route-content.ts';
import {MIXED_UNITS} from '../lib/mixed-role-content.ts';
import {TOOL_FIELDS} from '../lib/mixed-role-scenarios.ts';
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');const org=id(100);
const users=[1,2,3,4].map(n=>({id:id(n),email:`synthetic${n}@codezero.example.test`,aud:'authenticated',role:'authenticated',email_confirmed_at:new Date().toISOString(),user_metadata:{full_name:'Synthetic '+n,locale:'es'},app_metadata:{provider:'email'}}));
const sessions=users.map(user=>{const claims={sub:user.id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)};const access_token=[{alg:'HS256',typ:'JWT'},claims].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.')+'.synthetic-fixture-signature';return {access_token,refresh_token:'synthetic-refresh',token_type:'bearer',expires_in:3600,expires_at:claims.exp,user};});
const members=[{organization_id:org,user_id:id(1),display_name:'Manager ficticio',role:'manager',active:true,reports_to:null,job_title:'Customer Success',learning_position_key:'customer_success'}, {organization_id:org,user_id:id(2),display_name:'Colaborador ficticio',role:'learner',active:true,reports_to:id(1),job_title:'Customer Success',learning_position_key:'customer_success'}];
const tables={profiles:users.map((u,i)=>({...u,full_name:u.user_metadata.full_name,status:'active',role:i===2?'owner':'student',plan_name:'enterprise',learning_position_key:'customer_success'})),organizations:[{id:org,name:'Sandbox ficticio',active:true}],organization_memberships:members,learning_activity_catalog:[...TRAINING_ACTIVITIES,...PROFESSIONAL_ACTIVITIES].map((a,i)=>({id:i+1,content_key:a.key,title:a.title,kind:a.kind,competencies:a.competencies,route_key:a.route,active:true})),learning_job_profiles:DEFAULT_JOB_PROFILES,learning_mixed_release:[{id:true,enabled:true}],learning_mixed_submission_steps:[],learning_evidence_history:[],learning_practice_submissions:[],learning_assignments:[],learning_evidence:[],learning_errors:[],learning_project_review_flows:[],learning_project_review_runs:[],learning_project_review_votes:[]};
const rpcCalls=[];let sequence=0;
const history=(s,a,props)=>({id:id(2000+sequence++),submission_id:s.id,user_id:s.user_id,organization_id:s.organization_id,activity_key:a.content_key,independent_key:a.content_key,kind:a.kind,competency_scores:s.self_scores,assistance:s.assistance,review_source:'self',observed_at:new Date().toISOString(),reevaluation_of:null,critical_errors:[],feedback:null,...props});
const database=http.createServer(async(req,res)=>{
 const url=new URL(req.url,dbOrigin);res.setHeader('Content-Type','application/json');
 const actor=sessions.find(s=>req.headers.authorization==='Bearer '+s.access_token)?.user;
 if(url.pathname==='/auth/v1/user'){res.writeHead(actor?200:401);return res.end(JSON.stringify(actor??{message:'Synthetic Auth denial'}));}
 if(!url.pathname.startsWith('/rest/v1/')){res.writeHead(404);return res.end('{}');}
 const table=url.pathname.split('/').pop();
 if(url.pathname.includes('/rpc/')){
  let raw='';for await(const chunk of req)raw+=chunk;const p=JSON.parse(raw||'{}');rpcCalls.push({name:table,p});
  if(table==='consume_api_rate_limit')return res.end(JSON.stringify({allowed:true,count:1,retry_after_seconds:0}));
  if(table==='workspace_directory')return res.end(JSON.stringify(members));
  if(table==='workspace_current_levels')return res.end(JSON.stringify(members.map(m=>({user_id:m.user_id,current_level:1}))));
  if(table==='submit_mixed_training'){
   if(p.p_org&&p.p_org!==org){res.writeHead(403);return res.end('{}');}
   const step=MIXED_UNITS.flatMap(u=>u.steps).find(s=>s.key===p.p_step);
   if(!tables.learning_practice_submissions.some(s=>s.id===p.p_request)){
    const a=tables.learning_activity_catalog.find(a=>a.content_key===step.sourceKey);
    const submission={id:p.p_request,user_id:p.p_actor,organization_id:p.p_org,activity_id:a.id,draft:p.p_draft,self_scores:p.p_scores,assistance:p.p_assistance,created_at:new Date().toISOString()};
    tables.learning_practice_submissions.push(submission);tables.learning_mixed_submission_steps.push({submission_id:submission.id,step_key:step.key,payload:p.p_payload,learning_practice_submissions:submission});
   }return res.end(JSON.stringify(p.p_request));
  }
  if(table==='submit_training_practice'){
   const a=tables.learning_activity_catalog.find(a=>a.id===p.p_activity),prior=tables.learning_practice_submissions.find(s=>s.id===p.p_request);
   if(!prior){const s={id:p.p_request,user_id:p.p_actor,organization_id:p.p_org,activity_id:p.p_activity,draft:p.p_draft,self_scores:p.p_scores,assistance:p.p_assistance,created_at:new Date().toISOString()};tables.learning_practice_submissions.push(s);
    p.p_auto_results.forEach((v,i)=>tables.learning_evidence_history.push(history(s,a,{independent_key:a.content_key+':decision:'+(i+1),kind:'exercise',competency_scores:{[a.competencies[i%a.competencies.length]]:v},review_source:'auto',assistance:'recognition'})));
    if(a.kind!=='exercise')tables.learning_evidence_history.push(history(s,a,{}));
    if(a.kind==='project'&&tables.learning_project_review_flows.length){const f=tables.learning_project_review_flows.at(-1);tables.learning_project_review_runs.push({submission_id:s.id,organization_id:s.organization_id,learner_id:s.user_id,authorizer_id:f.created_by,state:'pending',current_stage:0,created_at:new Date().toISOString(),snapshot:f.stages.map(step=>({...step,reviewers:[{id:id(1),name:'Manager ficticio',role:'manager'}]})),progress:{}});}
   }
   return res.end(JSON.stringify(p.p_request));
  }
  if(table==='review_training_practice'){
   const s=tables.learning_practice_submissions.find(s=>s.id===p.p_submission),a=tables.learning_activity_catalog.find(a=>a.id===s.activity_id);
   const role=tables.profiles.find(u=>u.id===p.p_actor)?.role;
   if(role!=='owner'&&(p.p_actor!==id(1)||s.user_id!==id(2)||!['deliverable','project'].includes(a.kind))){res.writeHead(403);return res.end(JSON.stringify({message:'FORBIDDEN'}));}
   const run=tables.learning_project_review_runs.find(r=>r.submission_id===s.id);if(run){if(run.current_stage!==p.p_stage||run.state==='approved'){res.writeHead(409);return res.end(JSON.stringify({message:'STAGE_CONFLICT'}));}const v={id:id(8000+sequence++),submission_id:s.id,stage_index:p.p_stage,user_id:p.p_actor,decision:p.p_decision,feedback:p.p_feedback,observed_at:new Date().toISOString()};tables.learning_project_review_votes.push(v);run.progress[String(p.p_stage)]={approved:1,changes_requested:0};if(run.current_stage<run.snapshot.length-1){run.current_stage++;return res.end(JSON.stringify(v.id));}run.state='approved';}
   const e=history(s,a,{approval_submission_id:run?s.id:null,competency_scores:p.p_scores,assistance:p.p_assistance,review_source:role==='owner'?'admin':'manager',feedback:p.p_feedback,critical_errors:p.p_errors});tables.learning_evidence_history.push(e);return res.end(JSON.stringify(e.id));
  }
  if(table==='assign_training_reinforcement'){
   for(const aId of p.p_activities){const a=tables.learning_activity_catalog.find(a=>a.id===aId);tables.learning_assignments.push({organization_id:org,user_id:p.p_user,activity_id:aId,activity_type:'route_unit',activity_key:'route_unit:'+aId,title:a.title,competency:a.competencies[0],due_at:p.p_due,reinforcement_before:p.p_before,reinforcement_after:null});}return res.end('null');
  }
  if(table==='complete_training_reinforcement'){for(const a of tables.learning_assignments.filter(a=>a.activity_id===p.p_activity&&a.user_id===p.p_user))a.reinforcement_after=p.p_after;return res.end('null');}
  if(table==='save_project_review_flow'){if(p.p_actor!==id(1)){res.writeHead(403);return res.end(JSON.stringify({message:'FORBIDDEN'}));}const flow={id:id(9000+sequence++),flow_key:p.p_key??randomUUID(),version:p.p_version+1,name:p.p_name,enabled:p.p_enabled,priority:p.p_priority,audience:p.p_audience,stages:p.p_stages,organization_id:p.p_org,created_by:p.p_actor};tables.learning_project_review_flows.push(flow);return res.end(JSON.stringify(flow.id));}
  if(table==='set_training_position')return res.end('null');
  if(table==='issue_training_route_diploma'){res.writeHead(400);return res.end(JSON.stringify({message:'DIPLOMA_NOT_ELIGIBLE'}));}
  res.writeHead(400);return res.end(JSON.stringify({message:'Unsupported fixture RPC '+table}));
 }
 let rows=[...(tables[table]??[])];
 if(table==='learning_mixed_submission_steps'&&actor)rows=rows.filter(r=>r.learning_practice_submissions.user_id===actor.id);
 if(actor&&['organization_memberships','learning_assignments','learning_evidence','learning_errors','learning_evidence_history','learning_practice_submissions'].includes(table))rows=rows.filter(r=>actor.id===id(1)?[id(1),id(2)].includes(r.user_id):r.user_id===actor.id);
 if(actor&&table==='organizations'&&![id(1),id(2)].includes(actor.id))rows=[];
 for(const [key,value]of url.searchParams){if(value.startsWith('eq.'))rows=rows.filter(r=>String(key.includes('.')?r[key.split('.')[0]]?.[key.split('.')[1]]:r[key])===value.slice(3));if(value==='is.null')rows=rows.filter(r=>(key.includes('.')?r[key.split('.')[0]]?.[key.split('.')[1]]:r[key])===null);if(value.startsWith('in.'))rows=rows.filter(r=>value.slice(3).slice(1,-1).split(',').includes(String(r[key])));}
 const order=url.searchParams.get('order');if(order){const specs=order.split(',').map(x=>x.split('.'));rows.sort((a,b)=>{for(const [k,d]of specs){const v=String(a[k]??'').localeCompare(String(b[k]??''),undefined,{numeric:true});if(v)return d==='desc'?-v:v;}return 0;});}
 const start=Number(url.searchParams.get('offset')??0),limit=Number(url.searchParams.get('limit')??500);rows=rows.slice(start,start+limit);
 if(req.headers.accept?.includes('vnd.pgrst.object'))return res.end(JSON.stringify(rows[0]??null));return res.end(JSON.stringify(rows));
});await new Promise(r=>database.listen(dbPort,'127.0.0.1',r));
const logs=[];const env={...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:dbOrigin,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic-placeholder',SUPABASE_SECRET_KEY:'validation-placeholder',NEXT_PUBLIC_APP_URL:origin,CODEZERO_ENVIRONMENT:'sandbox',CODEZERO_WORKSPACE_SANDBOX:'1',CODEZERO_ROLE_TRAINING:'1',CODEZERO_MIXED_ROUTES:'1',CODEZERO_PRACTICE_PREVIEW:'1',CODEZERO_CODE_RUNTIME:'1',CODEZERO_CODE_RUNTIME_ORIGIN:runtimeOrigin,CODEZERO_SANDBOX_PROJECT_REF:'local'};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','-H','127.0.0.1','-p',String(appPort)],{env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',x=>logs.push(String(x)));server.stderr.on('data',x=>logs.push(String(x)));let browser;let runtimeServer;let finished=false;
try{
 for(let i=0;i<160;i++){try{if((await fetch(origin+'/login')).ok)break;}catch{}await pause(250);if(i===159)throw Error('Next unavailable');}
 const cookie=n=>'sb-127-auth-token=base64-'+Buffer.from(JSON.stringify(sessions[n-1])).toString('base64url');
 const get=(n,path)=>fetch(origin+path,{headers:{cookie:cookie(n)},redirect:'manual'});
 const post=(n,form,requestOrigin=origin)=>fetch(origin+'/api/role-training/mixed',{method:'POST',headers:{cookie:cookie(n),origin:requestOrigin},body:new URLSearchParams(form),redirect:'manual'});
 const formFor=(step,previous)=>{const a=findTrainingActivity(step.sourceKey);return {step:step.key,request_id:randomUUID(),organization_id:org,previous_submission:previous??'',assistance:'guided',draft:'Entrega ficticia con evidencia verificable, denominador, periodo, límites, responsable y siguiente validación. '.repeat(3),code:['sql','python'].includes(step.format)?(step.format==='sql'?'SELECT 1;':'print(1)'):'',runtime_status:['sql','python'].includes(step.format)?'complete':'',runtime_output:'1',...Object.fromEntries(a.decisions.map((q,i)=>['decision_'+i,String(q.correct)])),...Object.fromEntries(a.competencies.map(k=>['score_'+k,'2'])),...Object.fromEntries((TOOL_FIELDS[step.category??'']??[]).map((label,i)=>['tool_'+i,label+' · dato ficticio']))};};
 assert.equal((await get(4,'/role-training/mixed?organization_id='+org)).status,404);
 assert.equal((await post(2,formFor(MIXED_UNITS[0].steps[0]),'https://invalid.example')).status,403);
 assert.equal((await post(2,formFor(MIXED_UNITS[0].steps[1]))).status,409);
 for(const unit of MIXED_UNITS){let previous=null;
  const landing=await get(2,'/role-training/mixed?unit='+unit.key+'&organization_id='+org);assert.equal(landing.status,200);assert.match(await landing.text(),new RegExp(unit.caseTitle.replace(/[()]/g,'\\$&')));
  for(const step of unit.steps){const form=formFor(step,previous);assert.equal((await post(2,form)).status,303,step.key);previous=form.request_id;
   assert.equal((await post(2,form)).status,303,'idempotent replay');
   const response=await get(2,'/role-training/mixed?unit='+unit.key+'&step='+encodeURIComponent(step.key)+'&organization_id='+org);assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes('Enviar para revisión humana'));if(step!==unit.steps[0])assert.ok(html.includes('Entrega ficticia con evidencia verificable'));
  }
 }
 assert.equal(tables.learning_practice_submissions.length,48);assert.equal(tables.learning_mixed_submission_steps.length,48);assert.equal(tables.learning_evidence_history.length,0,'fixture never represents synthetic execution as human approval');
 const stale=formFor(MIXED_UNITS[0].steps[1],id(999));assert.equal((await post(2,stale)).status,409);
 const technical=formFor(MIXED_UNITS[0].steps[1],tables.learning_mixed_submission_steps[0].submission_id);technical.runtime_status='';assert.equal((await post(2,technical)).status,400);
 const tools=formFor(MIXED_UNITS[0].steps[2],tables.learning_mixed_submission_steps[1].submission_id);tools.tool_0='';assert.equal((await post(2,tools)).status,400);
 console.log('PASS all 48 real HTTP handlers, previous artifacts, replay, scope, origin, runtime attempt and structured tools');
 if(process.env.CODEZERO_HTTP_ONLY!=='1'){
  browser=await engine.launch({headless:true,...(process.env.CODEZERO_BROWSER_EXECUTABLE?{executablePath:process.env.CODEZERO_BROWSER_EXECUTABLE}:{} )});const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(sessions[1])).toString('base64url'),url:origin}]);
  for(const locale of ['es','en','pt','fr']){users[1].user_metadata.locale=locale;for(const unit of MIXED_UNITS){await page.goto(origin+'/role-training/mixed?unit='+unit.key+'&organization_id='+org);await page.waitForLoadState('networkidle');assert.equal(await page.locator('.mixed-step-list>li').count(),8);assert.equal(await page.locator('.mixed-level').count(),4);for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,locale+' '+unit.key+' '+width);}}}
  for(const locale of ['es','en','pt','fr']){
   users[1].user_metadata.locale=locale;
   for(const route of ['/role-training/reinforcements?organization_id='+org,'/employment-kit','/role-training?route=solutions&activity=solutions-project-2&organization_id='+org]){
    const response=await page.goto(origin+route);assert.equal(response.status(),200);await page.waitForLoadState('networkidle');
    if(process.env.CODEZERO_REVIEW_SCREENSHOT&&locale==='es'&&route.startsWith('/role-training/reinforcements'))await page.screenshot({path:process.env.CODEZERO_REVIEW_SCREENSHOT,fullPage:true});
    for(const width of [320,1280]){await page.setViewportSize({width,height:900});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);if(!fits)console.log('OVERFLOW',await page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth&&!e.parentElement?.closest('.vivo-table-scroll')).map(e=>({tag:e.tagName,class:e.className,width:e.getBoundingClientRect().width,text:e.textContent.slice(0,100)})).slice(0,15)));if(!fits)console.log('SCROLLERS',await page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.scrollWidth>e.clientWidth&&e.clientWidth>0).map(e=>({tag:e.tagName,class:e.className,client:e.clientWidth,scroll:e.scrollWidth,overflow:getComputedStyle(e).overflowX,text:e.textContent.slice(0,90)})).slice(0,30)));if(!fits)console.log('TEXT_OVERFLOW',await page.evaluate(()=>{const out=[];const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);for(let n=walk.nextNode();n;n=walk.nextNode()){if(!n.textContent.trim()||n.parentElement.closest('.vivo-table-scroll'))continue;const range=document.createRange();range.selectNodeContents(n);const rect=range.getBoundingClientRect();if(rect.right>innerWidth)out.push({tag:n.parentElement.tagName,text:n.textContent.slice(0,130),right:rect.right});}return out.slice(0,15);}));if(!fits)console.log('GEOMETRY',await page.evaluate(()=>({viewport:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,main:document.querySelector('main')?.getBoundingClientRect().toJSON()})));assert.equal(fits,true,route+' '+locale+' '+width);}
    await page.addScriptTag({path:'sandbox-runtime/node_modules/axe-core/axe.min.js'});
    assert.deepEqual(await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))),[]);
   }
  }
  users[1].user_metadata.locale='es';
  assert.equal((await page.goto(origin+'/role-training/reinforcements?organization_id='+id(999))).status(),404);
  assert.equal((await page.goto(origin+'/internal/career-lab')).status(),404);
  await context.clearCookies();await context.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(sessions[2])).toString('base64url'),url:origin}]);
  assert.equal((await page.goto(origin+'/internal/career-lab')).status(),200);await page.waitForLoadState('networkidle');
  await context.clearCookies();await context.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(sessions[1])).toString('base64url'),url:origin}]);
  console.log('PASS reinforcement, employment and integration pages in four languages; Career owner-only and organization scope');

  for(const index of [0,1,2]){const unit=MIXED_UNITS[0],step=unit.steps[index];await page.goto(origin+'/role-training/mixed?unit='+unit.key+'&step='+encodeURIComponent(step.key)+'&organization_id='+org);await page.waitForLoadState('networkidle');for(const width of [320,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
   await page.addScriptTag({path:'sandbox-runtime/node_modules/axe-core/axe.min.js'});assert.deepEqual(await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))),[]);
  }
  // The editor executes on the existing separate host, with real Pyodide/SQLite workers.
  runtimeServer=spawn(process.execPath,['sandbox-runtime/server.mjs'],{env:{...process.env,CODEZERO_ENVIRONMENT:'sandbox',CODEZERO_RUNTIME_PARENT:origin,CODEZERO_CODE_RUNTIME_ORIGIN:runtimeOrigin},stdio:['ignore','pipe','pipe']});runtimeServer.stderr.on('data',x=>logs.push(String(x)));
  for(let i=0;i<80;i++){try{if((await fetch(runtimeOrigin+'/frame')).ok)break;}catch{}await pause(100);}
  for(const index of [1,4]){const unit=MIXED_UNITS[0],step=unit.steps[index];await page.goto(origin+'/role-training/mixed?unit='+unit.key+'&step='+encodeURIComponent(step.key)+'&organization_id='+org);await page.waitForLoadState('networkidle');const editor=page.locator('.mixed-editor');assert.ok((await editor.locator('textarea').inputValue()).includes('previous'));
   await editor.locator('textarea').fill(step.format==='sql'?'SELECT 1;':'print(1)');await editor.getByRole('button',{name:'Ejecutar código',exact:true}).click();await page.waitForFunction(()=>document.querySelector('input[name=runtime_status]')?.value!=='',{},{timeout:40000});assert.equal(await page.locator('input[name=runtime_status]').inputValue(),'complete');assert.match(await editor.locator('pre').innerText(),/1/);
  }
  console.log('PASS mixed Python/SQL editor → separate origin → actual workers → recorded output');
  const unit=MIXED_UNITS[0],step=unit.steps[2],a=findTrainingActivity(step.sourceKey);await page.goto(origin+'/role-training/mixed?unit='+unit.key+'&step='+encodeURIComponent(step.key)+'&organization_id='+org);await page.waitForLoadState('networkidle');const form=page.locator('form[action="/api/role-training/mixed"]');for(const [i,q]of a.decisions.entries())await form.locator('input[name=decision_'+i+'][value="'+q.correct+'"]').check();for(const [i,label]of TOOL_FIELDS[step.category].entries())await form.locator('textarea[name=tool_'+i+']').fill(label+' · evidencia de navegador');await form.locator('textarea[name=draft]').fill('Entrega de navegador con periodo, responsable, evidencia ficticia y condiciones pendientes de renovación. '.repeat(3));for(const k of a.competencies)await form.locator('select[name=score_'+k+']').selectOption('2');await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),form.getByRole('button',{name:'Enviar para revisión humana'}).click()]);assert.match(page.url(),/result=saved/);assert.equal(tables.learning_practice_submissions.length,49);
  await page.goto('about:blank');await context.clearCookies();await context.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(sessions[0])).toString('base64url'),url:origin}]);await page.goto(origin+'/teams/'+org+'/skills');await page.waitForLoadState('networkidle');assert.equal(await page.getByRole('heading',{name:'Avance por tipo de trabajo'}).count(),1);assert.match(await page.locator('main').innerText(),/Colaborador ficticio/);
  // WebKit can report the cross-origin Next development stack lookup as a
  // pageerror when the isolated editor opens. This endpoint only reconstructs
  // debug stacks; application errors and every other endpoint still fail.
  const debugLookup='/'+new URL(origin).host+'/__nextjs_original-stack-frames due to access control checks.';
  const applicationErrors=errors.filter(message=>message!==debugLookup);
  if(errors.length!==applicationErrors.length)console.log('INFO Next development stack lookup blocked by browser isolation; application errors remain checked');
  assert.deepEqual(applicationErrors,[]);await context.close();console.log('PASS four languages, six routes, mobile and desktop, decision/editor/tools accessibility');
 }
 finished=true;
}finally{await browser?.close();server.kill('SIGTERM');if(server.exitCode===null)await new Promise(resolve=>server.once('close',resolve));if(runtimeServer){runtimeServer.kill('SIGTERM');if(runtimeServer.exitCode===null)await new Promise(resolve=>runtimeServer.once('close',resolve));}database.close();if(!finished)console.error(logs.join('').slice(-9000));}

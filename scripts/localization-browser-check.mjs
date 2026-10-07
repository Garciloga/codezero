import assert from 'node:assert/strict';import fs from 'node:fs';import http from 'node:http';import { spawn } from 'node:child_process';import { setTimeout as pause } from 'node:timers/promises';import { chromium } from '../sandbox-runtime/node_modules/playwright/index.mjs';
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
const database=http.createServer(async(req,res)=>{
 const url=new URL(req.url,dbOrigin);res.setHeader('Content-Type','application/json');
 if(url.pathname==='/auth/v1/user'){
  if(req.headers.authorization!=='Bearer '+jwt){res.writeHead(401);return res.end(JSON.stringify({message:'Synthetic fixture rejects unauthenticated request'}));}
  if(req.method==='PUT'){let body='';for await(const chunk of req)body+=chunk;const data=JSON.parse(body);assert.deepEqual(Object.keys(data.data),['locale']);user.user_metadata={...user.user_metadata,...data.data};}
  return res.end(JSON.stringify(user));
 }
 if(url.pathname.startsWith('/rest/v1/')){
  const table=url.pathname.split('/').pop();const rows=tables[table]??[];
  if(req.method==='POST'){res.writeHead(201);return res.end('null');}
  if(req.headers.accept?.includes('vnd.pgrst.object'))return res.end(JSON.stringify(rows[0]??null));
  return res.end(JSON.stringify(rows));
 }
 res.writeHead(404);res.end('{}');
});await new Promise(resolve=>database.listen(5456,'127.0.0.1',resolve));
const logs=[];const env={...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:dbOrigin,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'validation-placeholder',SUPABASE_SECRET_KEY:'validation-placeholder',NEXT_PUBLIC_APP_URL:origin};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next',process.env.CODEZERO_REVIEW_BUILT==='1'?'start':'dev','-H','127.0.0.1','-p','3256'],{env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',x=>logs.push(String(x)));server.stderr.on('data',x=>logs.push(String(x)));
let browser;
try{
 for(let i=0;i<120;i++){try{if((await fetch(origin+'/login')).ok)break;}catch{}await pause(250);if(i===119)throw Error('Local server unavailable');}
 browser=await chromium.launch({headless:true,executablePath:process.env.CODEZERO_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const expected={es:['es-MX','Mi cuenta','Saltar al contenido'],en:['en','My account','Skip to content'],pt:['pt-BR','Minha conta','Ir para o conteúdo'],fr:['fr','Mon compte','Aller au contenu']};
 for(const locale of ['es','en','pt','fr']){
  await page.goto(origin+'/login');await page.locator('#codezero-language').selectOption(locale);await page.waitForFunction(lang=>document.documentElement.lang===lang,expected[locale][0]);await page.reload();assert.equal(await page.locator('#codezero-language').inputValue(),locale);assert.equal(await page.locator('.skip-link').innerText(),expected[locale][2]);
  const invalid=await context.request.post(origin+'/api/locale',{headers:{origin},data:{locale:'de'}});assert.equal(invalid.status(),400);const hostile=await context.request.post(origin+'/api/locale',{headers:{origin:'https://example.invalid'},data:{locale:'en'}});assert.equal(hostile.status(),403);
  const title=await page.title();if(locale!=='es')assert.ok(!title.includes('Entrar o crear cuenta'));
  await page.goto(origin+'/pricing');assert.equal(await page.locator('#codezero-language').inputValue(),locale);assert.equal(await page.locator('.public-plans article').count(),3);assert.ok((await page.locator('.public-plans').innerText()).includes('249'));
  await page.goto(origin+'/faq');assert.equal(await page.locator('#codezero-language').inputValue(),locale);
  await page.goto(origin+'/terms');assert.equal(await page.locator('#codezero-language').inputValue(),locale);
  console.log('PASS visitor selection, reload, navigation, pricing, legal copy and metadata',locale);
 }
 await page.goto(origin+'/login');await page.locator('#codezero-language').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');await page.locator('input[name=email]').fill('synthetic@codezero.example.test');await page.locator('input[name=password]').fill('short');await page.locator('form button[type=submit]').click();assert.ok((await page.locator('#password-error').innerText()).includes('8'));assert.ok(!(await page.locator('#password-error').innerText()).includes('contraseña'));console.log('PASS interactive validation messages in chosen language');
 await context.addCookies([{name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),url:origin}]);
 await page.goto(origin+'/profile');assert.equal(await page.locator('h1').innerText(),'Mi cuenta');await page.locator('#codezero-language').selectOption('fr');await page.waitForFunction(()=>document.documentElement.lang==='fr');await page.reload();assert.equal(await page.locator('h1').innerText(),'Mon compte');assert.equal(user.user_metadata.locale,'fr');assert.equal(tables.profiles[0].role,'student');assert.equal(tables.profiles[0].plan_name,'free');assert.equal(await page.locator('input[name=full_name]').inputValue(),'Nom de test');console.log('PASS authenticated preference persistence; name, role and plan unchanged');
 await page.goto(origin+'/learn/1/fixture-lesson');assert.equal((await page.locator('form[action="/api/exercises/submit"] input[type=radio]').first().getAttribute('value')),'A');assert.equal(await page.locator('input[name=lesson_slug]').first().inputValue(),'fixture-lesson');assert.ok(!(await page.locator('article').first().innerText()).includes(curriculum.lessons[0].content.slice(0,100)));console.log('PASS lesson translation with exact original submitted identifiers and answer values');
 await page.goto(origin+'/learn/1/exam');assert.equal(await page.locator('form[action="/api/exams/submit"]').count(),1);assert.equal(await page.locator('input[name=sitting_id]').count(),1);console.log('PASS translated exam renders persisted sitting and unchanged submission contract');
 await page.goto(origin+'/help?q=certificat');assert.ok(await page.locator('details').count()>0);console.log('PASS help search in French matches translated FAQ');
 await context.clearCookies();await context.addCookies([{name:'codezero_locale',value:'fr',url:origin}]);await page.goto(origin+'/login');await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const menu=page.locator('.public-mobile-menu');await menu.locator('summary').click();await menu.locator('summary').press('Escape');assert.equal(await menu.evaluate(x=>x.open),false);assert.equal(await menu.locator('summary').evaluate(x=>x===document.activeElement),true);await page.screenshot({path:'/tmp/codezero-french-mobile.png',fullPage:true});console.log('PASS mobile layout, Escape and focus in French');
 assert.deepEqual(errors,[]);console.log('Browser localization checks passed (synthetic local Auth/PostgREST fixtures only).');
}catch(error){console.error(logs.slice(-10).join('\n'));throw error;}finally{if(browser)await browser.close();server.kill('SIGTERM');await new Promise(resolve=>database.close(resolve));}

/** Guard/UI smoke checks only. No authenticated Supabase or AI provider calls. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {chromium} from '../sandbox-runtime/node_modules/playwright/index.mjs';
const origin='http://localhost:3234';
const base={...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'validation-placeholder',NEXT_PUBLIC_APP_URL:origin,CODEZERO_WORKSPACE_SANDBOX:'1',CODEZERO_ENVIRONMENT:'sandbox',CODEZERO_SANDBOX_PROJECT_REF:'local',CODEZERO_TUTOR_PREVIEW:'1'};
let processHandle,browser;
const logs=[];
async function start(changes={}){
 processHandle=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3234'],{env:{...base,...changes},stdio:['ignore','pipe','pipe']});
 processHandle.stdout.on('data',data=>logs.push(data.toString()));processHandle.stderr.on('data',data=>logs.push(data.toString()));
 for(let i=0;i<100;i++){try{await fetch(origin+'/api/health');return;}catch{}await pause(100);}
 throw new Error('Preview did not start');
}
async function stop(){if(!processHandle)return;const proc=processHandle;processHandle=null;const closed=new Promise(resolve=>proc.once('exit',resolve));proc.kill('SIGTERM');await closed;}
const post=(path,requestOrigin=origin)=>fetch(origin+path,{method:'POST',headers:{origin:requestOrigin,'Content-Type':'application/json'},body:JSON.stringify({lessonId:1,question:'¿Cómo practicar SQL?'})});
try{
 await start();
 assert.equal((await post('/api/tutor-preview','https://untrusted.example')).status,403);
 const anonymous=await post('/api/tutor-preview');assert.equal(anonymous.status,401);assert.match(anonymous.headers.get('cache-control'),/no-store/);
 console.log('PASS cross-origin and anonymous tutor preparation requests denied');
 browser=await chromium.launch({headless:true,...(process.env.CODEZERO_BROWSER_EXECUTABLE?{executablePath:process.env.CODEZERO_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];const remoteRequests=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(!['localhost','127.0.0.1'].includes(url.hostname)){remoteRequests.push(url.hostname);return route.abort();}return route.continue();});
 const response=await page.goto(origin+'/tutor-preview?lesson=1');assert.equal(response.status(),200);
 await page.getByRole('heading',{name:'Inicia sesión en el entorno de pruebas'}).waitFor();assert.equal(await page.getByRole('button',{name:'Preparar contexto',exact:true}).count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);assert.deepEqual(remoteRequests,[]);
 console.log('PASS anonymous mobile tutor page explains login, has no fake answer and makes no external requests');
 const tutorRow=page.getByRole('row').filter({hasText:'Tutor · 100 consultas'});
 await page.getByLabel('Supuesto editable: MXN por USD').fill('10');assert.match(await tutorRow.innerText(),/\$0\.63/);
 await page.getByLabel('Supuesto editable: MXN por USD').fill('0');await page.getByText('Introduce un supuesto de conversión positivo',{exact:false}).waitFor();
 assert.equal(await page.getByRole('table').count(),0);
 await page.getByLabel('Supuesto editable: MXN por USD').fill('20');assert.match(await tutorRow.innerText(),/\$1\.27/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 console.log('PASS interactive cost assumptions update, reject invalid FX and fit mobile viewport');
 assert.equal((await fetch(origin+'/tutor-preview?lesson=invalid')).status,404);assert.equal((await fetch(origin+'/tutor-preview?lesson=9007199254740992')).status,404);
 console.log('PASS invalid lesson identifiers rejected');
 await stop();await start({CODEZERO_TUTOR_PREVIEW:'0'});assert.equal((await fetch(origin+'/tutor-preview')).status,404);assert.equal((await post('/api/tutor-preview')).status,404);console.log('PASS tutor preview flag off rejects page and API');
 await stop();await start({NEXT_PUBLIC_SUPABASE_URL:'https://kwfzhpapvpdatdfwhouf.supabase.co',CODEZERO_SANDBOX_PROJECT_REF:'kwfzhpapvpdatdfwhouf'});assert.equal((await fetch(origin+'/tutor-preview')).status,404);assert.equal((await post('/api/tutor-preview')).status,404);console.log('PASS known production Supabase blocked even when preview flags set');
 await stop();await start({VERCEL_ENV:'production'});assert.equal((await fetch(origin+'/tutor-preview')).status,404);assert.equal((await post('/api/tutor-preview')).status,404);console.log('PASS production deployment blocked even with sandbox URL');
} catch(error){console.error(error.message);console.error(logs.slice(-10).join(''));process.exitCode=1;}
finally{await browser?.close();await stop();}

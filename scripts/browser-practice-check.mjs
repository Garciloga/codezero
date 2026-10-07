/** Local Chromium verification. Requires a build with the review config in BROWSER_CODE_RUNTIME.md. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as pause } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { chromium } from "../sandbox-runtime/node_modules/playwright/index.mjs";
import { RUNTIME_CHALLENGES } from '../lib/runtime-challenges.ts';

const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:"https://example.supabase.co",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"validation-placeholder",
  NEXT_PUBLIC_APP_URL:"http://localhost:3032",CODEZERO_PRACTICE_PREVIEW:"1",CODEZERO_MODULAR_PREVIEW:"1",CODEZERO_CODE_RUNTIME:"1",CODEZERO_ENVIRONMENT:"sandbox",CODEZERO_CODE_RUNTIME_ORIGIN:"http://127.0.0.1:3041"};
const processes=[];let browser;
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const logs=[];const browserLogs=[];
function start(args, environment) {
  const proc=spawn(process.execPath,args,{cwd:root,env:environment,stdio:["ignore","pipe","pipe"]});processes.push(proc);
  proc.stdout.on("data",data=>logs.push(data.toString()));proc.stderr.on("data",data=>logs.push(data.toString()));
  return proc;
}
async function waitFor(url) { for(let i=0;i<80;i++){try{if((await fetch(url)).ok)return;}catch{}await pause(100);}throw new Error("No arrancó el servidor local."); }
async function waitResult(page) { await page.getByRole("button",{name:"Ejecutar código",exact:true}).waitFor();
  await page.waitForFunction(()=>!document.querySelector('.browser-code-practice button[type="submit"]')?.disabled,{},{timeout:35000}); }
try {
  start(["sandbox-runtime/server.mjs"],{CODEZERO_ENVIRONMENT:"sandbox",CODEZERO_RUNTIME_PARENT:env.NEXT_PUBLIC_APP_URL,CODEZERO_CODE_RUNTIME_ORIGIN:env.CODEZERO_CODE_RUNTIME_ORIGIN});
  start(["node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p","3032"],env);
  await Promise.all([waitFor("http://localhost:3032/practice-preview"),waitFor("http://127.0.0.1:3041/frame")]);
  browser=await chromium.launch({headless:true,...(process.env.CODEZERO_BROWSER_EXECUTABLE?{executablePath:process.env.CODEZERO_BROWSER_EXECUTABLE,args:["--no-sandbox","--disable-dev-shm-usage"]}:{})});
  const page=await browser.newPage({viewport:{width:1280,height:900}});const pageErrors=[];let attemptedAppFetch=false;
  page.on("pageerror",error=>pageErrors.push(error.message));
  page.on("console",message=>{if(["error","warning"].includes(message.type()))browserLogs.push(message.text());});
  page.on("requestfailed",request=>browserLogs.push(request.url()+" "+request.failure()?.errorText));
  await page.route("**/*",route=>{
    const url=new URL(route.request().url());
    if(url.pathname==="/api/health")attemptedAppFetch=true;
    return ["localhost","127.0.0.1"].includes(url.hostname)?route.continue():route.abort();
  });
  const response=await page.goto("http://localhost:3032/practice-preview");assert.equal(response.status(),200);
  await page.evaluate(()=>window.addEventListener("message",event=>{if(event.data?.type==="running")globalThis.__codezeroSyntheticRun={id:event.data.id,channel:event.data.channel};}));
  assert.ok((await response.headerValue("content-security-policy")).includes("frame-src 'self' http://127.0.0.1:3041"));
  assert.equal(await page.getByRole("button",{name:"Guardar mi progreso",exact:true}).count(),0);
  await page.getByText("Modo de exploración:",{exact:false}).waitFor();
  const modular = await browser.newPage();
  await modular.goto("http://localhost:3032/modular-preview");
  const waitlistButtons = modular.getByRole("button",{name:"Me interesa · lista de espera",exact:true});
  assert.equal(await waitlistButtons.count(),16);
  for(const button of await waitlistButtons.all())assert.equal(await button.isDisabled(),true);
  await modular.close();console.log("PASS anonymous previews do not claim saved progress or accept waitlist writes");
  const code=page.getByLabel("Tu código de Python",{exact:true});const run=page.getByRole("button",{name:"Ejecutar código",exact:true});
  const output=page.getByLabel("Salida del código",{exact:true});
  await run.click();await waitResult(page);assert.equal((await output.innerText()).trim(),"Faro\nPuente",await page.locator('.browser-code-practice [role="status"]').innerText());console.log("PASS Python executed in a separate-origin browser worker");
  if(process.env.CODEZERO_RUNTIME_SCREENSHOTS==="1")await page.locator(".browser-code-practice").screenshot({path:"/tmp/codezero-code-practice-desktop.png"});
  await code.fill('print(sum([3, 5]))');await run.click();await waitResult(page);assert.equal((await output.innerText()).trim(),"8");
  await code.fill('print(missing_name)');await run.click();await waitResult(page);assert.match(await page.locator('.browser-code-practice [role="status"]').innerText(),/NameError/);console.log("PASS Python errors are shown");
  await code.fill('while True:\n    pass');await run.click();
  await page.getByText("Ejecutando tu práctica…",{exact:true}).waitFor({timeout:30000});
  const iframe=page.frameLocator('iframe[title="Motor aislado de práctica"]');
  await page.context().addCookies([{name:"codezero_synthetic_test",value:"test_marker",url:"http://localhost:3032"}]);
  const access=await iframe.locator("body").evaluate(()=>{let parentAccess;try{parentAccess=parent.document.cookie;}catch(error){parentAccess=error.name;}return{own:document.cookie,parent:parentAccess};});
  assert.deepEqual(access,{own:"",parent:"SecurityError"});
  await page.evaluate(()=>window.postMessage({type:"result",status:"complete",stdout:"forged",error:"",...globalThis.__codezeroSyntheticRun},"*"));
  await waitResult(page);assert.match(await page.locator('.browser-code-practice [role="status"]').innerText(),/3 segundos|excedió/);console.log("PASS separate-host cookie isolation, forged message rejection and infinite-loop termination");
  await code.fill('print("recovered")');await run.click();await waitResult(page);assert.equal((await output.innerText()).trim(),"recovered");console.log("PASS execution recovers after timeout");
  await code.fill('from js import fetch\nawait fetch("http://localhost:3032/api/health")');await run.click();await waitResult(page);
  assert.equal(attemptedAppFetch,false);assert.match(await page.locator('.browser-code-practice [role="status"]').innerText(),/TypeError|Failed to fetch|NetworkError/);console.log("PASS worker CSP blocks requests to the app");
  await code.fill('print("x" * 6000)');await run.click();await waitResult(page);assert.ok((await output.innerText()).length<=4096);assert.ok(await page.getByText(/Se alcanzó un límite de salida/).isVisible());console.log("PASS Python output is bounded");
  await code.fill('while True:\n    pass');await run.click();await page.getByText("Ejecutando tu práctica…",{exact:true}).waitFor({timeout:30000});
  const activeWorker=page.workers()[0];assert.ok(activeWorker);
  const workerClosed=new Promise(resolve=>activeWorker.once("close",resolve));
  await page.getByRole("button",{name:"Detener ejecución",exact:true}).click();
  await Promise.race([workerClosed,pause(4000).then(()=>{throw new Error("El worker no terminó tras cancelar.");})]);
  assert.equal(await page.locator('iframe[title="Motor aislado de práctica"]').count(),0);assert.match(await page.locator('.browser-code-practice [role="status"]').innerText(),/detenida/);console.log("PASS cancellation terminates the active worker");
  await page.getByLabel("Lenguaje",{exact:true}).selectOption("sql");
  const sql=page.getByLabel("Tu código de SQL",{exact:true});await run.click();await waitResult(page);
  const rows=(await output.innerText()).trim().split("\n").map(row=>JSON.parse(row));assert.deepEqual(rows,[{nombre:"Faro",asientos:3},{nombre:"Puente",asientos:5}]);
  await sql.fill("SELECT SUM(asientos) AS total FROM cuentas WHERE estado = 'activo';");await run.click();await waitResult(page);assert.deepEqual(JSON.parse((await output.innerText()).trim()),{total:8});console.log("PASS SQLite WASM executes against fixture rows");
  await sql.fill("DELETE FROM cuentas; SELECT COUNT(*) AS total FROM cuentas;");await run.click();await waitResult(page);assert.deepEqual(JSON.parse((await output.innerText()).trim()),{total:0});
  await sql.fill("SELECT COUNT(*) AS total FROM cuentas;");await run.click();await waitResult(page);assert.deepEqual(JSON.parse((await output.innerText()).trim()),{total:3});console.log("PASS SQL changes do not survive a run");
  await sql.fill("WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<100) SELECT x FROM n;");await run.click();await waitResult(page);assert.match(await page.locator('.browser-code-practice [role="status"]').innerText(),/50 filas/);console.log("PASS SQLite result row limit");
  await sql.fill("WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n) SELECT SUM(x) FROM n;");await run.click();await waitResult(page);assert.match(await page.locator('.browser-code-practice [role="status"]').innerText(),/3 segundos|excedió/);console.log("PASS long SQLite query is terminated");
  const solutions={'python-list':RUNTIME_CHALLENGES[0].starter,'python-total':RUNTIME_CHALLENGES[1].starter+'print(sum(c["asientos"] for c in cuentas if c["estado"] == "activo"))','python-input':'for valor in ["5", "cinco"]:\n    try:\n        print(int(valor))\n    except ValueError:\n        print("entrada inválida")','sql-list':RUNTIME_CHALLENGES[3].starter,'sql-total':"SELECT SUM(asientos) AS total FROM cuentas WHERE estado = 'activo';",'sql-groups':'SELECT estado, COUNT(*) AS cuentas FROM cuentas GROUP BY estado ORDER BY estado;'};
  for(const challenge of RUNTIME_CHALLENGES){await page.getByLabel('Lenguaje',{exact:true}).selectOption(challenge.language);await page.getByLabel('Reto de práctica',{exact:true}).selectOption(challenge.id);await page.locator('#practice-code').fill(solutions[challenge.id]);await run.click();await waitResult(page);assert.equal((await output.innerText()).trim(),challenge.expected);}
  console.log('PASS all six Python/SQLite challenges against executable fixture solutions');
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await page.getByLabel('Reto de práctica',{exact:true}).selectOption('sql-list');
  await page.getByRole("button",{name:"Restaurar ejemplo",exact:true}).click();await run.click();await waitResult(page);assert.ok((await output.innerText()).includes('"Faro"'));console.log("PASS mobile layout and post-timeout recovery");
  if(process.env.CODEZERO_RUNTIME_SCREENSHOTS==="1")await page.locator(".browser-code-practice").screenshot({path:"/tmp/codezero-code-practice-mobile.png"});
  assert.deepEqual(pageErrors,[]);console.log("Browser practice checks completed without uncaught page errors.");
} catch(error) { console.error(logs.join("").slice(-1500));console.error(browserLogs.join("\n").slice(-2500));throw error; }
finally { await browser?.close();for(const proc of processes)proc.kill("SIGTERM"); }

import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request } from "node:http";
import { LIMITS, localRuntimeConfig, validRun } from "../protocol.mjs";
import { createRuntimeServer, runtimeHeaders } from "../server.mjs";
const config={appOrigin:"http://localhost:3032",runtimeOrigin:"http://127.0.0.1:3041",host:"127.0.0.1",port:3041};
const id="a724a9f2-147d-4dda-a6d5-cb854b9476c4";
test("runtime refuses same-host ports, hosted environments and credentials",()=>{
  const env={CODEZERO_ENVIRONMENT:"sandbox",CODEZERO_RUNTIME_PARENT:config.appOrigin,CODEZERO_CODE_RUNTIME_ORIGIN:config.runtimeOrigin};
  assert.deepEqual(localRuntimeConfig(env),config);
  for(const change of [{VERCEL_ENV:"production"},{CODEZERO_ENVIRONMENT:"production"},{CODEZERO_RUNTIME_PARENT:"http://127.0.0.1:3032"},{CODEZERO_CODE_RUNTIME_ORIGIN:"https://runtime.example"},{CODEZERO_CODE_RUNTIME_ORIGIN:"http://127.0.0.1:3041/?data=x"}]) assert.equal(localRuntimeConfig({...env,...change}),null);
});
test("run protocol bounds code and supports only practice languages",()=>{
  const run={type:"run",id,language:"python",code:"print(8)"};
  assert.equal(validRun(run),true);
  for(const change of [{id:""},{id:[id]},{type:"exam"},{language:"shell"},{code:" "},{code:"x".repeat(LIMITS.code+1)}]) assert.equal(validRun({...run,...change}),false);
});
test("sandbox CSP allows only local runtime assets and never credentialed CORS",()=>{
  const headers=runtimeHeaders(config);const csp=headers["Content-Security-Policy"];
  assert.ok(csp.includes("default-src 'none'"));assert.ok(csp.includes(`connect-src ${config.runtimeOrigin}`));
  assert.ok(csp.includes(`frame-ancestors ${config.appOrigin}`));assert.ok(csp.includes("worker-src blob:"));
  assert.ok(!csp.includes("'unsafe-eval'"));assert.ok(!csp.includes("'unsafe-inline'"));
  assert.equal(headers["Access-Control-Allow-Credentials"],undefined);
});
test("HTTP serving is an exact static allowlist, without upload, traversal or reflection",async()=>{
  const server=createRuntimeServer({...config,runtimeOrigin:"http://127.0.0.1:3044"});
  server.listen(3044,"127.0.0.1");await once(server,"listening");
  try{
    for(const [path,status] of [["/frame",200],["/worker.mjs",200],["/pyodide/pyodide.asm.wasm",200],["/sqlite/sqlite3.wasm",200],["/frame?payload=secret",404],["/package.json",404],["/.env",404],["/anything",404],["/%2e%2e/server.mjs",404]]){
      const response=await fetch("http://127.0.0.1:3044"+path);assert.equal(response.status,status,path);
      await response.arrayBuffer();
    }
    assert.equal((await fetch("http://127.0.0.1:3044/frame",{method:"POST",body:"code"})).status,405);
    const rejected = await new Promise((resolve,reject)=>{
      const req=request("http://127.0.0.1:3044/frame",{headers:{host:"evil.example"}},res=>{res.resume();resolve(res.statusCode);});
      req.on("error",reject);req.end();
    });
    assert.equal(rejected,421);
  }finally{server.close();await once(server,"close");}
});

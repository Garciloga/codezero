import test from "node:test";
import assert from "node:assert/strict";
import { codeRuntimeConfiguration, boundedRuntimeResult } from "../lib/code-runtime-policy.ts";
const env = { CODEZERO_PRACTICE_PREVIEW: "1", CODEZERO_CODE_RUNTIME: "1", CODEZERO_ENVIRONMENT: "sandbox", NEXT_PUBLIC_APP_URL: "http://localhost:3032", CODEZERO_CODE_RUNTIME_ORIGIN: "http://127.0.0.1:3041" };
test("code execution requires an explicit local sandbox and different cookie hosts", () => {
  assert.deepEqual(codeRuntimeConfiguration(env), { appOrigin: "http://localhost:3032", runtimeOrigin: "http://127.0.0.1:3041" });
  const credentialed = new URL(env.CODEZERO_CODE_RUNTIME_ORIGIN); credentialed.username = "synthetic-user";
  for (const change of [{CODEZERO_CODE_RUNTIME:"0"},{CODEZERO_ENVIRONMENT:"production"},{VERCEL_ENV:"production"},{CODEZERO_PRACTICE_PREVIEW:"0"},{NEXT_PUBLIC_APP_URL:"http://127.0.0.1:3032"},{NEXT_PUBLIC_APP_URL:"https://codezero.example"},{CODEZERO_CODE_RUNTIME_ORIGIN:"http://evil.example:3041"},{CODEZERO_CODE_RUNTIME_ORIGIN:"http://127.0.0.1:3041/path"},{CODEZERO_CODE_RUNTIME_ORIGIN:credentialed.href},{NEXT_PUBLIC_SUPABASE_URL:"https://kwfzhpapvpdatdfwhouf.supabase.co"}]) assert.equal(codeRuntimeConfiguration({...env,...change}),null);
});
test("parent accepts only bounded results for the current execution", () => {
  const value={type:"result",id:"current",status:"complete",stdout:"8",error:"",truncated:false};
  assert.deepEqual(boundedRuntimeResult(value,"current"),{status:"complete",stdout:"8",error:"",truncated:false});
  for (const change of [{id:"other"},{type:"running"},{status:"passed_exam"},{status:["complete"]},{stdout:"x".repeat(4097)},{error:"x".repeat(601)},{stdout:{html:"<script>"}}]) assert.equal(boundedRuntimeResult({...value,...change},"current"),null);
});

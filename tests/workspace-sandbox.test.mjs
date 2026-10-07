import test from "node:test";
import assert from "node:assert/strict";
import {workspaceWaitlistEnabled,workspaceEnabled,workspaceProductionEnabled,workspaceSandboxEnabled,trustedWorkspaceMutation,isTestInvitationEmail} from "../lib/workspace-sandbox.ts";
import {validAppearance} from "../lib/user-appearance.ts";
import {readWorkspacePages} from "../lib/workspace-pages.ts";
const local = {CODEZERO_WORKSPACE_SANDBOX:"1",CODEZERO_ENVIRONMENT:"sandbox",CODEZERO_SANDBOX_PROJECT_REF:"local",NEXT_PUBLIC_SUPABASE_URL:"http://127.0.0.1:54321"};
test("sandbox guard cannot be enabled on the known production or a mismatched project",()=>{
  assert.equal(workspaceSandboxEnabled(local),true);
  assert.equal(workspaceSandboxEnabled({...local,CODEZERO_WORKSPACE_SANDBOX:undefined}),false);
  assert.equal(workspaceSandboxEnabled({...local,CODEZERO_ENVIRONMENT:"production"}),false);
  assert.equal(workspaceSandboxEnabled({...local,NEXT_PUBLIC_SUPABASE_URL:"https://kwfzhpapvpdatdfwhouf.supabase.co",CODEZERO_SANDBOX_PROJECT_REF:"kwfzhpapvpdatdfwhouf"}),false);
  assert.equal(workspaceSandboxEnabled({...local,NEXT_PUBLIC_SUPABASE_URL:"https://kwfzhpapvpdatdfwhouf.supabase.co"}),false);
  assert.equal(workspaceSandboxEnabled({...local,NEXT_PUBLIC_SUPABASE_URL:"https://aaaaaaaaaaaaaaaaaaaa.supabase.co",CODEZERO_SANDBOX_PROJECT_REF:"bbbbbbbbbbbbbbbbbbbb"}),false);
  assert.equal(workspaceSandboxEnabled({...local,NEXT_PUBLIC_SUPABASE_URL:"https://aaaaaaaaaaaaaaaaaaaa.supabase.co",CODEZERO_SANDBOX_PROJECT_REF:"aaaaaaaaaaaaaaaaaaaa"}),true);
});
test("mutations reject cross-origin and spoofed forwarded hosts",()=>{
  const base="https://app.example.test/api/teams/manage";
  assert.equal(trustedWorkspaceMutation(new Request(base,{headers:{origin:"https://app.example.test"}})),true);
  assert.equal(trustedWorkspaceMutation(new Request(base,{headers:{origin:"https://evil.example","x-forwarded-host":"evil.example"}})),false);
  assert.equal(trustedWorkspaceMutation(new Request(base)),false);
});
test("invitation delivery accepts synthetic addresses only; preferences reject invalid inputs",()=>{
  assert.equal(isTestInvitationEmail("learner@codezero.example.test"),true);
  assert.equal(isTestInvitationEmail("person@gmail.com"),false);
  assert.equal(isTestInvitationEmail("learner@codezero.example.test.evil"),false);
  assert.equal(validAppearance({mode:"dark",accent:"green"}),true);
  assert.equal(validAppearance({mode:"dark",accent:"__proto__"}),false);
  assert.equal(validAppearance({mode:"invalid",accent:"blue"}),false);
});
test("pagination retains requirements after the first page and fails rather than presenting partial metrics",async()=>{
  const records=Array.from({length:501},(_,id)=>({id}));
  const good=await readWorkspacePages((start,end)=>Promise.resolve({data:records.slice(start,end+1),error:null}));
  assert.deepEqual(good.data,records);
  const failed=await readWorkspacePages((start,end)=>Promise.resolve(start?{data:null,error:new Error("UNAVAILABLE")}:{data:records.slice(start,end+1),error:null}));
  assert.equal(failed.data,null);assert.ok(failed.error);
});

test("production workspace needs explicit activation and the exact production database",()=>{
 const prod={CODEZERO_WORKSPACE_PRODUCTION:"1",CODEZERO_ENVIRONMENT:"production",VERCEL_ENV:"production",NEXT_PUBLIC_SUPABASE_URL:"https://kwfzhpapvpdatdfwhouf.supabase.co"};
 assert.equal(workspaceProductionEnabled(prod),true);
 assert.equal(workspaceEnabled(prod),true);
 assert.equal(workspaceSandboxEnabled(prod),false);
 for(const override of [{CODEZERO_WORKSPACE_PRODUCTION:"0"},{VERCEL_ENV:"preview"},{CODEZERO_ENVIRONMENT:"sandbox"},{NEXT_PUBLIC_SUPABASE_URL:"https://sdvwkrosdnlacyhnuxwo.supabase.co"},{NEXT_PUBLIC_SUPABASE_URL:"https://kwfzhpapvpdatdfwhouf.supabase.co.attacker.test"}])assert.equal(workspaceProductionEnabled({...prod,...override}),false);
});

test("production waitlists are independent from commercial review flags",()=>{
 const prod={CODEZERO_WORKSPACE_PRODUCTION:"1",CODEZERO_ENVIRONMENT:"production",VERCEL_ENV:"production",NEXT_PUBLIC_SUPABASE_URL:"https://kwfzhpapvpdatdfwhouf.supabase.co"};
 assert.equal(workspaceWaitlistEnabled(prod),true);
 assert.equal(workspaceWaitlistEnabled({...prod,CODEZERO_WORKSPACE_PRODUCTION:"0",CODEZERO_MODULAR_PREVIEW:"1"}),false);
 assert.equal(workspaceWaitlistEnabled(local),false);
 assert.equal(workspaceWaitlistEnabled({...local,CODEZERO_MODULAR_PREVIEW:"1"}),true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_PRACTICE_PROGRESS, validPracticeProgress } from '../lib/practice-progress.ts';
import { workspaceSandboxEnabled } from '../lib/workspace-sandbox.ts';
test('private progress rejects forged evidence, catalog versions and invalid calendar dates',()=>{
 assert.equal(validPracticeProgress({...EMPTY_PRACTICE_PROGRESS,passed:['api-11'],startDay:'2026-10-07',onboarding:[0,6]}),true);
 for(const change of [{version:'old'},{role:'owner'},{passed:['unknown']},{passed:['api-11','api-11']},{onboarding:[7]},{onboarding:[0,0]},{pulse:'x'.repeat(501)},{startDay:'2026-02-30'},{startDay:'1999-01-01'},{user_id:'someone'},{score:100}]) assert.equal(validPracticeProgress({...EMPTY_PRACTICE_PROGRESS,...change}),false);
});
test('workspace sandbox rejects production deployment even with loopback configuration',()=>{
 const env={CODEZERO_WORKSPACE_SANDBOX:'1',CODEZERO_ENVIRONMENT:'sandbox',CODEZERO_SANDBOX_PROJECT_REF:'local',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321'};
 assert.equal(workspaceSandboxEnabled(env),true);
 assert.equal(workspaceSandboxEnabled({...env,VERCEL_ENV:'production'}),false);
});

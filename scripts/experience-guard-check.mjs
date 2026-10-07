import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {setTimeout as pause} from 'node:timers/promises';
const base={...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'validation-placeholder',NEXT_PUBLIC_APP_URL:'http://localhost:3235',CODEZERO_WORKSPACE_SANDBOX:'1',CODEZERO_ENVIRONMENT:'sandbox',CODEZERO_SANDBOX_PROJECT_REF:'local',CODEZERO_EXPERIENCE_PREVIEW:'1'};
for(const [label,changes] of [['disabled',{CODEZERO_EXPERIENCE_PREVIEW:'0'}],['production',{VERCEL_ENV:'production'}],['untrusted database',{CODEZERO_SANDBOX_PROJECT_REF:'wrong'}]]){
 const proc=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3235'],{env:{...base,...changes},stdio:'ignore'});
 try{let response;for(let i=0;i<80;i++){try{response=await fetch('http://localhost:3235/experience-preview',{signal:AbortSignal.timeout(5000)});break;}catch{}await pause(100);}assert.ok(response,'Server unavailable');assert.equal(response.status,404);console.log('PASS experience preview blocked: '+label);}
 finally{const closed=new Promise(resolve=>proc.once('exit',resolve));proc.kill('SIGTERM');await closed;}
}

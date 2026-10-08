import {workspaceSandboxEnabled} from './workspace-sandbox.ts';
export function roleTrainingEnabled(env:Record<string,string|undefined>=process.env){
 return env.CODEZERO_ROLE_TRAINING==='1'&&workspaceSandboxEnabled(env);
}

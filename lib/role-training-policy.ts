import {workspaceSandboxEnabled,workspaceProductionEnabled} from './workspace-sandbox.ts';
/** Explicit activation with an exact database/environment guard for each target. */
export function roleTrainingEnabled(env:Record<string,string|undefined>=process.env){
 return env.CODEZERO_ROLE_TRAINING==='1'&&(workspaceSandboxEnabled(env)||(env.CODEZERO_ROLE_TRAINING_PRODUCTION==='1'&&workspaceProductionEnabled(env)));
}

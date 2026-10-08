import {roleTrainingEnabled} from './role-training-policy.ts';
export function mixedRoleEnabled(env:Record<string,string|undefined>=process.env){return env.CODEZERO_MIXED_ROUTES==='1'&&roleTrainingEnabled(env);}

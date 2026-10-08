// Undefined means active: release checks never silently exempt a new module.
export function translationGate(file,env=process.env){
 const mixed=file.startsWith('app/role-training/mixed/')||file.startsWith('lib/mixed-role-')||/^app\/components\/(?:enterprise\/mixed-|mixed-code-editor)/.test(file);
 return mixed&&env.CODEZERO_MIXED_ROUTES==='0'?'warning':'error';
}

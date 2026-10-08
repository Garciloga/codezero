export type SupportBackup={owner:string;target:string;refresh:string;expires:number};
export const SUPPORT_COOKIE:string;
export const SUPPORT_DURATION:number;
export function sealSupport(payload:SupportBackup,secret:string|undefined):string;
export function openSupport(value:string|undefined,secret:string|undefined):SupportBackup|null;

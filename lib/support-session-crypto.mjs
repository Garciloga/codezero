import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
export const SUPPORT_COOKIE='garciloga-support-return';
export const SUPPORT_DURATION=20*60*1000;
function key(secret){if(!secret)throw Error('MISSING_SECRET');return createHash('sha256').update('garciloga-support-v1:'+secret).digest();}
export function sealSupport(payload,secret){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(secret),iv);const body=Buffer.concat([cipher.update(JSON.stringify(payload),'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64url');}
export function openSupport(value,secret){try{if(!value||value.length>3000)return null;const raw=Buffer.from(value,'base64url');const cipher=createDecipheriv('aes-256-gcm',key(secret),raw.subarray(0,12));cipher.setAuthTag(raw.subarray(12,28));const p=JSON.parse(Buffer.concat([cipher.update(raw.subarray(28)),cipher.final()]).toString());if(typeof p.owner!=='string'||typeof p.target!=='string'||typeof p.refresh!=='string'||!Number.isFinite(p.expires)||p.expires+8*3600000<Date.now())return null;return p;}catch{return null;}}

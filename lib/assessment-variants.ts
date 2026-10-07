import {createHmac} from 'node:crypto';
/** Candidate server-only bank. Private answers never belong in client serialization. */
export function createAssessmentVariant(secret:string,attemptId:string){
 if(secret.length<32||!/^[a-zA-Z0-9_-]{8,100}$/.test(attemptId))throw Error('INVALID_VARIANT_INPUT');
 const hash=createHmac('sha256',secret).update('accounts-v1:'+attemptId).digest();
 const activeA=2+hash[0]%8,activeB=2+hash[1]%8,inactive=1+hash[2]%9;
 return {version:'accounts-v1',attemptId,prompt:`Faro y Puente están activos con ${activeA} y ${activeB} asientos. Nube está inactivo con ${inactive}. Calcula el total activo y explica cómo comprobarlo.`,answer:activeA+activeB,rows:[{name:'Faro',active:true,seats:activeA},{name:'Nube',active:false,seats:inactive},{name:'Puente',active:true,seats:activeB}]};
}
export function publicAssessmentVariant(variant:ReturnType<typeof createAssessmentVariant>){return {version:variant.version,attemptId:variant.attemptId,prompt:variant.prompt};}

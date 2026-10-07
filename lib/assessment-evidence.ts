/** Structure only. Never infers cheating, mastery or an official assessment score. */
export type PracticeEvidence={explanation:string;test:string;expected:string;observed:string;failure:string;tools:string};
export function parsePracticeEvidence(value:unknown):PracticeEvidence|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const keys=['explanation','test','expected','observed','failure','tools'] as const;
 if(Object.keys(value).length!==keys.length)return null;
 const record=value as Record<string,unknown>;
 if(keys.some(key=>typeof record[key]!=='string'||(record[key] as string).trim().length<10||(record[key] as string).length>1500))return null;
 return Object.fromEntries(keys.map(key=>[key,(record[key] as string).trim()])) as PracticeEvidence;
}
export const EVIDENCE_LABELS={explanation:'Explica tu decisión y una alternativa descartada',test:'Describe una prueba reproducible',expected:'Resultado esperado',observed:'Resultado observado',failure:'Caso de fallo y recuperación',tools:'Herramientas y ayuda utilizadas (incluye IA si la usaste)'} as const;

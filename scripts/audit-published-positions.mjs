/** Fail-closed publishing audit for every generated role (not just a draft sample). */
import fs from 'node:fs';
import {auditCurriculum,BLOCKING,coveredLevels} from './position-curriculum-audit.mjs';
const published=JSON.parse(fs.readFileSync('lib/position-curricula/published.json','utf8'));
let failures=0;
for (const {key} of published.filter(p=>p.key!=='customer_success')) {
 const file=`lib/position-curricula/roles/${key}.json`;
 const role=JSON.parse(fs.readFileSync(file,'utf8'));
 const findings=auditCurriculum(role,file).filter(x=>BLOCKING.has(x.rule));
 const levels=coveredLevels([role]);
 if(levels.length!==15||role.levels.reduce((n,l)=>n+l.lessons.length,0)!==92) {
  console.error('FAIL curriculum totals',key);failures++;
 }
 if(findings.length){console.error('FAIL editorial gate',key,findings.slice(0,4));failures+=findings.length;}
 for(const lang of ['es','en','pt','fr']){
  const titles=role.levels.flatMap(l=>l.lessons.map(x=>x.localized?.[lang]?.title?.trim().toLowerCase()??''));
  if(titles.length!==92||titles.some(x=>!x)||new Set(titles).size!==92){console.error('FAIL repeated titles',key,lang);failures++;}

  const prompts=role.levels.flatMap(l=>l.lessons.map(x=>x.localized?.[lang]?.exercise2?.prompt??''));
  if(prompts.length!==92||prompts.some(p=>p.length<120)||new Set(prompts).size!==92||prompts.some(p=>p==='Prepara evidencia, responsable, fecha y criterio de aceptación.')) {
    console.error('FAIL repeated or missing written work',key,lang);failures++;
  }
 }
 console.log('Audited',key,'15 levels; 92 distinct written tasks in each locale');
}
if(failures)process.exit(1);
console.log('PASS published professional curriculum integrity. Human editorial and translation review still pending.');

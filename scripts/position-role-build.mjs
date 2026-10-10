// Builds lib/position-curricula/roles/<role>.json from the authored source in docs/position-curricula/sources/<role>/.
// Source lines: "L<level>.<n> <lang>|title|objective|case|prompt|correct|wrong|wrong|feedback",
// "Q<level>.<n> <lang>|prompt|correct|wrong|wrong|feedback" and "P<level> <lang>|title|brief".
// The correct option is always written first; its published position is a fixed shuffle per question, equal in every language.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {writtenPrompt} from './position-written-practice.mjs';
const [role,title]=process.argv.slice(2);if(!role||!title)throw Error('Uso: node scripts/position-role-build.mjs <role> "<Título>"');
const LANGS=['es','en','pt','fr'],dir=`docs/position-curricula/sources/${role}`;
const base=JSON.parse(fs.readFileSync('lib/position-curricula/roles/onboarding.json','utf8'));
const lessons=new Map(),questions=new Map(),projects=new Map();
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.txt')).sort())for(const [n,raw] of fs.readFileSync(path.join(dir,file),'utf8').split('\n').entries()){
 const line=raw.trim();if(!line)continue;const m=line.match(/^([LQP])(\d+)(?:\.(\d+))? (es|en|pt|fr)\|(.*)$/);if(!m)throw Error(`${file}:${n+1} formato`);
 const [,kind,level,index,lang,rest]=m,parts=rest.split('|').map(s=>s.trim());if(parts.some(p=>!p))throw Error(`${file}:${n+1} campo vacío`);
 const want={L:8,Q:5,P:2}[kind];if(parts.length!==want)throw Error(`${file}:${n+1} esperaba ${want} campos, hay ${parts.length}`);
 const store={L:lessons,Q:questions,P:projects}[kind],key=kind==='P'?level:`${level}.${index}`;
 if(!store.has(key))store.set(key,{});if(store.get(key)[lang])throw Error(`${file}:${n+1} duplicado`);store.get(key)[lang]=parts;
}
const perms=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
const shuffled=(key,options)=>{const perm=perms[parseInt(crypto.createHash('sha256').update(key).digest('hex').slice(0,8),16)%6];return {options:perm.map(i=>options[i]),correctIndex:perm.indexOf(0)};};
const all=(store,key)=>{const v=store.get(key);if(!v||LANGS.some(l=>!v[l]))throw Error(`Falta ${key} en algún idioma`);return v;};
const levels=base.levels.map(level=>{
 const count=level.lessons.length;
 return {number:level.number,source:level.source,title:level.title,
  lessons:level.lessons.map((shape,i)=>{const key=`position-${role}-l${level.number}-${i+1}`,src=all(lessons,`${level.number}.${i+1}`);
   return {key,sharedSource:shape.sharedSource,localized:Object.fromEntries(LANGS.map(l=>{const [t,objective,situation,prompt,correct,w1,w2,feedback]=src[l];
    return [l,{title:t,learningObjective:objective,case:situation,exercise1:{type:'decision',prompt,...shuffled(key,[correct,w1,w2]),feedback},exercise2:{...shape.localized[l].exercise2,prompt:writtenPrompt(role,l,t,situation,objective)}}];}))};}),
  assessment:{...Object.fromEntries(Object.entries(level.assessment).filter(([k])=>k!=='questions')),questions:level.assessment.questions.map((_,i)=>{const key=`position-${role}-exam-${level.number}-q${i+1}`,src=all(questions,`${level.number}.${i+1}`);
   return {key,localized:Object.fromEntries(LANGS.map(l=>{const [prompt,correct,w1,w2,feedback]=src[l];return [l,{prompt,...shuffled(key,[correct,w1,w2]),feedback}];}))};})},
  _count:count};
});
const expected=levels.reduce((n,l)=>n+l._count,0);if(lessons.size!==expected)throw Error(`Lecciones: ${lessons.size} de ${expected}`);if(questions.size!==levels.length*5)throw Error(`Preguntas: ${questions.size}`);
for(const l of levels)delete l._count;
const out={role,title,status:'editorial-draft',published:false,editorialReview:'pending',studentCalibration:'pending',
 projects:base.projects.map(p=>{const src=all(projects,String(p.level));return {level:p.level,title:Object.fromEntries(LANGS.map(l=>[l,src[l][0]])),brief:Object.fromEntries(LANGS.map(l=>[l,src[l][1]]))};}),levels};
fs.writeFileSync(`lib/position-curricula/roles/${role}.json`,JSON.stringify(out,null,1)+'\n');
const seq=levels.flatMap(l=>[...l.lessons.map(x=>x.localized.es.exercise1.correctIndex),...l.assessment.questions.map(q=>q.localized.es.correctIndex)]);
console.log(`PASS ${role}: ${lessons.size} lecciones, ${questions.size} preguntas, ${projects.size} proyectos; posiciones correctas ${[0,1,2].map(i=>seq.filter(v=>v===i).length).join('/')}`);

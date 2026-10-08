// Extend dictionaries without rebuilding or overwriting previous editorial corrections.
import fs from 'node:fs';
import path from 'node:path';
import {authoredStrings} from './localization-audit.mjs';
import {TRAINING_ACTIVITIES,TRAINING_NOTICE,TECHNICAL_BORROWING} from '../lib/role-training-content.ts';
import {PROFESSIONAL_ACTIVITIES} from '../lib/professional-route-content.ts';
const sources=new Set();
const add=s=>{if(typeof s==='string'&&s.trim()&&!s.startsWith('http'))sources.add(s.replace(/\s+/g,' ').trim());};
for(const a of [...TRAINING_ACTIVITIES,...PROFESSIONAL_ACTIVITIES]){for(const k of ['title','lesson','task','template','example'])add(a[k]);for(const k of ['rubric','sourceRubric','optionalPractice'])a[k]?.forEach(add);for(const q of a.decisions){add(q.prompt);add(q.feedback);q.options.forEach(add);}}
add(TRAINING_NOTICE);for(const b of TECHNICAL_BORROWING){add(b.topic);add(b.purpose);}
function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,f.name);if(file.includes('/localization/'))continue;if(f.isDirectory())walk(file);else if(/\.(ts|tsx)$/.test(file))for(const s of authoredStrings(file,fs.readFileSync(file,'utf8')))add(s);}}
walk('app');walk('lib');
const existing=Object.fromEntries(['en','pt','fr'].map(l=>[l,Object.assign({},...['ui','server','curriculum'].map(k=>JSON.parse(fs.readFileSync(`lib/localization/${l}-${k}.json`))))]));
const missing=[...sources].filter(s=>['en','pt','fr'].some(l=>!existing[l][s]));
fs.writeFileSync('lib/localization/extension-source.json',JSON.stringify(missing,null,2)+'\n');console.log('New authored strings',missing.length);
const client=new Set();
function clientWalk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,f.name);if(file.includes('/localization/'))continue;if(f.isDirectory())clientWalk(file);else if(/\.(ts|tsx)$/.test(file)){const content=fs.readFileSync(file,'utf8');if(/^\s*['"]use client['"]/.test(content))for(const s of authoredStrings(file,content))client.add(s);}}}
clientWalk('app');
for(const file of ['lib/project-review-flow.ts','lib/organization-metrics.ts'])for(const s of authoredStrings(file,fs.readFileSync(file,'utf8')))client.add(s);
fs.writeFileSync('lib/localization/extension-client-source.json',JSON.stringify([...client].filter(s=>missing.includes(s)),null,2)+'\n');

import fs from 'node:fs';
import {POSITION_ITEMS} from '../lib/position-curriculum.ts';
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
export function positionCatalogSeed(){return POSITION_ITEMS.map(a=>{
 const kind=['exam','diagnostic'].includes(a.type)?'exercise':a.type==='project'?'project':'deliverable';
 return `insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values(${q(a.key)},${q(a.position)},${q(a.title.es)},${q(kind)},array[${a.source.competencies.map(q).join(',')}]) on conflict(content_key) do nothing;\ninsert into codezero_private.position_assessments(activity_key,position_key,level_number,lesson_number,item_type,correct_answers,option_counts) values(${q(a.key)},${q(a.position)},${a.level},${a.lesson??'null'},${q(a.type)},array[${a.decisions.map(q=>q.correct).join(',')}]::integer[],array[${a.decisions.map(q=>q.options.length).join(',')}]::integer[]) on conflict(activity_key) do nothing;`;
 }).join('\n')+'\n';}
if(process.argv[1]?.endsWith('position-catalog.mjs'))process.stdout.write(positionCatalogSeed());

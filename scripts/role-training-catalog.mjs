// Offline, idempotent bootstrap data. SQL is reviewed before executing in sandbox.
import {pathToFileURL} from 'node:url';
import {TRAINING_ACTIVITIES} from '../lib/role-training-content.ts';
import {DEFAULT_JOB_PROFILES} from '../lib/competency-matrix.ts';
export function trainingCatalogSeed(){
 const q=v=>"'"+String(v).replaceAll("'","''")+"'";
 return TRAINING_ACTIVITIES.map(a=>`insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values(${q(a.key)},${q(a.route)},${q(a.title)},${q(a.kind)},array[${a.competencies.map(q).join(',')}]) on conflict(content_key) do nothing;`).join('\n')+'\n'+DEFAULT_JOB_PROFILES.map(p=>`insert into public.learning_job_profiles(position_key,version,weights,expected) values(${q(p.position_key)},1,${q(JSON.stringify(p.weights))}::jsonb,${q(JSON.stringify(p.expected))}::jsonb) on conflict(position_key,version) do nothing;`).join('\n')+'\n';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)process.stdout.write(trainingCatalogSeed());

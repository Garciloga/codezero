import {pathToFileURL} from 'node:url';
import {PROFESSIONAL_ACTIVITIES} from '../lib/professional-route-content.ts';
export function professionalCatalogSeed(activities=PROFESSIONAL_ACTIVITIES){
 const q=v=>"'"+String(v).replaceAll("'","''")+"'";
 return activities.map(a=>`insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values(${q(a.key)},${q(a.route)},${q(a.title)},${q(a.kind)},array[${a.competencies.map(q).join(',')}]) on conflict(content_key) do nothing;`).join('\n')+'\n';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)process.stdout.write(professionalCatalogSeed());


import {redirect} from 'next/navigation';
import {getServerUser} from '../../../lib/supabase-server';
import {createAdminSupabase,requireAdmin} from '../../../lib/admin';
import LocalizedContent from '../../components/localization/server';
export default async function Metrics(){
 const {data:{user}}=await getServerUser();if(!user)redirect('/login');try{await requireAdmin(user.id);}catch{redirect('/dashboard');}
 const {data,error}=await createAdminSupabase().from('site_daily_metrics').select('day,page_key,visits').gte('day',new Date(Date.now()-30*86400000).toISOString().slice(0,10)).order('day',{ascending:false});if(error)throw Error('METRICS_UNAVAILABLE');
 return <LocalizedContent><main className="wrap"><h1>Visitas de los últimos 30 días</h1><p>Conteos agregados de páginas, sin identificadores de personas. Una página cuenta una vez por sesión del navegador. Son mediciones aproximadas: no equivalen a personas únicas ni a compras.</p><table><thead><tr><th>Día</th><th>Página</th><th>Visitas</th></tr></thead><tbody>{data?.map(row=><tr key={row.day+row.page_key}><td>{row.day}</td><td>{row.page_key}</td><td>{row.visits}</td></tr>)}</tbody></table></main></LocalizedContent>;
}

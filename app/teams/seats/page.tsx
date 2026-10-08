import {redirect} from 'next/navigation';
import {randomUUID} from 'node:crypto';
import Link from 'next/link';
import {getServerUser,createServerSupabase} from '../../../lib/supabase-server';
import {createAdminSupabase} from '../../../lib/admin';
import {getPublicPlans} from '../../../lib/public-plans-server';
import LocalizedContent from '../../components/localization/server';
import SeatPurchase from './purchase';
export default async function SeatsPage(){
 const {data:{user}}=await getServerUser();if(!user)redirect('/login');
 const supabase=await createServerSupabase();const {data:profile}=await supabase.from('profiles').select('role,status,stripe_subscription_id').eq('id',user.id).single();if(!profile||profile.status!=='active'||profile.role==='owner')redirect('/profile');
 const plans=await getPublicPlans();
 const {data:order}=await createAdminSupabase().from('company_seat_orders').select('company_name,plan_name,requested_seats,organization_id,status').eq('requester_id',user.id).eq('stripe_subscription_id',profile.stripe_subscription_id??'').maybeSingle();
 return <LocalizedContent><main className="wrap"><h1>Contratar usuarios para tu organización</h1><p>El mínimo es tu usuario más cuatro seats adicionales: cinco usuarios en total. Cada persona cuenta una vez dentro de la compañía, aunque participe en varios equipos.</p><p>Al confirmarse el pago se crea una organización con tu cuenta como responsable. Debes asignar roles, organizar equipos y configurar permisos de visibilidad antes de invitar a tus empleados. Este rol administra tu compañía; no concede propiedad de Garciloga.</p>
 {order?.organization_id&&<p><Link href={'/teams/'+order.organization_id+'/settings'}>Configurar mi organización</Link></p>}
 {plans?<SeatPurchase requestId={randomUUID()} prices={plans.filter(p=>p.name!=='free').map(p=>({name:p.name as 'starter'|'pro',cents:p.price_monthly_cents}))} existingSubscription={Boolean(profile.stripe_subscription_id)} initial={order??undefined}/>:<p role="alert">No pudimos cargar los precios. Recarga antes de contratar.</p>}
 <p>Las cuotas de ejercicios, exámenes y proyectos se mantienen por persona según el plan elegido. Los certificados y exámenes disponibles siguen incluidos dentro de esas cuotas.</p><Link className="btn secondary" href="/profile">Volver a mi cuenta</Link></main></LocalizedContent>;
}

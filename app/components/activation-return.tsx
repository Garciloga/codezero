import 'server-only';
import {createAdminSupabase} from '../../lib/admin';
import {consumeRateLimit} from '../../lib/rate-limit';
/** Called only after the dashboard has verified its user; the RPC also checks active status. */
export default async function ActivationReturn({userId}:{userId:string}){try{if((await consumeRateLimit('activation:'+userId,6,3600)).allowed)await createAdminSupabase().rpc('record_activation_return',{p_user:userId});}catch{/* Measurement failures must not prevent learning. */}return null;}

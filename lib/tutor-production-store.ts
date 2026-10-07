import 'server-only';
import {createAdminSupabase} from './admin';
import type {AtomicTutorStore} from './tutor-controlled-run';
export function productionTutorStore(userId:string,fingerprint:string):AtomicTutorStore{
 const admin=createAdminSupabase(),period=new Date().toISOString().slice(0,7)+'-01';
 const query=(id:string,values:Record<string,unknown>)=>admin.from('tutor_requests').update({...values,updated_at:new Date().toISOString()}).eq('user_id',userId).eq('period_start',period).eq('request_id',id);
 return{
  async reserve(id,bound){const {data,error}=await admin.rpc('reserve_tutor_request',{p_user:userId,p_request:id,p_fingerprint:fingerprint,p_bound:bound});if(error)throw Error(error.message);if(data!=='reserved'&&data!=='replay')throw Error('RESERVATION_FAILED');return data;},
  async claim(id){const {data,error}=await admin.from('tutor_requests').update({state:'dispatched',updated_at:new Date().toISOString()}).eq('user_id',userId).eq('period_start',period).eq('request_id',id).eq('state','reserved').select('request_id');if(error)throw error;return data?.length===1;},
  async settle(id,actual){if(!Number.isSafeInteger(actual)||actual<0)throw Error('INVALID_COST');const {error}=await query(id,{state:'settled',actual_micro_usd:actual}).in('state',['dispatched','uncertain']);if(error)throw error;},
  async uncertain(id){const {error}=await query(id,{state:'uncertain'}).eq('state','dispatched');if(error)throw error;},
 };
}

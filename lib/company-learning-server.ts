import 'server-only';
import {createAdminSupabase} from './admin';

export async function effectiveLearningPlan(userId:string,personal:string){
 const {data,error}=await createAdminSupabase().rpc('company_learning_plan',{p_actor:userId,p_org:null});
 if(error)return personal; // Fail closed if the additive layer is unavailable.
 const rank:Record<string,number>={free:0,starter:1,pro:2,enterprise:3};
 return typeof data==='string'&&(rank[data]??-1)>(rank[personal]??0)?data:personal;
}

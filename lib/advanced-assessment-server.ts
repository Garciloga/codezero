import "server-only";
import {roleTrainingSession,roleTrainingEnabled} from "./role-training-server";
import {hasCustomerSuccessCourse} from "./customer-success-course";
import {isUuid} from "./workspace-sandbox";
import type {AdvancedInput} from "./advanced-assessment";

export function decodeAdvancedInputs(body:unknown,allowPartial:boolean):{request:string|null;org:string|null;inputs:AdvancedInput[]}|null{
 if(!body||typeof body!=="object"||Array.isArray(body))return null;
 const o=body as Record<string,unknown>;
 const org=o.organization_id===null||o.organization_id===undefined||o.organization_id===""?null:o.organization_id;
 if(org!==null&&!isUuid(org))return null;
 const request=o.request_id==null?null:o.request_id;
 if(request!==null&&!isUuid(request))return null;
 if(!Array.isArray(o.inputs)||o.inputs.length>(allowPartial?8:8)||(!allowPartial&&o.inputs.length!==8))return null;
 const rows:AdvancedInput[]=[];
 for(const r of o.inputs){
  if(!r||typeof r!=="object"||Array.isArray(r))return null;
  const v=r as Record<string,unknown>;
  if(typeof v.choice!=="string"||!Object.values(v).every(x=>typeof x==="string")||Object.keys(v).some(k=>!["choice","facts","tradeoff","verification"].includes(k)))return null;
  if(["facts","tradeoff","verification"].some(k=>typeof v[k]!=="string"||String(v[k]).length>1800))return null;
  rows.push({choice:v.choice,facts:String(v.facts),tradeoff:String(v.tradeoff),verification:String(v.verification)});
 }
 return {org:org as string|null,request:request as string|null,inputs:rows};
}
export async function advancedLearner(org:string|null){
 if(!roleTrainingEnabled())return null;
 const session=await roleTrainingSession();
 if(!session||!hasCustomerSuccessCourse(session.profile))return null;
 if(org){
  const {data,error}=await session.supabase.from("organization_memberships")
   .select("user_id").eq("organization_id",org).eq("user_id",session.user.id).eq("active",true).maybeSingle();
  if(error||!data)return null;
 }
 return session;
}

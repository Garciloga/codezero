import 'server-only';
import {createAdminSupabase} from './admin';
import {workspaceUser} from './workspace-server';
import {isUuid} from './workspace-sandbox';
export async function companyContext(org:string){
 if(!isUuid(org))return null;
 const session=await workspaceUser();if(!session)return null;
 const {data:membership,error}=await session.supabase.from('organization_memberships').select('role,can_brand').eq('organization_id',org).eq('user_id',session.user.id).eq('active',true).maybeSingle();
 const {data:company,error:companyError}=await session.supabase.from('organizations').select('id,name,logo_version,cover_version').eq('id',org).eq('active',true).maybeSingle();
 if(error||companyError||!membership||!company)return null;
 const manager=['owner','admin'].includes(membership.role);
 return {...session,company,membership,manager,canBrand:manager||membership.can_brand};
}
export async function companyCapacity(org:string){
 const admin=createAdminSupabase();
 const [{data:contract,error},{data:used,error:usageError}]=await Promise.all([
 admin.from('organization_contracts').select('seat_limit,valid_until,active,plan_name').eq('organization_id',org).maybeSingle(),
 admin.rpc('company_seat_usage',{p_org:org})]);
 if(error||usageError)throw Error('COMPANY_DATA_UNAVAILABLE');
 return {contract,used:Number(used),available:contract?.active&&Date.parse(contract.valid_until)>Date.now()?Math.max(0,contract.seat_limit-Number(used)):0};
}

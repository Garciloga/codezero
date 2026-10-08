import 'server-only';
import {mixedRoleEnabled} from './mixed-role-policy';
import {createAdminSupabase} from './admin';
export async function mixedReleaseEnabled(){
 if(!mixedRoleEnabled())return false;
 const {data,error}=await createAdminSupabase().from('learning_mixed_release').select('enabled').eq('id',true).maybeSingle();
 return !error&&data?.enabled===true;
}

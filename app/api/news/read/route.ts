import {workspaceUser} from '../../../../lib/workspace-server';
import {trustedWorkspaceMutation} from '../../../../lib/workspace-sandbox';
import {LATEST_RELEASE} from '../../../../lib/release-notes';
export async function POST(req:Request){if(!trustedWorkspaceMutation(req))return new Response(null,{status:403});const s=await workspaceUser();if(!s)return new Response(null,{status:401});const {error}=await s.supabase.from('user_preferences').upsert({user_id:s.user.id,news_read:LATEST_RELEASE},{onConflict:'user_id'});return Response.json({saved:!error},{status:error?503:200});}

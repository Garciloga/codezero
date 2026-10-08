import 'server-only';
import {cookies} from 'next/headers';
import {SUPPORT_COOKIE,openSupport} from './support-session-crypto.mjs';
export async function supportSession(){return openSupport((await cookies()).get(SUPPORT_COOKIE)?.value,process.env.SUPABASE_SECRET_KEY);}

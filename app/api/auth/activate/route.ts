import {NextResponse} from 'next/server';
import {createServerSupabase} from '../../../../lib/supabase-server';
// The owner shares a one-use signup token; exchange it for SSR cookies before
// showing password setup. Admin-generated implicit links cannot use PKCE.
export async function GET(req:Request){
 const token=new URL(req.url).searchParams.get('token_hash');
 const base=process.env.NEXT_PUBLIC_APP_URL!;
 if(!token||!/^[a-f0-9]{64}$/i.test(token))return NextResponse.redirect(new URL('/login',base));
 const supabase=await createServerSupabase();
 const {error}=await supabase.auth.verifyOtp({token_hash:token,type:'signup'});
 const response=NextResponse.redirect(new URL(error?'/login':'/reset-password',base));
 response.headers.set('Cache-Control','private, no-store');
 response.headers.set('Referrer-Policy','no-referrer');
 return response;
}

import {NextResponse,type NextRequest} from 'next/server';
import {SUPPORT_COOKIE,openSupport} from './lib/support-session-crypto.mjs';
export function proxy(request:NextRequest){
 const path=request.nextUrl.pathname;const value=request.cookies.get(SUPPORT_COOKIE)?.value;
 if(value&&path!=='/api/admin/users/return'&&path!=='/support-return'){
  const support=openSupport(value,process.env.SUPABASE_SECRET_KEY);
  if(!['GET','HEAD','OPTIONS'].includes(request.method))return NextResponse.json({error:'SUPPORT_READ_ONLY'},{status:403});
  if(!support||support.expires<Date.now())return NextResponse.redirect(new URL('/support-return',request.url));
  if(path.startsWith('/auth/')||path.startsWith('/api/auth/')||path==='/reset-password')return NextResponse.redirect(new URL('/support-return',request.url));
 }
 const headers=new Headers(request.headers);headers.set('x-garciloga-path',path);return NextResponse.next({request:{headers}});
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|social/).*)']};

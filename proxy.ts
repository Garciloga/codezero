import {NextResponse,type NextRequest} from 'next/server';
export function proxy(request:NextRequest){const headers=new Headers(request.headers);headers.set('x-garciloga-path',request.nextUrl.pathname);return NextResponse.next({request:{headers}});}
export const config={matcher:['/((?!api|_next/static|_next/image|favicon.ico|social/).*)']};

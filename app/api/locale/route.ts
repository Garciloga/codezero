import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../../lib/supabase-server';
import { trustedWorkspaceMutation } from '../../../lib/workspace-sandbox';
import { LOCALE_COOKIE, validLocale } from '../../../lib/localization/shared';
export async function POST(request: Request) {
  if (!trustedWorkspaceMutation(request, process.env.NEXT_PUBLIC_APP_URL)) return new Response(null, { status: 403 });
  let data: unknown;
  try { data = await request.json(); } catch { return new Response(null, { status: 400 }); }
  const locale = data && typeof data === 'object' ? (data as Record<string, unknown>).locale : null;
  if (!validLocale(locale)) return new Response(null, { status: 400 });
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { error } = await supabase.auth.updateUser({ data: { locale } });
    if (error) return NextResponse.json({ saved: false }, { status: 503 });
  }
  const response = NextResponse.json({ saved: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  response.cookies.set(LOCALE_COOKIE, locale, { httpOnly: true, secure: new URL(request.url).protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  return response;
}

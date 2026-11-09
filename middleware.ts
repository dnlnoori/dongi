import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuth = ['/login', '/register'].includes(request.nextUrl.pathname);
  if (isDashboard && !user) {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    return NextResponse.redirect(login);
  }
  if (isAuth && user) {
    const dashboard = request.nextUrl.clone();
    dashboard.pathname = '/dashboard';
    return NextResponse.redirect(dashboard);
  }
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};

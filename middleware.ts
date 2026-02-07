import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/setup', '/api/setup-auth']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // If accessing a public route, allow it
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for session cookie to verify user authentication
  // Supabase stores the session in cookies named sb-[url]-auth-token
  const supabaseAuthCookie = request.cookies.get('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/https?:\/\//, '') + '-auth-token')
  const fallbackAuthCookie = request.cookies.get('pos_user_id') // Our custom auth cookie

  // If no auth cookies found, redirect to login
  if (!supabaseAuthCookie && !fallbackAuthCookie) {
    console.log('🔐 No session cookie found, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if the Supabase session cookie is valid (not empty)
  if (supabaseAuthCookie && supabaseAuthCookie.value === '') {
    // Try our fallback cookie
    if (!fallbackAuthCookie) {
      console.log('🔐 Empty session cookie, redirecting to login')
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Session is valid, allow the request
  console.log('✅ Session verified for:', request.nextUrl.pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     * - manifest.json
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.manifest\\.json$).*)',
  ],
}

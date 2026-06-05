import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname

  // ── CORS headers for /api/* ────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '*'
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Vary', 'Origin')

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers })
    }
  }

  const isAdminPage = pathname.startsWith('/admin/')
  const isAdminApi = pathname.startsWith('/api/admin/')

  // Skip auth checks for non-admin routes
  if (!isAdminPage && !isAdminApi) {
    return response
  }

  // ── Session via cookies (SSR) ──────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              httpOnly: true,
            })
          })
          Object.entries(headersToSet).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
        },
      },
    }
  )

  let { data: { user } } = await supabase.auth.getUser()

  // Fallback to Bearer token for API routes (mobile / explicit tokens)
  if (!user && isAdminApi) {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      )
      const { data: { user: bearerUser } } = await sb.auth.getUser()
      user = bearerUser
    }
  }

  // ── Auth check ─────────────────────────────────────────────────────────────
  if (!user) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Admin check ────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}

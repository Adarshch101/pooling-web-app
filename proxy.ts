import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()

  const token = req.cookies.get('sb-access-token')?.value
  let user = null

  if (token) {
    try {
      const { data: { user: userData } } = await supabase.auth.getUser(token)
      user = userData
    } catch (error) {
      // Token invalid, continue as unauthenticated
    }
  }

  // Protected routes
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                           req.nextUrl.pathname.startsWith('/admin') ||
                           req.nextUrl.pathname.startsWith('/polls')

  // Auth routes (redirect if already logged in)
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login') ||
                      req.nextUrl.pathname.startsWith('/signup')

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

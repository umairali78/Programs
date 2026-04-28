import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/manage/login') || pathname.startsWith('/manage/logout')) {
    return NextResponse.next()
  }

  const session = request.cookies.get('admin_session')?.value
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword || session !== adminPassword) {
    const loginUrl = new URL('/manage/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/manage/:path*',
}

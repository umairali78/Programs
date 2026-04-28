import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/query/:path*',
    '/report-bank/:path*',
    '/alerts/:path*',
    '/history/:path*',
    '/settings/:path*',
  ],
}

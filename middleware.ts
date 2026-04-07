import { NextResponse } from 'next/server'

export function middleware(req: any) {

  const isAdmin = req.cookies.get('is_admin')

  if (req.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que NÃO precisam de autenticação
const ROTAS_PUBLICAS = [
  '/login',
  '/cadastro',
  '/recuperar-senha',
  '/obra-publica',
  '/orcamento-publico',
  '/api/',
  '/_next/',
  '/favicon',
]

// Rotas que requerem autenticação
const ROTAS_PROTEGIDAS = [
  '/dashboard',
  '/obras',
  '/orcamentos',
  '/financeiro',
  '/relatorios',
  '/perfil',
  '/planos',
  '/bloqueado',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Deixa passar rotas públicas
  const ehPublica = ROTAS_PUBLICAS.some(r => pathname.startsWith(r))
  if (ehPublica) return NextResponse.next()

  // Verifica se é rota protegida
  const ehProtegida = ROTAS_PROTEGIDAS.some(r => pathname.startsWith(r))
  if (!ehProtegida) return NextResponse.next()

  // Verifica cookie de sessão do Supabase
  const token = req.cookies.get('sb-access-token')?.value
    || req.cookies.get('sb-cpyvksnsfihybemvxvap-auth-token')?.value
    || getCookieByPattern(req, 'sb-')

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Admin check
  const isAdmin = req.cookies.get('is_admin')
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

function getCookieByPattern(req: NextRequest, pattern: string): string | undefined {
  for (const [key, cookie] of req.cookies) {
    if (key.startsWith(pattern) && key.includes('auth-token')) {
      return cookie
    }
  }
  return undefined
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
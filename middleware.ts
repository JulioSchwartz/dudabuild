import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROTAS_PUBLICAS = [
  '/login',
  '/cadastro',
  '/recuperar-senha',
  '/nova-senha',
  '/obra-publica',
  '/orcamento-publico',
  '/api/',
  '/_next/',
  '/favicon',
]

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

  const ehPublica = ROTAS_PUBLICAS.some(r => pathname.startsWith(r))
  if (ehPublica) return NextResponse.next()

  const ehProtegida = ROTAS_PROTEGIDAS.some(r => pathname.startsWith(r))
  if (!ehProtegida) return NextResponse.next()

  // DEBUG — loga todos os cookies
  const todosCookies = req.cookies.getAll()
  console.log('=== MIDDLEWARE DEBUG ===')
  console.log('Pathname:', pathname)
  console.log('Cookies:', todosCookies.map(c => c.name))

  const temSessao = todosCookies.some(cookie =>
    cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')
  )

  console.log('Tem sessão:', temSessao)

  if (!temSessao) {
    console.log('BLOQUEADO — redirecionando para /login')
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
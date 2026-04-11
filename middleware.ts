import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware simplificado — proteção de rotas feita no cliente via useEmpresa
// Para usar cookies de sessão, migrar para @supabase/ssr futuramente

export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
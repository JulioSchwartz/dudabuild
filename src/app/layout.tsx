'use client'

import './globals.css'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [liberado, setLiberado] = useState(false)

  useEffect(() => {
    verificarAcesso()
  }, [pathname])

  async function verificarAcesso() {
    const empresa_id = localStorage.getItem('empresa_id')

    // 🔓 páginas públicas
    if (pathname === '/login') {
      setLiberado(true)
      return
    }

    if (!empresa_id) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('empresa_id', empresa_id)
      .eq('status', 'ativa')

    if (!data || data.length === 0) {
      router.push('/pagar')
      return
    }

    setLiberado(true)
  }

  function logout() {
    localStorage.removeItem('empresa_id')
    router.push('/login')
  }

  if (!liberado) return <div style={{ padding: 20 }}>Carregando...</div>

  return (
    <html lang="pt-BR">
      <body style={body}>
        <div style={container}>
          {/* SIDEBAR */}
          <aside style={sidebar}>
            <div style={logo}>DudaBuild</div>

            <NavItem label="Dashboard" path="/dashboard" active={pathname === '/dashboard'} />
            <NavItem label="Obras" path="/obras" active={pathname.startsWith('/obras')} />
            <NavItem label="Financeiro" path="/financeiro" active={pathname.startsWith('/financeiro')} />
            <NavItem label="Orçamentos" path="/orcamentos" active={pathname.startsWith('/orcamentos')} />

            <div style={{ marginTop: '20px' }}>
              <button style={btnUpgrade} onClick={() => router.push('/pagar')}>
                💎 Assinar Plano
              </button>
            </div>

            {/* LOGOUT */}
            <div style={{ marginTop: 'auto' }}>
              <button style={btnLogout} onClick={logout}>
                🚪 Sair
              </button>
            </div>
          </aside>

          {/* CONTEÚDO */}
          <main style={content}>{children}</main>
        </div>
      </body>
    </html>
  )
}

/* MENU */
function NavItem({ label, path, active }: any) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(path)}
      style={{
        ...navItem,
        background: active ? '#2563eb' : 'transparent',
        color: active ? '#fff' : '#cbd5f5',
      }}
    >
      {label}
    </button>
  )
}

/* ESTILO */

const body = {
  margin: 0,
  fontFamily: 'Inter, Arial, sans-serif',
  background: '#f1f5f9',
}

const container = {
  display: 'flex',
  minHeight: '100vh',
}

const sidebar = {
  width: '240px',
  background: '#0f172a',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column' as const,
  padding: '25px 15px',
  gap: '8px',
}

const logo = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '20px',
}

const navItem = {
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  textAlign: 'left' as const,
  cursor: 'pointer',
}

const btnUpgrade = {
  background: '#22c55e',
  color: '#fff',
  border: 'none',
  padding: '12px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
}

const btnLogout = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  padding: '12px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  width: '100%',
}

const content = {
  flex: 1,
  padding: '25px',
  background: '#f8fafc',
}
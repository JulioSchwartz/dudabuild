'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientLayout({ children }: any) {
  const pathname = usePathname()
  const router = useRouter()
  const [liberado, setLiberado] = useState(false)
  const [pendentes, setPendentes] = useState(0)

  useEffect(() => {
    verificarAcesso()
    carregarPendentes()
  }, [pathname])

  async function verificarAcesso() {
    const empresa_id = localStorage.getItem('empresa_id')

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

  async function carregarPendentes() {
    const empresa_id = localStorage.getItem('empresa_id')
    if (!empresa_id) return

    const { data } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('empresa_id', empresa_id)
      .eq('status', 'pendente')

    setPendentes(data?.length || 0)
  }

  function logout() {
    localStorage.removeItem('empresa_id')
    router.push('/login')
  }

  if (!liberado) return <div style={{ padding: 20 }}>Carregando...</div>

  return (
    <div style={container}>
      <aside style={sidebar}>
        <div style={logo}>DudaBuild</div>

        <NavItem label="Dashboard" path="/dashboard" active={pathname === '/dashboard'} />
        <NavItem label="Obras" path="/obras" active={pathname.startsWith('/obras')} />
        <NavItem label="Financeiro" path="/financeiro" active={pathname.startsWith('/financeiro')} />

        <NavItem
          label={`Orçamentos ${pendentes > 0 ? `(${pendentes})` : ''}`}
          path="/orcamentos"
          active={pathname.startsWith('/orcamentos')}
        />

        <div style={{ marginTop: '20px' }}>
          <button style={btnUpgrade} onClick={() => router.push('/pagar')}>
            💎 Assinar Plano
          </button>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button style={btnLogout} onClick={logout}>
            🚪 Sair
          </button>
        </div>
      </aside>

      <main style={content}>{children}</main>
    </div>
  )
}

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
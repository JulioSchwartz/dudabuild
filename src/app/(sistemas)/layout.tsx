'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SistemaLayout({ children }: any) {
  const router = useRouter()
  const pathname = usePathname()
  const [liberado, setLiberado] = useState(false)

  useEffect(() => {
    verificar()
  }, [pathname])

  async function verificar() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!usuario?.empresa_id) {
      router.push('/login')
      return
    }

    const { data: empresa } = await supabase
      .from('empresas')
      .select('status')
      .eq('id', usuario.empresa_id)
      .maybeSingle()

    if (empresa?.status !== 'ativo') {
      router.push('/bloqueado')
      return
    }

    setLiberado(true)
  }

  async function sair() {
    await supabase.auth.signOut()
    localStorage.removeItem('empresa_id')
    router.push('/login')
  }

  if (!liberado) return null

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f1f5f9' }}>

      {/* SIDEBAR */}
      <aside style={sidebar}>

  <div>
    <img src="/logo.png" style={{ width: 140, marginBottom: 20 }} />

    <MenuItem texto="Dashboard" rota="/dashboard" ativo={pathname === '/dashboard'} />
    <MenuItem texto="Obras" rota="/obras" ativo={pathname.includes('/obras')} />
    <MenuItem texto="Financeiro" rota="/financeiro" ativo={pathname.includes('/financeiro')} />
    <MenuItem texto="Orçamentos" rota="/orcamentos" ativo={pathname.includes('/orcamentos')} />
  </div>

  <button onClick={sair} style={logout}>
    Sair
  </button>

</aside>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* HEADER */}
        <header style={header}>
          <span style={{ fontWeight: 600 }}>Sistema de Gestão</span>
          <span style={{ color: '#64748b' }}>Construtora</span>
        </header>

        {/* PAGE */}
        <main style={content}>
          {children}
        </main>

      </div>
    </div>
  )
}

function MenuItem({ texto, rota, ativo }: any) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(rota)}
      style={{
        ...menuItem,
        background: ativo ? '#1e293b' : 'transparent',
        color: ativo ? '#fff' : '#cbd5e1'
      }}
    >
      {texto}
    </div>
  )
}

/* 🎨 ESTILO PREMIUM */

const sidebar = {
  width: 240,
  background: '#0f172a',
  color: '#fff',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
}

const logo = {
  marginBottom: 30,
  fontSize: 20
}

const menuItem = {
  padding: '12px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  marginBottom: 8,
  transition: '0.2s'
}

const header = {
  height: 60,
  background: '#fff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 20px',
  borderBottom: '1px solid #e2e8f0'
}

const content = {
  padding: 30,
  overflow: 'auto'
}

const logout = {
  background: '#ef4444',
  border: 'none',
  color: '#fff',
  padding: 10,
  borderRadius: 8,
  cursor: 'pointer'
}
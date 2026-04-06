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
    <div style={container}>

      {/* 🔥 SIDEBAR PREMIUM */}
      <aside style={sidebar}>

        <div>

          <div style={logoBox}>
            <img src="/logo.png" style={{ width: 120 }} />
            <p style={logoText}>DudaBuild</p>
          </div>

          <MenuItem texto="🏠 Dashboard" rota="/dashboard" ativo={pathname === '/dashboard'} />
          <MenuItem texto="🏗️ Obras" rota="/obras" ativo={pathname.includes('/obras')} />
          <MenuItem texto="💰 Financeiro" rota="/financeiro" ativo={pathname.includes('/financeiro')} />
          <MenuItem texto="🧾 Orçamentos" rota="/orcamentos" ativo={pathname.includes('/orcamentos')} />
          <MenuItem texto="📊 Relatórios" rota="/relatorios" ativo={pathname.includes('/relatorios')} />

        </div>

        <button onClick={sair} style={logout}>
          Sair
        </button>

      </aside>

      {/* 🔥 CONTEÚDO */}
      <div style={main}>

        {/* HEADER */}
        <header style={header}>
          <div>
            <strong>Sistema de Gestão</strong>
            <p style={subHeader}>Construtora</p>
          </div>

          <div style={userBox}>
            <span>👤 Usuário</span>
          </div>
        </header>

        {/* PÁGINA */}
        <main style={content}>
          {children}
        </main>

      </div>

    </div>
  )
}

/* ================= COMPONENTE MENU ================= */

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

/* ================= ESTILO ================= */

const container = {
  display: 'flex',
  height: '100vh',
  background: '#f1f5f9'
}

const sidebar = {
  width: 260,
  background: '#020617',
  color: '#fff',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
}

const logoBox = {
  marginBottom: 30
}

const logoText = {
  marginTop: 8,
  fontSize: 14,
  color: '#94a3b8'
}

const menuItem = {
  padding: '12px 14px',
  borderRadius: 10,
  cursor: 'pointer',
  marginBottom: 8,
  transition: '0.2s',
  fontSize: 14
}

const main = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column'
}

const header = {
  height: 70,
  background: '#fff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 24px',
  borderBottom: '1px solid #e2e8f0'
}

const subHeader = {
  fontSize: 12,
  color: '#64748b'
}

const userBox = {
  background: '#f1f5f9',
  padding: '6px 10px',
  borderRadius: 8
}

const content = {
  padding: 30,
  overflow: 'auto'
}

const logout = {
  background: '#ef4444',
  border: 'none',
  color: '#fff',
  padding: 12,
  borderRadius: 10,
  cursor: 'pointer'
}
'use client'
 
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
 
export default function SistemaLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
 
  const [liberado,    setLiberado]    = useState(false)
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
 
  useEffect(() => {
    verificar()
  }, [pathname])
 
  async function verificar() {
    try {
      // 1️⃣ Verifica sessão
      const { data: { session }, error: errSession } = await supabase.auth.getSession()
 
      if (errSession || !session) {
        router.push('/login')
        return
      }
 
      // 2️⃣ Busca dados via RPC — SECURITY DEFINER, ignora RLS, sem erro 400/403
      const { data, error } = await supabase.rpc('get_dados_empresa')
 
      if (error || !data) {
        console.error('Erro RPC:', error)
        router.push('/login')
        return
      }
 
      // 3️⃣ Verifica status — 'active' (inglês, não 'ativo')
      if (data.status !== 'active') {
        router.push('/bloqueado')
        return
      }
 
      setNomeUsuario(data.nome_usuario || session.user.email || 'Usuário')
      setNomeEmpresa(data.nome_empresa || 'Minha Empresa')
      setLiberado(true)
 
    } catch (err) {
      console.error('Erro ao verificar sessão:', err)
      router.push('/login')
    }
  }
 
  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }
 
  if (!liberado) {
    return (
      <div style={loadingScreen}>
        <div style={loadingSpinner} />
        <p style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>Carregando...</p>
      </div>
    )
  }
 
  return (
    <div style={container}>
 
      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside style={sidebar}>
 
        <div>
          <div style={logoBox}>
            <img src="/logo.png" alt="Logo" style={{ width: 110, display: 'block' }} />
            <p style={logoText}>DudaBuild</p>
          </div>
 
          <div style={divider} />
 
          <nav>
            <p style={menuLabel}>MENU</p>
            <MenuItem texto="🏠  Dashboard"  rota="/dashboard"  ativo={pathname === '/dashboard'} />
            <MenuItem texto="🏗️  Obras"       rota="/obras"      ativo={pathname.startsWith('/obras')} />
            <MenuItem texto="💰  Financeiro"  rota="/financeiro" ativo={pathname.startsWith('/financeiro')} />
            <MenuItem texto="🧾  Orçamentos"  rota="/orcamentos" ativo={pathname.startsWith('/orcamentos')} />
            <MenuItem texto="📊  Relatórios"  rota="/relatorios" ativo={pathname.startsWith('/relatorios')} />
          </nav>
        </div>
 
        <div>
          <div style={divider} />
 
          <div style={userInfo}>
            <div style={avatar}>
              {nomeUsuario.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={userName}>{nomeUsuario}</p>
              <p style={userCompany}>{nomeEmpresa}</p>
            </div>
          </div>
 
          <button onClick={sair} style={btnSair}>
            <span>⏻</span> Sair da conta
          </button>
        </div>
 
      </aside>
 
      {/* ── CONTEÚDO ────────────────────────────────────── */}
      <div style={mainWrapper}>
 
        <header style={topbar}>
          <div>
            <strong style={topbarTitle}>{tituloPagina(pathname)}</strong>
            <p style={topbarSub}>Sistema de Gestão · DudaBuild</p>
          </div>
 
          <button onClick={() => router.push('/planos')} style={btnUpgrade}>
            ⚡ Upgrade
          </button>
        </header>
 
        <main style={content}>
          {children}
        </main>
 
      </div>
 
    </div>
  )
}
 
/* ================= HELPERS ================= */
 
function tituloPagina(pathname: string): string {
  if (pathname === '/dashboard')          return 'Dashboard'
  if (pathname.startsWith('/obras'))      return 'Obras'
  if (pathname.startsWith('/financeiro')) return 'Financeiro'
  if (pathname.startsWith('/orcamentos')) return 'Orçamentos'
  if (pathname.startsWith('/relatorios')) return 'Relatórios'
  return 'Sistema'
}
 
/* ================= MENU ITEM ================= */
 
function MenuItem({ texto, rota, ativo }: { texto: string; rota: string; ativo: boolean }) {
  const router = useRouter()
 
  return (
    <div
      onClick={() => router.push(rota)}
      style={{
        ...menuItem,
        background: ativo ? '#1e3a5f' : 'transparent',
        color:      ativo ? '#fff'    : '#94a3b8',
        borderLeft: ativo ? '3px solid #3b82f6' : '3px solid transparent',
      }}
      onMouseEnter={e => {
        if (!ativo) {
          (e.currentTarget as HTMLDivElement).style.background = '#0f172a'
          ;(e.currentTarget as HTMLDivElement).style.color = '#e2e8f0'
        }
      }}
      onMouseLeave={e => {
        if (!ativo) {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLDivElement).style.color = '#94a3b8'
        }
      }}
    >
      {texto}
    </div>
  )
}
 
/* ================= ESTILOS ================= */
 
const loadingScreen: React.CSSProperties = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#020617'
}
 
const loadingSpinner: React.CSSProperties = {
  width: 36,
  height: 36,
  border: '3px solid #1e293b',
  borderTop: '3px solid #3b82f6',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite'
}
 
const container: React.CSSProperties = {
  display: 'flex',
  height: '100vh',
  background: '#f1f5f9',
  overflow: 'hidden'
}
 
const sidebar: React.CSSProperties = {
  width: 260,
  minWidth: 260,
  background: '#020617',
  color: '#fff',
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
  zIndex: 10
}
 
const logoBox: React.CSSProperties = { marginBottom: 20, paddingLeft: 4 }
 
const logoText: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  fontWeight: 700,
  color: '#475569',
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
}
 
const divider: React.CSSProperties = {
  height: 1,
  background: '#1e293b',
  margin: '12px 0'
}
 
const menuLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: '#475569',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '8px 14px 4px'
}
 
const menuItem: React.CSSProperties = {
  padding: '11px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  marginBottom: 4,
  fontSize: 14,
  fontWeight: 500,
  transition: 'background 0.15s, color 0.15s',
  display: 'flex',
  alignItems: 'center',
  gap: 8
}
 
const userInfo: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 4px',
  marginBottom: 10
}
 
const avatar: React.CSSProperties = {
  width: 36,
  height: 36,
  minWidth: 36,
  borderRadius: '50%',
  background: '#1d4ed8',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: 15
}
 
const userName: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#e2e8f0',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}
 
const userCompany: React.CSSProperties = {
  fontSize: 11,
  color: '#475569',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}
 
const btnSair: React.CSSProperties = {
  width: '100%',
  background: '#1e293b',
  border: '1px solid #334155',
  color: '#94a3b8',
  padding: '10px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'background 0.15s'
}
 
const mainWrapper: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}
 
const topbar: React.CSSProperties = {
  height: 64,
  background: '#fff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 28px',
  borderBottom: '1px solid #e2e8f0',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  flexShrink: 0
}
 
const topbarTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#0f172a'
}
 
const topbarSub: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
  marginTop: 2
}
 
const btnUpgrade: React.CSSProperties = {
  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
  color: '#fff',
  border: 'none',
  padding: '8px 18px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer'
}
 
const content: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 28,
  background: '#f8fafc'
}
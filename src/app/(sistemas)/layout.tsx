'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Plano = 'basico' | 'pro' | 'premium'

export default function SistemaLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [liberado,    setLiberado]    = useState(false)
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [plano,       setPlano]       = useState<Plano>('basico')

  useEffect(() => {
    verificar()
  }, [pathname])

  async function verificar() {
    try {
      const { data: { session }, error: errSession } = await supabase.auth.getSession()
      if (errSession || !session) { router.push('/login'); return }

      const { data, error } = await supabase.rpc('get_dados_empresa')
      if (error || !data) { router.push('/login'); return }

      if (data.status === 'canceled' || data.status === 'past_due') {
        router.push('/bloqueado')
        return
      }

      setNomeUsuario(data.nome_usuario || session.user.email || 'Usuário')
      setNomeEmpresa(data.nome_empresa || 'Minha Empresa')
      setPlano((data.plano || 'basico') as Plano)
      setLiberado(true)
    } catch {
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
        <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan" style={{ width: 140, marginBottom: 16 }} />
        <div style={loadingSpinner} />
        <p style={{ color: '#64748b', marginTop: 16, fontSize: 13, letterSpacing: '0.05em' }}>
          Carregando...
        </p>
      </div>
    )
  }

  const inicialUsuario = nomeUsuario.charAt(0).toUpperCase()

  return (
    <div style={container}>

      {/* ── SIDEBAR ── */}
      <aside style={sidebar}>
        <div>
          {/* Logo */}
          <div style={logoBox}>
            <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan" style={{ width: 130, display: 'block' }} />
          </div>

          <div style={divider} />

          {/* Badge do plano */}
          <div style={planoBadgeWrap}>
            <span style={planoBadge(plano)}>
              {plano === 'premium' ? '⭐ Premium' : plano === 'pro' ? '🚀 Pro' : '🔹 Básico'}
            </span>
            <span style={planoNome}>{nomeEmpresa}</span>
          </div>

          <div style={divider} />

          {/* Menu principal */}
          <nav>
            <p style={menuLabel}>MENU</p>
            <MenuItem texto="🏠" label="Dashboard"         rota="/dashboard"  ativo={pathname === '/dashboard'} />
            <MenuItem texto="🏗️" label="Obras"             rota="/obras"      ativo={pathname.startsWith('/obras')} />
            <MenuItem texto="💰" label="Financeiro"        rota="/financeiro" ativo={pathname.startsWith('/financeiro')} />
            <MenuItem texto="🧾" label="Orçamentos"        rota="/orcamentos" ativo={pathname.startsWith('/orcamentos')} />
            <MenuItem texto="📊" label="Relatórios"        rota="/relatorios" ativo={pathname.startsWith('/relatorios')} />

            <div style={divider} />
            <p style={menuLabel}>CONFIGURAÇÕES</p>
            <MenuItem texto="🏢" label="Perfil da Empresa" rota="/perfil"  ativo={pathname.startsWith('/perfil')} />
            {plano !== 'premium' && (
              <MenuItem texto="⚡" label="Planos & Upgrade" rota="/planos" ativo={pathname.startsWith('/planos')} destaque />
            )}
          </nav>
        </div>

        {/* Rodapé do sidebar */}
        <div>
          <div style={divider} />
          <div style={userInfo}>
            <div style={avatar}>{inicialUsuario}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={userName} title={nomeUsuario}>{nomeUsuario}</p>
              <p style={userRole}>Administrador</p>
            </div>
          </div>
          <button onClick={sair} style={btnSair}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1e293b'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}
          >
            <span style={{ fontSize: 15 }}>⏻</span> Sair da conta
          </button>
          <p style={versao}>Zynplan v1.0</p>
        </div>
      </aside>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <div style={mainWrapper}>
        <header style={topbar}>
          <div>
            <strong style={topbarTitle}>{tituloPagina(pathname)}</strong>
            <p style={topbarSub}>Sistema de Gestão · Zynplan</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {plano !== 'premium' && (
              <button onClick={() => router.push('/planos')} style={btnUpgrade}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
              >
                ⚡ Upgrade
              </button>
            )}
            <div style={topbarUser}>
              <div style={topbarAvatar}>{inicialUsuario}</div>
              <div style={{ lineHeight: 1.3 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{nomeUsuario}</p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>{nomeEmpresa}</p>
              </div>
            </div>
          </div>
        </header>
        <main style={content}>{children}</main>
      </div>

    </div>
  )
}

function tituloPagina(pathname: string): string {
  if (pathname === '/dashboard')          return 'Dashboard'
  if (pathname.startsWith('/obras'))      return 'Obras'
  if (pathname.startsWith('/financeiro')) return 'Financeiro'
  if (pathname.startsWith('/orcamentos')) return 'Orçamentos'
  if (pathname.startsWith('/relatorios')) return 'Relatórios'
  if (pathname.startsWith('/perfil'))     return 'Perfil da Empresa'
  if (pathname.startsWith('/planos'))     return 'Planos'
  return 'Sistema'
}

function MenuItem({ texto, label, rota, ativo, destaque = false }: {
  texto: string; label: string; rota: string; ativo: boolean; destaque?: boolean
}) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(rota)}
      style={{
        ...menuItem,
        background: ativo ? 'rgba(184,142,61,0.15)' : 'transparent',
        color:      ativo ? '#d4a843' : destaque ? '#fbbf24' : '#94a3b8',
        borderLeft: ativo ? '3px solid #d4a843' : '3px solid transparent',
        fontWeight: ativo ? 600 : 500,
      }}
      onMouseEnter={e => {
        if (!ativo) {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'
          ;(e.currentTarget as HTMLDivElement).style.color = destaque ? '#fde68a' : '#e2e8f0'
        }
      }}
      onMouseLeave={e => {
        if (!ativo) {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLDivElement).style.color = destaque ? '#fbbf24' : '#94a3b8'
        }
      }}
    >
      <span style={{ fontSize: 16, minWidth: 20, textAlign: 'center' }}>{texto}</span>
      <span>{label}</span>
    </div>
  )
}

/* ── ESTILOS ── */
const loadingScreen: React.CSSProperties      = { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020617' }
const loadingSpinner: React.CSSProperties     = { width: 32, height: 32, border: '3px solid #1e293b', borderTop: '3px solid #d4a843', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }
const container: React.CSSProperties         = { display: 'flex', height: '100vh', background: '#f1f5f9', overflow: 'hidden' }
const sidebar: React.CSSProperties           = { width: 256, minWidth: 256, background: '#020617', color: '#fff', padding: '20px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '4px 0 24px rgba(0,0,0,0.35)', zIndex: 10, overflowY: 'auto' }
const logoBox: React.CSSProperties           = { padding: '4px 8px 12px' }
const divider: React.CSSProperties           = { height: 1, background: '#0f172a', margin: '10px 0' }
const planoBadgeWrap: React.CSSProperties    = { padding: '6px 8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }
const planoBadge = (plano: Plano): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
  padding: '4px 10px', borderRadius: 999, width: 'fit-content',
  background: plano === 'premium' ? 'rgba(212,168,67,0.15)' : plano === 'pro' ? 'rgba(139,92,246,0.15)' : 'rgba(212,168,67,0.1)',
  color:      plano === 'premium' ? '#d4a843' : plano === 'pro' ? '#a78bfa' : '#d4a843',
  border:     `1px solid ${plano === 'premium' ? 'rgba(212,168,67,0.4)' : plano === 'pro' ? 'rgba(139,92,246,0.3)' : 'rgba(212,168,67,0.25)'}`,
})
const planoNome: React.CSSProperties   = { fontSize: 13, fontWeight: 600, color: '#e2e8f0', paddingLeft: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const menuLabel: React.CSSProperties   = { fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 12px 4px' }
const menuItem: React.CSSProperties    = { padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, fontSize: 13, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10 }
const userInfo: React.CSSProperties    = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px 10px' }
const avatar: React.CSSProperties      = { width: 34, height: 34, minWidth: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }
const userName: React.CSSProperties    = { fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const userRole: React.CSSProperties    = { fontSize: 11, color: '#334155', marginTop: 1 }
const btnSair: React.CSSProperties     = { width: '100%', background: 'transparent', border: '1px solid #1e293b', color: '#64748b', padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s', marginBottom: 8 }
const versao: React.CSSProperties      = { fontSize: 10, color: '#1e293b', textAlign: 'center', letterSpacing: '0.08em', marginTop: 4 }
const mainWrapper: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
const topbar: React.CSSProperties      = { height: 64, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 28px', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', flexShrink: 0 }
const topbarTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#0f172a' }
const topbarSub: React.CSSProperties   = { fontSize: 11, color: '#94a3b8', marginTop: 2 }
const topbarUser: React.CSSProperties  = { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }
const topbarAvatar: React.CSSProperties = { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }
const btnUpgrade: React.CSSProperties  = { background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }
const content: React.CSSProperties     = { flex: 1, overflowY: 'auto', padding: 28, background: '#f8fafc' }
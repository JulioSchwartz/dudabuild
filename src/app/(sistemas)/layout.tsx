'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function SistemaLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const {
    nomeUsuario, nomeEmpresa, plano, perfil,
    bloqueado, loading, diasRestantes, trialExpirado,
  } = useEmpresa()

  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    if (loading) return
    if (bloqueado) { router.push('/bloqueado'); return }

    // Guards de perfil — redireciona se tentar acessar página sem permissão
    const rotasAdminOnly     = ['/equipe', '/planos', '/perfil']
    const rotasFinanceiroOk  = ['/dashboard', '/financeiro']
    const rotasMestreOk      = ['/dashboard', '/financeiro', '/obras']

    if (perfil === 'financeiro' && !rotasFinanceiroOk.some(r => pathname.startsWith(r))) {
      router.push('/financeiro'); return
    }
    if (perfil === 'mestre_obra' && !rotasMestreOk.some(r => pathname.startsWith(r))) {
      router.push('/obras'); return
    }
    if (perfil !== 'admin' && rotasAdminOnly.some(r => pathname.startsWith(r))) {
      router.push('/dashboard'); return
    }

    setPronto(true)
  }, [loading, bloqueado, perfil, pathname])

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading || !pronto) {
    return (
      <div style={loadingScreen}>
        <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan"
          style={{ width: 160, marginBottom: 20, mixBlendMode: 'screen' }} />
        <div style={loadingSpinner} />
        <p style={{ color: '#64748b', marginTop: 16, fontSize: 13 }}>Carregando...</p>
      </div>
    )
  }

  const inicialUsuario = nomeUsuario.charAt(0).toUpperCase()
  const mostrarBanner  = !trialExpirado && diasRestantes !== null && diasRestantes <= 3
  const labelUpgrade   = diasRestantes !== null && !trialExpirado ? `⚡ Trial: ${diasRestantes}d` : '⚡ Upgrade'

  const perfilLabel =
    perfil === 'admin'       ? 'Administrador'  :
    perfil === 'engenheiro'  ? 'Engenheiro'     :
    perfil === 'financeiro'  ? 'Financeiro'     :
                               'Mestre de Obra'

  // Visibilidade dos itens de menu por perfil
  const podeVerObras      = perfil !== 'financeiro'
  const podeVerOrcamentos = perfil === 'admin' || perfil === 'engenheiro'
  const podeVerRelatorios = perfil === 'admin' || perfil === 'engenheiro' || perfil === 'financeiro'
  const podeVerEquipe     = perfil === 'admin' && plano === 'premium'
  const podeVerPerfil     = perfil === 'admin'
  const podeVerPlanos     = perfil === 'admin'

  return (
    <div style={container}>

      {/* ── SIDEBAR ── */}
      <aside style={sidebar}>
        <div>
          <div style={logoBox}>
            <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan"
              style={{ width: 200, display: 'block', mixBlendMode: 'screen' }} />
          </div>

          <div style={divider} />

          <div style={planoBadgeWrap}>
            <span style={badgePlano(plano)}>
              {plano === 'premium' ? '⭐ Premium' : plano === 'pro' ? '🚀 Pro' : '🔹 Básico'}
            </span>
            {diasRestantes !== null && !trialExpirado && (
              <span style={badgeTrial(diasRestantes)}>
                {diasRestantes === 0
                  ? '⚠️ Trial expira hoje!'
                  : `⏱ Trial: ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`}
              </span>
            )}
            <span style={planoNome}>{nomeEmpresa}</span>
          </div>

          <div style={divider} />

          <nav>
            <p style={menuLabel}>MENU</p>
            <MenuItem texto="🏠" label="Dashboard"  rota="/dashboard"  ativo={pathname === '/dashboard'} />
            {podeVerObras      && <MenuItem texto="🏗️" label="Obras"        rota="/obras"      ativo={pathname.startsWith('/obras')} />}
            <MenuItem          texto="💰" label="Financeiro"  rota="/financeiro" ativo={pathname.startsWith('/financeiro')} />
            {podeVerOrcamentos && <MenuItem texto="🧾" label="Orçamentos"   rota="/orcamentos" ativo={pathname.startsWith('/orcamentos')} />}
            {podeVerRelatorios && <MenuItem texto="📊" label="Relatórios"   rota="/relatorios" ativo={pathname.startsWith('/relatorios')} />}
            {podeVerEquipe     && <MenuItem texto="👥" label="Equipe"       rota="/equipe"     ativo={pathname.startsWith('/equipe')} />}
            <div style={divider} />
            <p style={menuLabel}>CONFIGURAÇÕES</p>
            {podeVerPerfil && <MenuItem texto="🏢" label="Perfil da Empresa" rota="/perfil"  ativo={pathname.startsWith('/perfil')} />}
            {podeVerPlanos && <MenuItem texto="💳" label="Planos & Upgrade"  rota="/planos" ativo={pathname.startsWith('/planos')} destaque />}
          </nav>
        </div>

        <div>
          <div style={divider} />
          <div style={userInfo}>
            <div style={avatar}>{inicialUsuario}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={userName} title={nomeUsuario}>{nomeUsuario}</p>
              <p style={userRole}>{perfilLabel}</p>
            </div>
          </div>
          <button onClick={sair} style={btnSair}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}
          >
            <span>⏻</span> Sair da conta
          </button>
          <p style={versao}>Zynplan v1.0</p>
        </div>
      </aside>

      {/* ── CONTEÚDO ── */}
      <div style={mainWrapper}>

        {/* Banner trial expirando (últimos 3 dias) */}
        {mostrarBanner && (
          <div style={bannerTrial(diasRestantes!)}>
            <span>
              {diasRestantes === 0
                ? '⚠️ Seu trial expira hoje! Assine agora para não perder o acesso.'
                : `⏱ Seu trial expira em ${diasRestantes} dia${diasRestantes! > 1 ? 's' : ''}. Aproveite para assinar!`}
            </span>
            <button onClick={() => router.push('/planos')} style={btnBanner}>
              Ver planos →
            </button>
          </div>
        )}

        <header style={topbar}>
          <div>
            <strong style={topbarTitle}>{tituloPagina(pathname)}</strong>
            <p style={topbarSub}>Sistema de Gestão · Zynplan</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {podeVerPlanos && (
              <button onClick={() => router.push('/planos')} style={btnUpgrade}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
              >
                {labelUpgrade}
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
  if (pathname.startsWith('/equipe'))     return 'Equipe'
  if (pathname.startsWith('/perfil'))     return 'Perfil da Empresa'
  if (pathname.startsWith('/planos'))     return 'Planos'
  return 'Sistema'
}

function MenuItem({ texto, label, rota, ativo, destaque = false }: {
  texto: string; label: string; rota: string; ativo: boolean; destaque?: boolean
}) {
  const router = useRouter()
  return (
    <div onClick={() => router.push(rota)} style={{
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
const loadingScreen: React.CSSProperties  = { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' }
const loadingSpinner: React.CSSProperties = { width: 32, height: 32, border: '3px solid #1e293b', borderTop: '3px solid #d4a843', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }
const container: React.CSSProperties      = { display: 'flex', height: '100vh', background: '#f1f5f9', overflow: 'hidden' }
const sidebar: React.CSSProperties        = { width: 256, minWidth: 256, background: '#020617', color: '#fff', padding: '20px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '4px 0 24px rgba(0,0,0,0.35)', zIndex: 10, overflowY: 'auto' }
const logoBox: React.CSSProperties        = { padding: '4px 8px 12px' }
const divider: React.CSSProperties        = { height: 1, background: '#0f172a', margin: '10px 0' }
const planoBadgeWrap: React.CSSProperties = { padding: '6px 8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }
const badgePlano = (plano: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
  letterSpacing: '0.04em', padding: '4px 10px', borderRadius: 999, width: 'fit-content',
  background: plano === 'premium' ? 'rgba(212,168,67,0.15)' : plano === 'pro' ? 'rgba(139,92,246,0.15)' : 'rgba(212,168,67,0.1)',
  color:      plano === 'premium' ? '#d4a843' : plano === 'pro' ? '#a78bfa' : '#d4a843',
  border:     `1px solid ${plano === 'premium' ? 'rgba(212,168,67,0.4)' : plano === 'pro' ? 'rgba(139,92,246,0.3)' : 'rgba(212,168,67,0.25)'}`,
})
const badgeTrial = (dias: number): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700,
  padding: '3px 10px', borderRadius: 999, width: 'fit-content',
  background: dias <= 1 ? 'rgba(239,68,68,0.15)' : dias <= 3 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.1)',
  color:      dias <= 1 ? '#f87171' : dias <= 3 ? '#f59e0b' : '#4ade80',
  border:     `1px solid ${dias <= 1 ? 'rgba(239,68,68,0.3)' : dias <= 3 ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.2)'}`,
})
const planoNome: React.CSSProperties   = { fontSize: 13, fontWeight: 600, color: '#e2e8f0', paddingLeft: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const menuLabel: React.CSSProperties   = { fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 12px 4px' }
const menuItem: React.CSSProperties    = { padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, fontSize: 13, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10 }
const userInfo: React.CSSProperties    = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px 10px' }
const avatar: React.CSSProperties      = { width: 34, height: 34, minWidth: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }
const userName: React.CSSProperties    = { fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const userRole: React.CSSProperties    = { fontSize: 11, color: '#334155', marginTop: 1 }
const btnSair: React.CSSProperties     = { width: '100%', background: 'transparent', border: '1px solid #1e293b', color: '#64748b', padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'color 0.15s', marginBottom: 8 }
const versao: React.CSSProperties      = { fontSize: 10, color: '#1e293b', textAlign: 'center', letterSpacing: '0.08em', marginTop: 4 }
const mainWrapper: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
const bannerTrial = (dias: number): React.CSSProperties => ({
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 24px', fontSize: 13, fontWeight: 600, flexShrink: 0,
  background: dias === 0 ? '#7f1d1d' : dias <= 1 ? '#78350f' : '#713f12',
  color: '#fff',
})
const btnBanner: React.CSSProperties    = { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }
const topbar: React.CSSProperties       = { height: 64, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 28px', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', flexShrink: 0 }
const topbarTitle: React.CSSProperties  = { fontSize: 16, fontWeight: 700, color: '#0f172a' }
const topbarSub: React.CSSProperties    = { fontSize: 11, color: '#94a3b8', marginTop: 2 }
const topbarUser: React.CSSProperties   = { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }
const topbarAvatar: React.CSSProperties = { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }
const btnUpgrade: React.CSSProperties   = { background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }
const content: React.CSSProperties      = { flex: 1, overflowY: 'auto', padding: 28, background: '#f8fafc' }
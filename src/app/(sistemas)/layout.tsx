'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

// ── HELPER: registra push subscription no servidor ──
async function registrarPushSubscription(empresaId: string, usuarioId: number) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { setPushSuportado(false); return }
    setPushSuportado(true)

    const registro = await navigator.serviceWorker.ready
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

    // Converte a chave VAPID de base64 para Uint8Array
    const padding   = '='.repeat((4 - publicKey.length % 4) % 4)
    const base64    = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData   = atob(base64)
    const outputKey = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) outputKey[i] = rawData.charCodeAt(i)

    const subscription = await registro.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: outputKey,
    })

    await fetch('/api/push/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        subscription: subscription.toJSON(),
        empresa_id:   empresaId,
        usuario_id:   usuarioId,
      }),
    })

    console.log('[PWA] Push subscription registrada')
  } catch (err) {
    console.warn('[PWA] Erro ao registrar push subscription:', err)
  }
}

export default function SistemaLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const {
    nomeUsuario, nomeEmpresa, plano, perfil,
    bloqueado, loading, diasRestantes, trialExpirado,
  } = useEmpresa()

  const [pronto, setPronto]               = useState(false)
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [pushAtivo, setPushAtivo] = useState(false)
  const [pushSuportado, setPushSuportado] = useState(false)

  useEffect(() => {
    if (loading) return
    if (bloqueado && !pathname.startsWith('/planos')) { router.push('/planos'); return }
    if (bloqueado && pathname.startsWith('/planos')) { setPronto(true); return }

    const rotasAdminOnly    = ['/equipe', '/planos', '/perfil']
    const rotasFinanceiroOk = ['/dashboard', '/financeiro', '/obras', '/contas', '/compras', '/relatorios', '/fornecedores']
    const rotasMestreOk     = ['/dashboard', '/financeiro', '/obras', '/contas', '/compras']

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

  // Verifica se push já está ativo
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { setPushSuportado(false); return }
    setPushSuportado(true)
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setPushAtivo(!!sub)
      })
    })
  }, [])

  // Fecha sidebar ao trocar de página no mobile
  useEffect(() => { setSidebarAberta(false) }, [pathname])

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function ativarNotificacoes() {
    const permissao = await Notification.requestPermission()
    if (permissao !== 'granted') {
      alert('Permissão de notificações negada. Habilite nas configurações do navegador.')
      return
    }

    // Busca dados do usuário para registrar subscription
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, empresa_id')
      .eq('user_id', user.id)
      .single()

    if (!usuario) return

    await registrarPushSubscription(usuario.empresa_id, usuario.id)
    setPushAtivo(true)
    alert('✅ Notificações ativadas! Você receberá alertas de contas a vencer.')
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
    perfil === 'admin'      ? 'Administrador' :
    perfil === 'engenheiro' ? 'Engenheiro'    :
    perfil === 'financeiro' ? 'Financeiro'    :
                              'Mestre de Obra'

  const podeVerObras        = true
  const podeVerOrcamentos   = perfil === 'admin' || perfil === 'engenheiro'
  const podeVerRelatorios   = perfil === 'admin' || perfil === 'engenheiro' || perfil === 'financeiro'
  const podeVerEquipe       = perfil === 'admin' && plano === 'premium'
  const podeVerPerfil       = perfil === 'admin'
  const podeVerPlanos       = perfil === 'admin'
  const podeVerContas       = true
  const podeVerCompras      = true
  const podeVerFornecedores = perfil === 'admin' || perfil === 'engenheiro' || perfil === 'financeiro'

  return (
    <div style={container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .sidebar-wrapper {
          width: 256px; min-width: 256px; flex-shrink: 0;
        }
        .overlay { display: none; }
        .hamburger { display: none !important; }
        @media (max-width: 768px) {
          .sidebar-wrapper {
            position: fixed !important; top: 0; left: 0; bottom: 0;
            z-index: 200; transform: translateX(-100%);
            transition: transform 0.25s ease; width: 272px !important; min-width: unset !important;
          }
          .sidebar-wrapper.aberta { transform: translateX(0); }
          .overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 199; backdrop-filter: blur(2px); }
          .hamburger { display: flex !important; }
          .topbar-user-info { display: none !important; }
        }
      `}</style>

      {/* Overlay mobile */}
      {sidebarAberta && (
        <div className="overlay" onClick={() => setSidebarAberta(false)} />
      )}

      {/* SIDEBAR */}
      <div className={`sidebar-wrapper${sidebarAberta ? ' aberta' : ''}`}>
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
              {podeVerObras      && <MenuItem texto="🏗️" label="Obras"       rota="/obras"       ativo={pathname.startsWith('/obras')} />}
              <MenuItem            texto="💰" label="Financeiro" rota="/financeiro" ativo={pathname.startsWith('/financeiro')} />
              {podeVerContas     && <MenuItem texto="💳" label="Contas"      rota="/contas"      ativo={pathname.startsWith('/contas')} />}
              {podeVerCompras    && <MenuItem texto="🛒" label="Compras"     rota="/compras"     ativo={pathname.startsWith('/compras')} />}
              {podeVerOrcamentos && <MenuItem texto="🧾" label="Orçamentos"  rota="/orcamentos"  ativo={pathname.startsWith('/orcamentos')} />}
              {podeVerRelatorios && <MenuItem texto="📊" label="Relatórios"  rota="/relatorios"  ativo={pathname.startsWith('/relatorios')} />}
              {podeVerEquipe     && <MenuItem texto="👥" label="Equipe"      rota="/equipe"      ativo={pathname.startsWith('/equipe')} />}
              <div style={divider} />
              <p style={menuLabel}>CONFIGURAÇÕES</p>
              {podeVerFornecedores && <MenuItem texto="🏭" label="Fornecedores"    rota="/fornecedores" ativo={pathname.startsWith('/fornecedores')} />}
              {podeVerPerfil       && <MenuItem texto="🏢" label="Perfil da Empresa" rota="/perfil"    ativo={pathname.startsWith('/perfil')} />}
              {podeVerPlanos       && <MenuItem texto="💳" label="Planos & Upgrade"  rota="/planos"    ativo={pathname.startsWith('/planos')} destaque />}
            </nav>
          </div>

          <div>
            {/* Botão de notificações push */}
            {pushSuportado && (
              <button
                onClick={pushAtivo ? undefined : ativarNotificacoes}
                style={{
                  width: '100%', background: pushAtivo ? 'rgba(34,197,94,0.1)' : 'rgba(212,168,67,0.1)',
                  border: `1px solid ${pushAtivo ? 'rgba(34,197,94,0.3)' : 'rgba(212,168,67,0.3)'}`,
                  color: pushAtivo ? '#4ade80' : '#d4a843',
                  padding: '9px 14px', borderRadius: 8, cursor: pushAtivo ? 'default' : 'pointer',
                  fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, marginBottom: 8,
                }}
              >
                {pushAtivo ? '🔔 Notificações ativas' : '🔕 Ativar notificações'}
              </button>
            )}

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
      </div>

      {/* CONTEÚDO */}
      <div style={mainWrapper}>
        {mostrarBanner && (
          <div style={bannerTrial(diasRestantes!)}>
            <span>
              {diasRestantes === 0
                ? '⚠️ Seu trial expira hoje! Assine agora para não perder o acesso.'
                : `⏱ Seu trial expira em ${diasRestantes} dia${diasRestantes! > 1 ? 's' : ''}. Aproveite para assinar!`}
            </span>
            <button onClick={() => router.push('/planos')} style={btnBanner}>Ver planos →</button>
          </div>
        )}

        <header style={topbar}>
          {/* Hamburger mobile */}
          <button className="hamburger" onClick={() => setSidebarAberta(!sidebarAberta)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 5, padding: '8px', marginRight: 8, flexShrink: 0 }}>
            <span style={{ display: 'block', width: 22, height: 2, background: '#0f172a', borderRadius: 2, transition: 'all 0.2s', transform: sidebarAberta ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#0f172a', borderRadius: 2, opacity: sidebarAberta ? 0 : 1, transition: 'all 0.2s' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#0f172a', borderRadius: 2, transition: 'all 0.2s', transform: sidebarAberta ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>

          <div>
            <strong style={topbarTitle}>{tituloPagina(pathname)}</strong>
            <p style={topbarSub}>Sistema de Gestão · Zynplan</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {podeVerPlanos && (
              <button onClick={() => router.push('/planos')} style={btnUpgrade}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}>
                {labelUpgrade}
              </button>
            )}
            <div className="topbar-user-info" style={topbarUser}>
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
  if (pathname === '/dashboard')            return 'Dashboard'
  if (pathname.startsWith('/obras'))        return 'Obras'
  if (pathname.startsWith('/financeiro'))   return 'Financeiro'
  if (pathname.startsWith('/contas'))       return 'Contas'
  if (pathname.startsWith('/compras'))      return 'Compras'
  if (pathname.startsWith('/fornecedores')) return 'Fornecedores'
  if (pathname.startsWith('/orcamentos'))   return 'Orçamentos'
  if (pathname.startsWith('/relatorios'))   return 'Relatórios'
  if (pathname.startsWith('/equipe'))       return 'Equipe'
  if (pathname.startsWith('/perfil'))       return 'Perfil da Empresa'
  if (pathname.startsWith('/planos'))       return 'Planos'
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
      onMouseEnter={e => { if (!ativo) { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLDivElement).style.color = destaque ? '#fde68a' : '#e2e8f0' } }}
      onMouseLeave={e => { if (!ativo) { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = destaque ? '#fbbf24' : '#94a3b8' } }}
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
const sidebar: React.CSSProperties        = { width: '100%', height: '100%', background: '#020617', color: '#fff', padding: '20px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '4px 0 24px rgba(0,0,0,0.35)', zIndex: 10, overflowY: 'auto' }
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
  background: dias === 0 ? '#7f1d1d' : dias <= 1 ? '#78350f' : '#713f12', color: '#fff',
})
const btnBanner: React.CSSProperties    = { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }
const topbar: React.CSSProperties       = { height: 64, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', flexShrink: 0 }
const topbarTitle: React.CSSProperties  = { fontSize: 16, fontWeight: 700, color: '#0f172a' }
const topbarSub: React.CSSProperties    = { fontSize: 11, color: '#94a3b8', marginTop: 2 }
const topbarUser: React.CSSProperties   = { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }
const topbarAvatar: React.CSSProperties = { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }
const btnUpgrade: React.CSSProperties   = { background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }
const content: React.CSSProperties      = { flex: 1, overflowY: 'auto', padding: 28, background: '#f8fafc' }
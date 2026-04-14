'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

const PRICE_IDS = {
  basico:  'price_1TJg7cFjaswz9WcmjuSi3KLQ',
  pro:     'price_1TJg8HFjaswz9WcmLtUD1Wzk',
  premium: 'price_1TJg99Fjaswz9WcmOhX7PsvZ',
}

type PlanoKey = keyof typeof PRICE_IDS

const PLANOS = [
  {
    key: 'basico' as PlanoKey,
    nome: 'Básico',
    preco: 'R$ 79,90',
    descricao: 'Ideal para autônomos e pequenas obras',
    cor: '#64748b',
    corBg: 'rgba(100,116,139,0.08)',
    corBorda: 'rgba(100,116,139,0.2)',
    badge: null,
    itens: [
      { ok: true,  texto: '2 obras simultâneas' },
      { ok: true,  texto: '5 orçamentos por mês' },
      { ok: true,  texto: 'Diário de obra' },
      { ok: true,  texto: 'Contrato digital' },
      { ok: true,  texto: 'Cronograma de etapas' },
      { ok: false, texto: 'Relatórios avançados' },
      { ok: false, texto: 'Múltiplos usuários' },
      { ok: false, texto: 'Suporte prioritário' },
    ],
  },
  {
    key: 'pro' as PlanoKey,
    nome: 'Pro',
    preco: 'R$ 149,90',
    descricao: 'Para construtoras em crescimento',
    cor: '#d4a843',
    corBg: 'rgba(212,168,67,0.08)',
    corBorda: 'rgba(212,168,67,0.4)',
    badge: '🚀 Mais popular',
    itens: [
      { ok: true,  texto: '5 obras simultâneas' },
      { ok: true,  texto: '15 orçamentos por mês' },
      { ok: true,  texto: 'Diário de obra' },
      { ok: true,  texto: 'Contrato digital' },
      { ok: true,  texto: 'Cronograma de etapas' },
      { ok: true,  texto: 'Relatórios avançados' },
      { ok: false, texto: 'Múltiplos usuários' },
      { ok: false, texto: 'Suporte prioritário' },
    ],
  },
  {
    key: 'premium' as PlanoKey,
    nome: 'Premium',
    preco: 'R$ 299,90',
    descricao: 'Para construtoras que exigem o melhor',
    cor: '#b8893d',
    corBg: 'rgba(184,137,61,0.1)',
    corBorda: 'rgba(184,137,61,0.5)',
    badge: '👑 Completo',
    itens: [
      { ok: true, texto: 'Obras ilimitadas' },
      { ok: true, texto: 'Orçamentos ilimitados' },
      { ok: true, texto: 'Diário de obra' },
      { ok: true, texto: 'Contrato digital' },
      { ok: true, texto: 'Cronograma de etapas' },
      { ok: true, texto: 'Relatórios avançados' },
      { ok: true, texto: 'Múltiplos usuários' },
      { ok: true, texto: 'Suporte prioritário' },
    ],
  },
]

export default function Planos() {
  const router = useRouter()
  const { plano: planoAtual, loading: loadingEmpresa } = useEmpresa()
  const [loadingPlano, setLoadingPlano] = useState<PlanoKey | null>(null)

  async function assinar(plano: PlanoKey) {
    if (loadingPlano) return
    setLoadingPlano(plano)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { router.push('/login'); return }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ priceId: PRICE_IDS[plano] }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Erro ao iniciar pagamento. Tente novamente.')
    } catch (err) {
      console.error(err)
      alert('Erro inesperado. Tente novamente.')
    } finally {
      setLoadingPlano(null)
    }
  }

  if (loadingEmpresa) return <p style={{ padding: 40, textAlign: 'center' }}>Carregando...</p>

  return (
    <div style={container}>

      {/* CABEÇALHO */}

{/* BOTÃO VOLTAR */}
<button
  onClick={() => router.push('/dashboard')}
  style={{
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#64748b', fontSize: 14, fontWeight: 600,
    marginBottom: 24, padding: '6px 0',
  }}
>
  ← Voltar ao Dashboard
</button>

      <div style={cabecalho}>
        <div style={tagLine}>Planos & Preços</div>
        <h1 style={titulo}>Escolha o plano ideal<br />para sua operação</h1>
        <p style={subtitulo}>
          Sem taxas ocultas · Cancele quando quiser · Dados sempre seus
        </p>
        {planoAtual && (
          <div style={planoAtualTag}>
            Seu plano atual: <strong style={{ color: '#d4a843' }}>{planoAtual.charAt(0).toUpperCase() + planoAtual.slice(1)}</strong>
          </div>
        )}
      </div>

      {/* CARDS */}
      <div style={grid}>
        {PLANOS.map(p => {
          const isAtual    = planoAtual === p.key
          const isLoading  = loadingPlano === p.key
          const isPro      = p.key === 'pro'

          return (
            <div key={p.key} style={{
              ...cardBase,
              border: `1.5px solid ${isAtual ? '#22c55e' : p.corBorda}`,
              background: isAtual ? 'rgba(34,197,94,0.05)' : p.corBg,
              boxShadow: isPro ? `0 12px 40px ${p.cor}30` : '0 4px 16px rgba(0,0,0,0.06)',
              transform: isPro ? 'scale(1.03)' : 'scale(1)',
            }}>

              {/* Badge topo */}
              {p.badge && (
                <div style={{ ...badge, background: p.cor, color: p.key === 'pro' ? '#000' : '#fff' }}>
                  {p.badge}
                </div>
              )}
              {isAtual && (
                <div style={{ ...badge, background: '#22c55e', color: '#fff', right: 16, left: 'auto', transform: 'none' }}>
                  ✓ Plano atual
                </div>
              )}

              {/* Header do card */}
              <div style={{ marginTop: p.badge ? 16 : 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: p.cor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  {p.nome}
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{p.preco}</span>
                  <span style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>/mês</span>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{p.descricao}</p>
              </div>

              {/* Divisor */}
              <div style={{ height: 1, background: '#e2e8f0', marginBottom: 20 }} />

              {/* Lista de itens */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.itens.map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: item.ok ? '#0f172a' : '#cbd5e1' }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                      background: item.ok ? p.cor + '20' : '#f1f5f9',
                      color: item.ok ? p.cor : '#cbd5e1',
                    }}>
                      {item.ok ? '✓' : '×'}
                    </span>
                    {item.texto}
                  </li>
                ))}
              </ul>

              {/* Botão */}
              <button
                onClick={() => !isAtual && assinar(p.key)}
                disabled={!!loadingPlano || isAtual}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
                  fontSize: 14, fontWeight: 700, cursor: isAtual ? 'default' : 'pointer',
                  transition: 'opacity 0.15s',
                  background: isAtual
                    ? '#dcfce7'
                    : `linear-gradient(135deg, ${p.cor}, ${p.key === 'pro' ? '#f0c040' : p.cor}cc)`,
                  color: isAtual ? '#16a34a' : p.key === 'pro' ? '#000' : '#fff',
                  opacity: loadingPlano && !isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? 'Redirecionando...' : isAtual ? '✓ Plano atual' : `Assinar ${p.nome}`}
              </button>

            </div>
          )
        })}
      </div>

      {/* RODAPÉ */}
      <div style={rodape}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span style={{ fontWeight: 600, color: '#374151' }}>Pagamento 100% seguro via Stripe</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>
          Todos os planos incluem 7 dias de garantia. Cancele a qualquer momento sem multa.
        </p>

        {/* Comparativo rápido */}
        <div style={garantias}>
          {['Sem contrato de fidelidade', 'Dados exportáveis', 'Suporte via WhatsApp', 'Atualizações incluídas'].map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
              <span style={{ color: '#d4a843', fontWeight: 700 }}>✓</span> {g}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

/* ── ESTILOS ── */
const container: React.CSSProperties  = { padding: '32px 20px', background: '#f8fafc', minHeight: '100vh' }
const cabecalho: React.CSSProperties  = { textAlign: 'center', marginBottom: 48 }
const tagLine: React.CSSProperties    = { display: 'inline-block', background: 'rgba(212,168,67,0.12)', color: '#b8893d', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 14px', borderRadius: 999, marginBottom: 16, border: '1px solid rgba(212,168,67,0.25)' }
const titulo: React.CSSProperties     = { fontSize: 32, fontWeight: 900, color: '#0f172a', lineHeight: 1.25, marginBottom: 12 }
const subtitulo: React.CSSProperties  = { color: '#64748b', fontSize: 15, marginBottom: 16 }
const planoAtualTag: React.CSSProperties = { display: 'inline-block', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 999, padding: '6px 16px', fontSize: 13, color: '#64748b' }
const grid: React.CSSProperties       = { display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 980, margin: '0 auto 48px' }
const cardBase: React.CSSProperties   = { padding: '28px 24px', borderRadius: 16, width: 290, position: 'relative', transition: 'transform 0.2s' }
const badge: React.CSSProperties      = { position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }
const rodape: React.CSSProperties     = { textAlign: 'center', maxWidth: 600, margin: '0 auto', paddingBottom: 32 }
const garantias: React.CSSProperties  = { display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 20, padding: '16px 24px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }

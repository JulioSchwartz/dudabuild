'use client'
 
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
 
// ⚠️ Substitua pelos seus Price IDs reais do Stripe Dashboard
const PRICE_IDS = {
  basico:  'price_1TJg7cFjaswz9WcmjuSi3KLQ',
  pro:     'price_1TJg8HFjaswz9WcmLtUD1Wzk',
  premium: 'price_1TJg99Fjaswz9WcmOhX7PsvZ',
}
 
type PlanoKey = keyof typeof PRICE_IDS
 
export default function Planos() {
  const router = useRouter()
  const { plano: planoAtual, loading: loadingEmpresa } = useEmpresa()
  const [loadingPlano, setLoadingPlano] = useState<PlanoKey | null>(null)
 
  async function assinar(plano: PlanoKey) {
    if (loadingPlano) return // evita duplo clique
 
    setLoadingPlano(plano)
 
    try {
      const { data: { session } } = await supabase.auth.getSession()
 
      if (!session?.access_token) {
        router.push('/login')
        return
      }
 
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId: PRICE_IDS[plano] }),
      })
 
      const data = await res.json()
 
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erro ao iniciar pagamento. Tente novamente.')
      }
 
    } catch (err) {
      console.error(err)
      alert('Erro inesperado. Tente novamente.')
    } finally {
      setLoadingPlano(null)
    }
  }
 
  if (loadingEmpresa) {
    return <p style={{ padding: 40, textAlign: 'center' }}>Carregando...</p>
  }
 
  return (
    <div style={container}>
 
      <div style={cabecalho}>
        <h1 style={titulo}>💰 Escolha seu Plano</h1>
        <p style={subtitulo}>
          Sem taxas ocultas. Cancele quando quiser.
        </p>
        {planoAtual && (
          <p style={planoAtualTag}>
            Seu plano atual: <strong>{planoAtual.toUpperCase()}</strong>
          </p>
        )}
      </div>
 
      <div style={grid}>
 
        {/* ── BÁSICO ── */}
        <div style={planoAtual === 'basico' ? cardAtivo : card}>
          {planoAtual === 'basico' && <div style={badgeAtual}>Plano atual</div>}
          <h2 style={nomePlano}>Básico</h2>
          <p style={preco}>R$ 49,90<span style={mes}>/mês</span></p>
          <ul style={lista}>
            <li>✅ 2 obras simultâneas</li>
            <li>✅ 5 orçamentos</li>
            <li>❌ Financeiro</li>
            <li>❌ Relatórios</li>
          </ul>
          <button
            style={planoAtual === 'basico' ? btnAtivo : botao}
            onClick={() => assinar('basico')}
            disabled={!!loadingPlano || planoAtual === 'basico'}
          >
            {loadingPlano === 'basico'
              ? 'Redirecionando...'
              : planoAtual === 'basico'
                ? 'Plano atual'
                : 'Assinar Básico'}
          </button>
        </div>
 
        {/* ── PRO ── */}
        <div style={planoAtual === 'pro' ? cardAtivo : cardDestaque}>
          <div style={badgePro}>🚀 Mais popular</div>
          {planoAtual === 'pro' && <div style={badgeAtual}>Plano atual</div>}
          <h2 style={nomePlano}>Pro</h2>
          <p style={preco}>R$ 99,90<span style={mes}>/mês</span></p>
          <ul style={lista}>
            <li>✅ 5 obras simultâneas</li>
            <li>✅ 10 orçamentos</li>
            <li>✅ Financeiro</li>
            <li>❌ Relatórios</li>
          </ul>
          <button
            style={planoAtual === 'pro' ? btnAtivo : botaoDestaque}
            onClick={() => assinar('pro')}
            disabled={!!loadingPlano || planoAtual === 'pro'}
          >
            {loadingPlano === 'pro'
              ? 'Redirecionando...'
              : planoAtual === 'pro'
                ? 'Plano atual'
                : 'Assinar Pro'}
          </button>
        </div>
 
        {/* ── PREMIUM ── */}
        <div style={planoAtual === 'premium' ? cardAtivo : card}>
          {planoAtual === 'premium' && <div style={badgeAtual}>Plano atual</div>}
          <h2 style={nomePlano}>Premium 👑</h2>
          <p style={preco}>R$ 159,90<span style={mes}>/mês</span></p>
          <ul style={lista}>
            <li>✅ Obras ilimitadas</li>
            <li>✅ Orçamentos ilimitados</li>
            <li>✅ Financeiro completo</li>
            <li>✅ Relatórios avançados</li>
          </ul>
          <button
            style={planoAtual === 'premium' ? btnAtivo : botao}
            onClick={() => assinar('premium')}
            disabled={!!loadingPlano || planoAtual === 'premium'}
          >
            {loadingPlano === 'premium'
              ? 'Redirecionando...'
              : planoAtual === 'premium'
                ? 'Plano atual'
                : 'Assinar Premium'}
          </button>
        </div>
 
      </div>
 
      <p style={rodape}>
        Pagamento processado com segurança pelo Stripe 🔒
      </p>
 
    </div>
  )
}
 
/* ================= ESTILOS ================= */
 
const container: React.CSSProperties = {
  minHeight: '100vh',
  padding: '40px 20px',
  background: '#f8fafc',
}
 
const cabecalho: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 40,
}
 
const titulo: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  color: '#0f172a',
}
 
const subtitulo: React.CSSProperties = {
  color: '#64748b',
  marginTop: 6,
  fontSize: 15,
}
 
const planoAtualTag: React.CSSProperties = {
  marginTop: 10,
  color: '#2563eb',
  fontSize: 14,
}
 
const grid: React.CSSProperties = {
  display: 'flex',
  gap: 20,
  justifyContent: 'center',
  flexWrap: 'wrap',
  maxWidth: 960,
  margin: '0 auto',
}
 
const cardBase: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  padding: '28px 24px',
  borderRadius: 16,
  width: 280,
  background: '#fff',
  position: 'relative',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
}
 
const card: React.CSSProperties = { ...cardBase }
 
const cardDestaque: React.CSSProperties = {
  ...cardBase,
  border: '2px solid #2563eb',
  boxShadow: '0 8px 30px rgba(37,99,235,0.15)',
}
 
const cardAtivo: React.CSSProperties = {
  ...cardBase,
  border: '2px solid #16a34a',
  boxShadow: '0 8px 30px rgba(22,163,74,0.12)',
}
 
const badgePro: React.CSSProperties = {
  position: 'absolute',
  top: -12,
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#2563eb',
  color: '#fff',
  padding: '4px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}
 
const badgeAtual: React.CSSProperties = {
  position: 'absolute',
  top: -12,
  right: 16,
  background: '#16a34a',
  color: '#fff',
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
}
 
const nomePlano: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 8,
  marginTop: 8,
  color: '#0f172a',
}
 
const preco: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  color: '#0f172a',
  marginBottom: 16,
}
 
const mes: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  color: '#64748b',
}
 
const lista: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  marginBottom: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  fontSize: 14,
  color: '#374151',
}
 
const botaoBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 0',
  borderRadius: 8,
  border: 'none',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}
 
const botao: React.CSSProperties = {
  ...botaoBase,
  background: '#0f172a',
  color: '#fff',
}
 
const botaoDestaque: React.CSSProperties = {
  ...botaoBase,
  background: '#2563eb',
  color: '#fff',
}
 
const btnAtivo: React.CSSProperties = {
  ...botaoBase,
  background: '#dcfce7',
  color: '#16a34a',
  cursor: 'default',
}
 
const rodape: React.CSSProperties = {
  textAlign: 'center',
  marginTop: 36,
  color: '#94a3b8',
  fontSize: 13,
}
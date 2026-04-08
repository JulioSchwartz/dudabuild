'use client'
 
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ADMIN_EMAILS } from '@/lib/permissoes'
 
const PRECO_PLANOS: Record<string, number> = {
  basico:  49.90,
  pro:     99.90,
  premium: 159.90,
}
 
export default function AdminDashboard() {
  const router = useRouter()
 
  const [empresas,  setEmpresas]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [autorizado, setAutorizado] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroPlan,   setFiltroPlan]   = useState('todos')
 
  useEffect(() => {
    verificarAdmin()
  }, [])
 
  async function verificarAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
 
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      router.push('/dashboard')
      return
    }
 
    setAutorizado(true)
    carregar()
  }
 
  async function carregar() {
    setLoading(true)
 
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false })
 
    if (error) {
      alert('Erro ao carregar empresas')
      setLoading(false)
      return
    }
 
    setEmpresas(data || [])
    setLoading(false)
  }
 
  async function alterarStatus(id: string, novoStatus: string) {
    await supabase.from('empresas').update({ status: novoStatus }).eq('id', id)
    carregar()
  }
 
  async function alterarPlano(id: string, novoPlano: string) {
    await supabase.from('empresas').update({ plano: novoPlano }).eq('id', id)
    carregar()
  }
 
  if (!autorizado || loading) {
    return <p style={{ padding: 40 }}>Carregando...</p>
  }
 
  /* ── MÉTRICAS ── */
  const ativos      = empresas.filter(e => e.status === 'active')
  const cancelados  = empresas.filter(e => e.status === 'canceled')
  const inadimplentes = empresas.filter(e => e.status === 'past_due')
  const incompletos   = empresas.filter(e => e.status === 'incomplete')
 
  const MRR = ativos.reduce((t, e) => t + (PRECO_PLANOS[e.plano] || 0), 0)
 
  const churn = empresas.length > 0
    ? (cancelados.length / empresas.length) * 100
    : 0
 
  const planoCount = {
    basico:  empresas.filter(e => e.plano === 'basico').length,
    pro:     empresas.filter(e => e.plano === 'pro').length,
    premium: empresas.filter(e => e.plano === 'premium').length,
  }
 
  /* ── FILTROS ── */
  const empresasFiltradas = empresas.filter(e => {
    const okStatus = filtroStatus === 'todos' || e.status === filtroStatus
    const okPlano  = filtroPlan  === 'todos' || e.plano  === filtroPlan
    return okStatus && okPlano
  })
 
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
 
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>
        👑 Dashboard Admin — DudaBuild
      </h1>
 
      {/* ── MÉTRICAS PRINCIPAIS ── */}
      <div style={grid}>
        <Card titulo="Total Clientes"  valor={empresas.length}      cor="#2563eb" />
        <Card titulo="Ativos"          valor={ativos.length}        cor="#16a34a" />
        <Card titulo="Cancelados"      valor={cancelados.length}    cor="#dc2626" />
        <Card titulo="Inadimplentes"   valor={inadimplentes.length} cor="#f59e0b" />
        <Card titulo="Incompletos"     valor={incompletos.length}   cor="#94a3b8" />
        <Card
          titulo="MRR"
          valor={MRR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          cor="#7c3aed"
        />
        <Card titulo="Churn"           valor={churn.toFixed(1) + '%'} cor="#ef4444" />
      </div>
 
      {/* ── DISTRIBUIÇÃO PLANOS ── */}
      <h2 style={subtitulo}>📊 Distribuição de Planos</h2>
      <div style={grid}>
        <Card titulo="Básico"   valor={planoCount.basico}   cor="#64748b" />
        <Card titulo="Pro"      valor={planoCount.pro}      cor="#2563eb" />
        <Card titulo="Premium"  valor={planoCount.premium}  cor="#7c3aed" />
      </div>
 
      {/* ── FILTROS ── */}
      <h2 style={subtitulo}>🏢 Empresas ({empresasFiltradas.length})</h2>
 
      <div style={filtros}>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={select}>
          <option value="todos">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="past_due">Inadimplente</option>
          <option value="canceled">Cancelado</option>
          <option value="incomplete">Incompleto</option>
        </select>
 
        <select value={filtroPlan} onChange={e => setFiltroPlan(e.target.value)} style={select}>
          <option value="todos">Todos os planos</option>
          <option value="basico">Básico</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
 
        <button onClick={carregar} style={btnAtualizar}>
          🔄 Atualizar
        </button>
      </div>
 
      {/* ── LISTA ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {empresasFiltradas.map(e => (
          <div key={e.id} style={empresaCard}>
 
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 15 }}>{e.nome}</strong>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                ID: {e.id} · Criado: {new Date(e.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
 
            <div style={acoes}>
              {/* STATUS */}
              <select
                value={e.status || 'incomplete'}
                onChange={ev => alterarStatus(e.id, ev.target.value)}
                style={{ ...select, ...corStatus(e.status) }}
              >
                <option value="active">✅ Ativo</option>
                <option value="past_due">⚠️ Inadimplente</option>
                <option value="canceled">❌ Cancelado</option>
                <option value="incomplete">⏳ Incompleto</option>
              </select>
 
              {/* PLANO */}
              <select
                value={e.plano || 'basico'}
                onChange={ev => alterarPlano(e.id, ev.target.value)}
                style={select}
              >
                <option value="basico">Básico</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>
 
          </div>
        ))}
 
        {empresasFiltradas.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>
            Nenhuma empresa encontrada com os filtros selecionados.
          </p>
        )}
      </div>
 
    </div>
  )
}
 
/* ── HELPERS ── */
 
function corStatus(status: string): React.CSSProperties {
  if (status === 'active')     return { color: '#16a34a', fontWeight: 700 }
  if (status === 'past_due')   return { color: '#f59e0b', fontWeight: 700 }
  if (status === 'canceled')   return { color: '#dc2626', fontWeight: 700 }
  return { color: '#94a3b8' }
}
 
/* ── COMPONENTES ── */
 
function Card({ titulo, valor, cor }: { titulo: string; valor: any; cor: string }) {
  return (
    <div style={{
      background: cor + '12',
      padding: 20,
      borderRadius: 12,
      border: `1px solid ${cor}40`,
    }}>
      <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{titulo}</p>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: cor, marginTop: 4 }}>{valor}</h2>
    </div>
  )
}
 
/* ── ESTILOS ── */
 
const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
  gap: 14,
  marginBottom: 30,
}
 
const subtitulo: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 14,
  marginTop: 10,
}
 
const filtros: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginBottom: 16,
  flexWrap: 'wrap',
}
 
const select: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 13,
  background: '#fff',
}
 
const btnAtualizar: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
}
 
const empresaCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#fff',
  padding: '14px 16px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  flexWrap: 'wrap',
  gap: 10,
}
 
const acoes: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
}
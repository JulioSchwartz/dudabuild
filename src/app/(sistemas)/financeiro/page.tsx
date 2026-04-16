'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Financeiro() {
  const { empresaId, bloqueado, loading } = useEmpresa()
  const router = useRouter()
  const [dados, setDados]   = useState<any[]>([])
  const [obras, setObras]   = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => { if (!loading && bloqueado) router.push('/planos') }, [loading, bloqueado, router])
  useEffect(() => { if (!empresaId) return; carregar() }, [empresaId])

  async function carregar() {
    try {
      const [{ data: finData, error: errFin }, { data: obrasData, error: errObras }] = await Promise.all([
        supabase.from('financeiro').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: true }),
        supabase.from('obras').select('id, nome').eq('empresa_id', empresaId).is('deleted_at', null),
      ])
      if (errFin) throw errFin
      if (errObras) throw errObras
      setDados(finData   || [])
      setObras(obrasData || [])
    } catch (err) { console.error('Erro financeiro:', err) }
    finally { setLoadingData(false) }
  }

  if (loading || loadingData) return <p style={{ padding: 24 }}>Carregando...</p>

  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas   = dados.filter(d => d.tipo === 'saida')
  const receita  = soma(entradas)
  const custo    = soma(saidas)
  const lucro    = receita - custo

  const porMes: Record<string, { mes: string; entrada: number; saida: number; saldo: number }> = {}
  dados.forEach(d => {
    if (!d.created_at) return
    const valor = Number(d.valor || 0)
    const mes   = new Date(d.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (!porMes[mes]) porMes[mes] = { mes, entrada: 0, saida: 0, saldo: 0 }
    if (d.tipo === 'entrada') porMes[mes].entrada += valor
    else                      porMes[mes].saida   += valor
  })
  let acumulado = 0
  const fluxo = Object.values(porMes).map(m => {
    acumulado += m.entrada - m.saida
    return { ...m, saldo: acumulado }
  })

  const porCategoria: Record<string, number> = {}
  saidas.forEach(s => {
    const cat = s.descricao || 'Outros'
    porCategoria[cat] = (porCategoria[cat] || 0) + Number(s.valor || 0)
  })
  const categorias = Object.entries(porCategoria)
    .map(([nome, valor]) => ({ nome, valor, perc: custo > 0 ? (valor / custo) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor)

  const nomeObra: Record<string, string> = {}
  obras.forEach(o => { nomeObra[String(o.id)] = o.nome })

  const porObra: Record<string, { nome: string; receita: number; custo: number; lucro: number }> = {}
  dados.forEach(d => {
    if (!d.obra_id) return
    const key   = String(d.obra_id)
    const valor = Number(d.valor || 0)
    if (!porObra[key]) porObra[key] = { nome: nomeObra[key] || `Obra ${key}`, receita: 0, custo: 0, lucro: 0 }
    if (d.tipo === 'entrada') porObra[key].receita += valor
    else                      porObra[key].custo   += valor
    porObra[key].lucro = porObra[key].receita - porObra[key].custo
  })
  const comparativo = Object.values(porObra).sort((a, b) => b.lucro - a.lucro)

  const CORES = ['#3b82f6','#8b5cf6','#06b6d4','#f59e0b','#ec4899','#14b8a6','#f97316','#6366f1']

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        @media (max-width: 768px) {
          .fin-dois-grid { grid-template-columns: 1fr !important; }
          .fin-saldo-card { flex-direction: column !important; gap: 12px !important; }
          .fin-saldo-right { text-align: left !important; }
          .fin-tabela-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .fin-tabela-header,
          .fin-tabela-linha { grid-template-columns: 80px 1fr 1fr 1fr 1fr !important; font-size: 11px !important; min-width: 480px; }
        }
      `}</style>

      <h1 style={titulo}>💰 Financeiro</h1>
      <p style={subtitulo}>Fluxo de caixa e análise de custos consolidada</p>

      {/* SALDO */}
      <div className="fin-saldo-card" style={saldoCard(lucro)}>
        <div>
          <p style={{ fontSize: 13, color: lucro >= 0 ? '#166534' : '#991b1b', fontWeight: 600 }}>
            {lucro >= 0 ? '✅ Saldo positivo' : '⚠️ Saldo negativo'}
          </p>
          <p style={{ fontSize: 32, fontWeight: 900, color: lucro >= 0 ? '#15803d' : '#dc2626', marginTop: 4 }}>
            {lucro >= 0 ? '+' : ''}{format(lucro)}
          </p>
        </div>
        <div className="fin-saldo-right" style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 13, color: '#64748b' }}>Total entradas</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>{format(receita)}</p>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Total saídas</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>{format(custo)}</p>
        </div>
      </div>

      {/* FLUXO MENSAL */}
      <div style={secaoCard}>
        <h3 style={secaoTitulo}>📅 Fluxo de Caixa Mensal</h3>
        {fluxo.length === 0
          ? <p style={vazio}>Sem lançamentos ainda. Lance nas obras.</p>
          : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={fluxo} barGap={4}>
                  <XAxis dataKey="mes" fontSize={12} />
                  <YAxis fontSize={11} tickFormatter={v => 'R$' + (v/1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(v: any) => format(v)} />
                  <Legend />
                  <Bar dataKey="entrada" name="Entradas" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="saida"   name="Saídas"   fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* TABELA COM SCROLL HORIZONTAL NO MOBILE */}
              <div className="fin-tabela-wrap" style={{ marginTop: 16 }}>
                <div style={{ minWidth: 480 }}>
                  <div className="fin-tabela-header" style={tabelaHeader}>
                    <span>Mês</span>
                    <span style={{ textAlign: 'right' }}>Entradas</span>
                    <span style={{ textAlign: 'right' }}>Saídas</span>
                    <span style={{ textAlign: 'right' }}>Saldo do mês</span>
                    <span style={{ textAlign: 'right' }}>Saldo acumulado</span>
                  </div>
                  {fluxo.map(m => {
                    const saldoMes = m.entrada - m.saida
                    return (
                      <div key={m.mes} className="fin-tabela-linha" style={tabelaLinha}>
                        <span style={{ fontWeight: 600 }}>{m.mes}</span>
                        <span style={{ textAlign: 'right', color: '#16a34a' }}>{format(m.entrada)}</span>
                        <span style={{ textAlign: 'right', color: '#dc2626' }}>{format(m.saida)}</span>
                        <span style={{ textAlign: 'right', color: saldoMes >= 0 ? '#2563eb' : '#dc2626', fontWeight: 600 }}>
                          {saldoMes >= 0 ? '+' : ''}{format(saldoMes)}
                        </span>
                        <span style={{ textAlign: 'right', color: m.saldo >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                          {format(m.saldo)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )
        }
      </div>

      {/* BREAKDOWN + COMPARATIVO — 2 col desktop, 1 col mobile */}
      <div className="fin-dois-grid" style={doisGrid}>
        <div style={secaoCard}>
          <h3 style={secaoTitulo}>🔍 Breakdown de Custos</h3>
          {categorias.length === 0
            ? <p style={vazio}>Sem saídas registradas</p>
            : categorias.map((c, i) => (
              <div key={c.nome} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.nome}</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{format(c.valor)} · {c.perc.toFixed(1)}%</span>
                </div>
                <div style={barraFundo}>
                  <div style={{ ...barraPreenchida, width: `${c.perc}%`, background: CORES[i % CORES.length] }} />
                </div>
              </div>
            ))
          }
        </div>

        <div style={secaoCard}>
          <h3 style={secaoTitulo}>📊 Comparativo por Obra</h3>
          {comparativo.length === 0
            ? <p style={vazio}>Sem dados</p>
            : comparativo.map(o => (
              <div key={o.nome} style={obraItem(o.lucro)}
                onClick={() => {
                  const obra = obras.find(ob => nomeObra[String(ob.id)] === o.nome)
                  if (obra) router.push(`/obras/${obra.id}`)
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{o.nome}</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Custo: {format(o.custo)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: o.lucro >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                    {o.lucro >= 0 ? '+' : ''}{format(o.lucro)}
                  </p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>
                    {o.receita > 0 ? ((o.lucro / o.receita) * 100).toFixed(1) + '%' : '—'}
                  </p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

function soma(lista: any[]) { return lista.reduce((a, b) => a + Number(b.valor || 0), 0) }
function format(v: number)  { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

const titulo: React.CSSProperties    = { fontSize: 24, fontWeight: 800, color: '#0f172a' }
const subtitulo: React.CSSProperties = { fontSize: 13, color: '#94a3b8', marginTop: 2, marginBottom: 20 }
const vazio: React.CSSProperties     = { color: '#94a3b8', fontSize: 13 }
const saldoCard = (lucro: number): React.CSSProperties => ({
  background: lucro >= 0 ? '#f0fdf4' : '#fff1f2',
  border: `1px solid ${lucro >= 0 ? '#bbf7d0' : '#fecdd3'}`,
  borderRadius: 16, padding: '20px 24px', marginBottom: 24,
  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
})
const secaoCard: React.CSSProperties   = { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }
const secaoTitulo: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }
const doisGrid: React.CSSProperties    = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }
const tabelaHeader: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }
const tabelaLinha: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 13 }
const barraFundo: React.CSSProperties      = { height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }
const barraPreenchida: React.CSSProperties = { height: '100%', borderRadius: 999, transition: 'width 0.3s' }
const obraItem = (lucro: number): React.CSSProperties => ({
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 0', borderBottom: '1px solid #f1f5f9',
  borderLeft: `3px solid ${lucro >= 0 ? '#22c55e' : '#ef4444'}`,
  paddingLeft: 10, cursor: 'pointer'
})
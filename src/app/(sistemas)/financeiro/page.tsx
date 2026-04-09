'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

export default function Financeiro() {

  const { empresaId, bloqueado, loading } = useEmpresa()
  const router = useRouter()

  const [dados,  setDados]  = useState<any[]>([])
  const [obras,  setObras]  = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && bloqueado) router.push('/bloqueado')
  }, [loading, bloqueado, router])

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {
    try {
      const [{ data: finData, error: errFin }, { data: obrasData, error: errObras }] =
        await Promise.all([
          supabase.from('financeiro').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
          supabase.from('obras').select('id, nome').eq('empresa_id', empresaId),
        ])
      if (errFin)   throw errFin
      if (errObras) throw errObras
      setDados(finData  || [])
      setObras(obrasData || [])
    } catch (err) {
      console.error('Erro financeiro:', err)
      alert('Erro ao carregar financeiro')
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) return <p style={{ padding: 24 }}>Carregando financeiro...</p>

  /* ── TOTAIS GERAIS ── */
  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas   = dados.filter(d => d.tipo === 'saida')
  const receita  = soma(entradas)
  const custo    = soma(saidas)
  const lucro    = receita - custo
  const margem   = receita > 0 ? (lucro / receita) * 100 : 0

  /* ── GRÁFICO MENSAL ── */
  const porMes: Record<string, { mes: string; entrada: number; saida: number }> = {}
  dados.forEach(d => {
    if (!d.created_at) return
    const valor = Number(d.valor || 0)
    const mes = new Date(d.created_at).toLocaleDateString('pt-BR', { month: 'short' })
    if (!porMes[mes]) porMes[mes] = { mes, entrada: 0, saida: 0 }
    if (d.tipo === 'entrada') porMes[mes].entrada += valor
    else                      porMes[mes].saida   += valor
  })
  const grafico = Object.values(porMes)

  /* ── RESULTADO POR OBRA ── */
  const nomeObra: Record<string, string> = {}
  obras.forEach(o => { nomeObra[String(o.id)] = o.nome })

  const porObra: Record<string, { receita: number; custo: number; lucro: number }> = {}
  dados.forEach(d => {
    if (!d.obra_id) return
    const key = String(d.obra_id)
    const valor = Number(d.valor || 0)
    if (!porObra[key]) porObra[key] = { receita: 0, custo: 0, lucro: 0 }
    if (d.tipo === 'entrada') porObra[key].receita += valor
    else                      porObra[key].custo   += valor
    porObra[key].lucro = porObra[key].receita - porObra[key].custo
  })
  const listaObras = Object.entries(porObra).sort((a: any, b: any) => b[1].lucro - a[1].lucro)

  return (
    <div style={{ padding: 24 }}>

      <h1 style={titulo}>💰 Financeiro</h1>
      <p style={{ color: '#64748b', marginTop: -14, marginBottom: 20 }}>
        Resumo consolidado de todas as obras
      </p>

      {lucro < 0 && <div style={alertaErro}>⚠️ Prejuízo no período — verifique os lançamentos nas obras</div>}

      {/* CARDS */}
      <div style={grid}>
        <Card titulo="Receita Total" valor={receita} cor="#16a34a" />
        <Card titulo="Custos Totais" valor={custo}   cor="#dc2626" />
        <Card titulo="Lucro Total"   valor={lucro}   cor="#2563eb" />
        <Card titulo="Margem Geral"  valor={margem}  cor="#a855f7" tipo="porcentagem" />
      </div>

      {/* GRÁFICO */}
      <div style={graficoBox}>
        <h3 style={{ marginBottom: 12 }}>📊 Evolução Financeira Mensal</h3>
        {grafico.length === 0
          ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Sem dados ainda. Lance nas obras.</p>
          : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={grafico}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="entrada" stroke="#16a34a" strokeWidth={2} />
                <Line dataKey="saida"   stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* RESULTADO POR OBRA */}
      <div style={tabelaCard}>
        <h3 style={{ marginBottom: 16 }}>🏗️ Resultado por Obra</h3>

        {listaObras.length === 0
          ? <p style={{ color: '#94a3b8' }}>Nenhum lançamento encontrado. Acesse uma obra para lançar entradas e saídas.</p>
          : (
            <>
              <div style={linhaHeader}>
                <span><strong>Obra</strong></span>
                <span style={{ textAlign: 'right' }}><strong>Receita</strong></span>
                <span style={{ textAlign: 'right' }}><strong>Custo</strong></span>
                <span style={{ textAlign: 'right' }}><strong>Lucro</strong></span>
                <span style={{ textAlign: 'right' }}><strong>Margem</strong></span>
              </div>

              {listaObras.map(([id, d]: any) => {
                const m = d.receita > 0 ? (d.lucro / d.receita) * 100 : 0
                return (
                  <div
                    key={id}
                    onClick={() => router.push(`/obras/${id}`)}
                    style={linhaObra(d.lucro)}
                  >
                    <span style={{ fontWeight: 600 }}>{nomeObra[id] || `Obra ${id}`}</span>
                    <span style={{ textAlign: 'right', color: '#16a34a' }}>{format(d.receita)}</span>
                    <span style={{ textAlign: 'right', color: '#dc2626' }}>{format(d.custo)}</span>
                    <span style={{ textAlign: 'right', color: d.lucro >= 0 ? '#2563eb' : '#dc2626', fontWeight: 700 }}>
                      {format(d.lucro)}
                    </span>
                    <span style={{ textAlign: 'right', color: '#a855f7' }}>
                      {m.toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </>
          )
        }
      </div>

    </div>
  )
}

/* ── HELPERS ── */
function soma(lista: any[]) { return lista.reduce((a, b) => a + Number(b.valor || 0), 0) }
function format(v: number)  { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{ background: cor + '15', padding: 20, borderRadius: 12, border: `1px solid ${cor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <p style={{ color: '#64748b' }}>{titulo}</p>
      <h2 style={{ color: cor, fontSize: 22, fontWeight: 700 }}>
        {tipo === 'porcentagem' ? Number(valor).toFixed(2) + '%' : format(valor)}
      </h2>
    </div>
  )
}

/* ── ESTILOS ── */
const titulo: React.CSSProperties      = { fontSize: 26, fontWeight: 700, marginBottom: 6 }
const grid: React.CSSProperties        = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }
const graficoBox: React.CSSProperties  = { background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 24 }
const alertaErro: React.CSSProperties  = { background: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16, color: '#991b1b', fontWeight: 600 }
const tabelaCard: React.CSSProperties  = { background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
const linhaHeader: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
  padding: '8px 12px',
  background: '#f8fafc',
  borderRadius: 8,
  marginBottom: 6,
  fontSize: 13
}
const linhaObra = (lucro: number): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
  padding: '12px',
  borderBottom: '1px solid #f1f5f9',
  borderLeft: `4px solid ${lucro >= 0 ? '#22c55e' : '#ef4444'}`,
  cursor: 'pointer',
  fontSize: 14,
  transition: 'background 0.1s',
})
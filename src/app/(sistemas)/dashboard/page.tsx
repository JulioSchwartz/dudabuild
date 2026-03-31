'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {

  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data } = await supabase.from('orcamentos').select('*')
    setDados(data || [])
    setLoading(false)
  }

  // 📊 MÉTRICAS
  const total = dados.reduce((acc, o) => acc + (o.valor_total || 0), 0)
  const aprovados = dados.filter(o => o.status === 'aprovado')
  const recusados = dados.filter(o => o.status === 'recusado')
  const pendentes = dados.filter(o => !o.status || o.status === 'pendente')

  const taxaConversao = dados.length
    ? ((aprovados.length / dados.length) * 100).toFixed(1)
    : '0'

  const ticketMedio = aprovados.length
    ? (aprovados.reduce((acc, o) => acc + o.valor_total, 0) / aprovados.length).toFixed(2)
    : '0'

  if (loading) return <p style={{ padding: 24 }}>Carregando...</p>

  return (
    <div style={container}>

      <h1 style={titulo}>📊 Dashboard</h1>

      {/* 📈 CARDS */}
      <div style={grid}>

        <Card titulo="💰 Total Orçado" valor={format(total)} cor="#2563eb" />
        <Card titulo="✅ Aprovados" valor={aprovados.length} cor="#16a34a" />
        <Card titulo="❌ Recusados" valor={recusados.length} cor="#dc2626" />
        <Card titulo="⏳ Pendentes" valor={pendentes.length} cor="#f59e0b" />

        <Card titulo="📈 Conversão" valor={`${taxaConversao}%`} cor="#7c3aed" />
        <Card titulo="💎 Ticket Médio" valor={`R$ ${ticketMedio}`} cor="#0ea5e9" />

      </div>

      {/* 📊 LISTA RECENTE */}
      <div style={cardGrande}>
        <h2>Últimos Orçamentos</h2>

        <table style={tabela}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>

          <tbody>
            {dados.slice(0, 5).map(o => (
              <tr key={o.id}>
                <td>{o.cliente_nome}</td>
                <td>{format(o.valor_total)}</td>
                <td style={status(o.status)}>{o.status || 'pendente'}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📊 RESUMO VISUAL (BARRAS SIMPLES) */}
      <div style={cardGrande}>
        <h2>Distribuição</h2>

        <Bar label="Aprovados" valor={aprovados.length} cor="#16a34a" total={dados.length} />
        <Bar label="Recusados" valor={recusados.length} cor="#dc2626" total={dados.length} />
        <Bar label="Pendentes" valor={pendentes.length} cor="#f59e0b" total={dados.length} />

      </div>

    </div>
  )
}

/* 🔥 COMPONENTES */

function Card({ titulo, valor, cor }: any) {
  return (
    <div style={{ ...card, borderLeft: `6px solid ${cor}` }}>
      <h4>{titulo}</h4>
      <h2>{valor}</h2>
    </div>
  )
}

function Bar({ label, valor, total, cor }: any) {
  const porcentagem = total ? (valor / total) * 100 : 0

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span>{valor}</span>
      </div>

      <div style={barContainer}>
        <div style={{
          width: `${porcentagem}%`,
          background: cor,
          height: 10,
          borderRadius: 6
        }} />
      </div>
    </div>
  )
}

/* 🎨 ESTILO */

const container = {
  padding: 24,
  background: '#f1f5f9',
  minHeight: '100vh'
}

const titulo = {
  fontSize: 28,
  fontWeight: 700,
  marginBottom: 20
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 20
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 10,
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
}

const cardGrande = {
  background: '#fff',
  padding: 20,
  borderRadius: 10,
  marginTop: 20
}

const tabela = {
  width: '100%',
  marginTop: 10,
  borderCollapse: 'collapse'
}

const barContainer = {
  width: '100%',
  background: '#e5e7eb',
  borderRadius: 6,
  marginTop: 4
}

function format(valor: number) {
  return valor?.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

function status(s?: string) {
  if (s === 'aprovado') return { color: '#16a34a', fontWeight: 600 }
  if (s === 'recusado') return { color: '#dc2626', fontWeight: 600 }
  return { color: '#f59e0b', fontWeight: 600 }
}
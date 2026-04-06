'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import Layout from '@/components/Layout'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

export default function Dashboard() {

  const { empresaId, limites, plano, loading: loadingEmpresa } = useEmpresa()

  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [financeiro, setFinanceiro] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {

    const { data: o } = await supabase.from('orcamentos').select('*').eq('empresa_id', empresaId)
    const { data: ob } = await supabase.from('obras').select('*').eq('empresa_id', empresaId)
    const { data: fin } = await supabase.from('financeiro').select('*').eq('empresa_id', empresaId)

    setOrcamentos(o || [])
    setObras(ob || [])
    setFinanceiro(fin || [])
    setLoading(false)
  }

  /* ================= FINANCEIRO ================= */

  const entradas = financeiro.filter(f => f.tipo === 'entrada')
  const saidas = financeiro.filter(f => f.tipo === 'saida')

  const totalEntrada = entradas.reduce((a,b)=>a+b.valor,0)
  const totalSaida = saidas.reduce((a,b)=>a+b.valor,0)
  const lucro = totalEntrada - totalSaida

  /* ================= ORÇAMENTOS ================= */

  const aprovados = orcamentos.filter(o => o.status === 'aprovado')
  const recusados = orcamentos.filter(o => o.status === 'recusado')
  const pendentes = orcamentos.filter(o => !o.status || o.status === 'pendente')

  const totalOrcado = orcamentos.reduce((acc, o) => acc + (o.valor_total || 0), 0)

  const taxaConversao = orcamentos.length
    ? ((aprovados.length / orcamentos.length) * 100).toFixed(1)
    : '0'

  const ticketMedio = aprovados.length
    ? (aprovados.reduce((acc, o) => acc + o.valor_total, 0) / aprovados.length).toFixed(2)
    : '0'

  /* ================= OBRAS ================= */

  const obrasAndamento = obras.filter(o => o.status === 'andamento')
  const obrasFinalizadas = obras.filter(o => o.status === 'finalizada')
  const obrasPausadas = obras.filter(o => o.status === 'pausada')

  const totalObras = obras.reduce((acc, o) => acc + (o.valor_total || 0), 0)

  const progressoMedio = obras.length
    ? (obras.reduce((acc, o) => acc + (o.progresso || 0), 0) / obras.length).toFixed(1)
    : '0'

  /* ================= GRÁFICO FINANCEIRO ================= */

  const fluxo: any = {}

  financeiro.forEach(f=>{
    if (!f.created_at) return

    const mes = new Date(f.created_at).toLocaleDateString('pt-BR',{month:'short'})

    if(!fluxo[mes]) fluxo[mes] = {mes, entrada:0, saida:0}

    if(f.tipo==='entrada') fluxo[mes].entrada += f.valor
    else fluxo[mes].saida += f.valor
  })

  const graficoFluxo = Object.values(fluxo)

  /* ================= FUNIL ================= */

  const funil = [
    { name: 'Orçados', value: orcamentos.length },
    { name: 'Aprovados', value: aprovados.length },
    { name: 'Em Obra', value: obrasAndamento.length },
    { name: 'Finalizados', value: obrasFinalizadas.length }
  ]

  const statusOrc = [
    { name: 'Aprovados', value: aprovados.length },
    { name: 'Recusados', value: recusados.length },
    { name: 'Pendentes', value: pendentes.length }
  ]

  const statusObras = [
    { name: 'Andamento', value: obrasAndamento.length },
    { name: 'Finalizadas', value: obrasFinalizadas.length },
    { name: 'Pausadas', value: obrasPausadas.length }
  ]

  const limiteOrc = limites.orcamentos
  const limiteObras = limites.obras

  const limiteOrcAtingido = limiteOrc !== Infinity && orcamentos.length >= limiteOrc
  const limiteObrasAtingido = limiteObras !== Infinity && obras.length >= limiteObras

  if (loadingEmpresa || loading) return <Loader />

  return (
  <Layout>

    <h1 style={titulo}>🚀 Dashboard Executivo</h1>

    {(limiteOrcAtingido || limiteObrasAtingido) && (
      <div style={alerta}>
        🚨 Você atingiu limites do plano <strong>{plano}</strong>.
      </div>
    )}

    <div style={grid}>

      <Card titulo="💰 Receita" valor={format(totalEntrada)} cor="#16a34a" />
      <Card titulo="💸 Custos" valor={format(totalSaida)} cor="#dc2626" />
      <Card titulo="📊 Lucro" valor={format(lucro)} cor="#2563eb" />
      <Card titulo="📈 Conversão" valor={`${taxaConversao}%`} cor="#7c3aed" />

    </div>

    <div style={cardGrande}>
      <h3>📈 Fluxo Financeiro</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={graficoFluxo}>
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line dataKey="entrada" stroke="#16a34a" />
          <Line dataKey="saida" stroke="#dc2626" />
        </LineChart>
      </ResponsiveContainer>
    </div>

  </Layout>
)

/* COMPONENTES */

function Loader() {
  return <p style={{ padding: 20 }}>Carregando...</p>
}

function Card({ titulo, valor, cor }: any) {
  return (
    <div style={{ ...card, borderLeft: `6px solid ${cor}` }}>
      <h4>{titulo}</h4>
      <h2>{valor}</h2>
    </div>
  )
}

/* ESTILO */

const alerta = { background: '#fef3c7', padding: 15, borderRadius: 8, marginBottom: 20 }

const container = { padding: 24, background: '#f1f5f9', minHeight: '100vh' }
const titulo = { fontSize: 28, fontWeight: 700, marginBottom: 20 }

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 20,
  marginBottom: 20
}

const grid2 = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 12
}

const cardGrande = {
  background: '#fff',
  padding: 20,
  borderRadius: 12
}

function format(v:number){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}
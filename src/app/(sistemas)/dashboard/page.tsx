'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

export default function Dashboard() {

  const { empresaId, limites, plano, loading: loadingEmpresa } = useEmpresa()
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {

    if (!empresaId) return

    const { data: o } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('empresa_id', empresaId)

    const { data: ob } = await supabase
      .from('obras')
      .select('*')
      .eq('empresa_id', empresaId)

    setOrcamentos(o || [])
    setObras(ob || [])
    setLoading(false)
  }

  /* =========================
     📊 ORÇAMENTOS
  ========================= */

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

  /* =========================
     🏗️ OBRAS
  ========================= */

  const obrasAndamento = obras.filter(o => o.status === 'andamento')
  const obrasFinalizadas = obras.filter(o => o.status === 'finalizada')
  const obrasPausadas = obras.filter(o => o.status === 'pausada')

  const totalObras = obras.reduce((acc, o) => acc + (o.valor_total || 0), 0)

  const progressoMedio = obras.length
    ? (obras.reduce((acc, o) => acc + (o.progresso || 0), 0) / obras.length).toFixed(1)
    : '0'

  /* =========================
     📊 FUNIL
  ========================= */

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

  // 🔥 LOADER
  if (loadingEmpresa) return <Loader />
  if (loading) return <Loader />

  return (
    <div style={container}>

      <h1 style={titulo}>📊 Dashboard Geral</h1>

      {/* 🚨 ALERTA INTELIGENTE */}
      {(limiteOrcAtingido || limiteObrasAtingido) && (
        <div style={alerta}>
          🚨 Você atingiu limites do plano <strong>{plano}</strong>.
          <button
            style={btnUpgrade}
            onClick={() => window.location.href = '/bloqueado'}
          >
            Fazer upgrade
          </button>
        </div>
      )}

      {/* 📊 KPI */}
      <div style={grid}>

        <Card titulo="💰 Total Orçado" valor={format(totalOrcado)} cor="#2563eb" />
        <Card titulo="💵 Total em Obras" valor={format(totalObras)} cor="#16a34a" />
        <Card titulo="📈 Conversão" valor={`${taxaConversao}%`} cor="#7c3aed" />
        <Card titulo="💎 Ticket Médio" valor={`R$ ${ticketMedio}`} cor="#0ea5e9" />

        <Card titulo={`🏗️ Obras (${obras.length}/${limiteObras === Infinity ? '∞' : limiteObras})`} valor={obrasAndamento.length} cor="#f59e0b" />
        <Card titulo="✅ Finalizadas" valor={obrasFinalizadas.length} cor="#16a34a" />
        <Card titulo="⏸️ Pausadas" valor={obrasPausadas.length} cor="#dc2626" />
        <Card titulo="⚙️ Progresso Médio" valor={`${progressoMedio}%`} cor="#6366f1" />

      </div>

      {/* 📊 GRÁFICOS */}
      <div style={grid2}>

        <div style={cardGrande}>
          <h3>📊 Funil Completo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={funil}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={cardGrande}>
          <h3>📄 Status dos Orçamentos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusOrc} dataKey="value" outerRadius={80}>
                <Cell fill="#16a34a" />
                <Cell fill="#dc2626" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={cardGrande}>
          <h3>🏗️ Status das Obras</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusObras} dataKey="value" outerRadius={80}>
                <Cell fill="#f59e0b" />
                <Cell fill="#16a34a" />
                <Cell fill="#dc2626" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={cardGrande}>
          <h3>💰 Maiores Orçamentos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={orcamentos
                .sort((a, b) => b.valor_total - a.valor_total)
                .slice(0, 5)
                .map(o => ({
                  nome: o.cliente_nome,
                  valor: o.valor_total
                }))
              }
            >
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="valor" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  )
}

/* LOADER */
function Loader() {
  return (
    <div style={loaderContainer}>
      <div style={spinner}></div>
      <p>Carregando...</p>
    </div>
  )
}

/* COMPONENTES */

function Card({ titulo, valor, cor }: any) {
  return (
    <div style={{ ...card, borderLeft: `6px solid ${cor}` }}>
      <h4>{titulo}</h4>
      <h2>{valor}</h2>
    </div>
  )
}

/* ESTILO */

const alerta = {
  background: '#fef3c7',
  padding: 15,
  borderRadius: 8,
  marginBottom: 20,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const btnUpgrade = {
  background: '#f59e0b',
  color: '#fff',
  padding: '6px 12px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer'
}

const loaderContainer = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  height: '60vh'
}

const spinner = {
  width: 40,
  height: 40,
  border: '4px solid #e2e8f0',
  borderTop: '4px solid #2563eb',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
}

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
  borderRadius: 10,
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
}

const cardGrande = {
  background: '#fff',
  padding: 20,
  borderRadius: 10
}

function format(valor: number) {
  return valor?.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}
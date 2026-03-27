'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    const empresa = localStorage.getItem('empresa_id')

    if (!empresa) {
      router.push('/login')
    } else {
      setCarregado(true)
    }
  }, [])

  if (!carregado) return null

  return <DashboardInterno />
}

function DashboardInterno() {
  const [obras, setObras] = useState<any[]>([])
  const [financeiro, setFinanceiro] = useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const empresa_id = localStorage.getItem('empresa_id')

    const { data: obrasData } = await supabase
      .from('obras')
      .select('*')
      .eq('empresa_id', empresa_id)

    const { data: financeiroData } = await supabase
      .from('financeiro')
      .select('*')
      .eq('empresa_id', empresa_id)

    setObras(obrasData || [])
    setFinanceiro(financeiroData || [])
  }

  // =========================
  // 📊 BASE
  // =========================

  const entradas = financeiro.filter(f => f.tipo === 'entrada')
  const saidas = financeiro.filter(f => f.tipo === 'saida')

  const totalEntradas = entradas.reduce((acc, f) => acc + Number(f.valor), 0)
  const totalSaidas = saidas.reduce((acc, f) => acc + Number(f.valor), 0)

  const lucro = totalEntradas - totalSaidas
  const margem = totalEntradas > 0 ? (lucro / totalEntradas) * 100 : 0

  // =========================
  // 📈 MÉTRICAS AVANÇADAS
  // =========================

  const ticketMedio = entradas.length > 0 ? totalEntradas / entradas.length : 0
  const custoMedio = saidas.length > 0 ? totalSaidas / saidas.length : 0

  // =========================
  // 🏗️ POR OBRA
  // =========================

  const resumoObras = obras.map((obra) => {
    const entradas = financeiro
      .filter((f) => f.obra_id === obra.id && f.tipo === 'entrada')
      .reduce((acc, f) => acc + Number(f.valor), 0)

    const saidas = financeiro
      .filter((f) => f.obra_id === obra.id && f.tipo === 'saida')
      .reduce((acc, f) => acc + Number(f.valor), 0)

    const lucro = entradas - saidas

    return {
      nome: obra.nome,
      lucro,
      status: lucro < 0 ? 'prejuizo' : 'lucro',
    }
  })

  const ranking = [...resumoObras].sort((a, b) => b.lucro - a.lucro)

  const prejuizos = ranking.filter(o => o.lucro < 0)

  return (
    <div>
      <h1 style={titulo}>Dashboard Executivo</h1>
      <p style={subtitulo}>Controle inteligente da sua empresa</p>

      {/* KPIs PRINCIPAIS */}
      <div style={grid}>
        <Card titulo="Obras Ativas" valor={obras.length} cor="#3b82f6" />
        <Card titulo="Receita Total" valor={totalEntradas} cor="#22c55e" />
        <Card titulo="Custos Totais" valor={totalSaidas} cor="#ef4444" />
        <Card titulo="Lucro" valor={lucro} cor="#a855f7" destaque />
        <Card titulo="Margem" valor={margem} cor="#0ea5e9" tipo="percent" />
      </div>

      {/* MÉTRICAS AVANÇADAS */}
      <h2 style={sectionTitle}>Indicadores Estratégicos</h2>

      <div style={grid}>
        <Card titulo="Ticket Médio" valor={ticketMedio} cor="#14b8a6" />
        <Card titulo="Custo Médio" valor={custoMedio} cor="#f59e0b" />
      </div>

      {/* ALERTAS */}
      {prejuizos.length > 0 && (
        <div style={alerta}>
          ⚠️ Atenção: {prejuizos.length} obra(s) estão com prejuízo!
        </div>
      )}

      {/* RANKING */}
      <h2 style={sectionTitle}>Ranking de Obras</h2>

      <div style={box}>
        {ranking.map((obra, index) => (
          <div key={index} style={linha}>
            <span>
              {index + 1}º - {obra.nome}
            </span>

            <strong style={{
              color: obra.lucro < 0 ? '#ef4444' : '#22c55e'
            }}>
              {Number(obra.lucro).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}

/* COMPONENTES */

function Card({ titulo, valor, cor, destaque, tipo }: any) {
  return (
    <div style={{
      ...card,
      borderLeft: `6px solid ${cor}`,
      transform: destaque ? 'scale(1.05)' : 'scale(1)'
    }}>
      <p style={cardTitulo}>{titulo}</p>

      <h2 style={cardValor}>
        {tipo === 'percent'
          ? `${valor.toFixed(2)}%`
          : typeof valor === 'number'
          ? valor.toLocaleString('pt-BR', {
              style: titulo.includes('Obras') ? 'decimal' : 'currency',
              currency: 'BRL',
            })
          : valor}
      </h2>
    </div>
  )
}

/* ESTILO */

const titulo = {
  fontSize: '28px',
  color: '#0f172a'
}

const subtitulo = {
  color: '#64748b',
  marginBottom: '20px'
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '20px',
  marginTop: '20px'
}

const card = {
  background: '#fff',
  padding: '20px',
  borderRadius: '14px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
}

const cardTitulo = {
  color: '#64748b'
}

const cardValor = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#0f172a'
}

const alerta = {
  marginTop: '20px',
  padding: '15px',
  background: '#fee2e2',
  color: '#991b1b',
  borderRadius: '10px',
  fontWeight: 'bold'
}

const sectionTitle = {
  marginTop: '30px',
  marginBottom: '10px',
  color: '#0f172a'
}

const box = {
  background: '#fff',
  padding: '20px',
  borderRadius: '14px',
  marginTop: '10px'
}

const linha = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '10px'
}
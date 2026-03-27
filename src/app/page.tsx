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

  const totalEntradas = financeiro
    .filter((f) => f.tipo === 'entrada')
    .reduce((acc, f) => acc + Number(f.valor), 0)

  const totalSaidas = financeiro
    .filter((f) => f.tipo === 'saida')
    .reduce((acc, f) => acc + Number(f.valor), 0)

  const lucro = totalEntradas - totalSaidas
  const margem = totalEntradas > 0 ? (lucro / totalEntradas) * 100 : 0

  // =========================
  // 🏗️ POR OBRA
  // =========================

  const lucroPorObra = obras.map((obra) => {
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
    }
  })

  const ranking = [...lucroPorObra].sort((a, b) => b.lucro - a.lucro)

  const obrasPrejuizo = ranking.filter((o) => o.lucro < 0)

  return (
    <div>
      {/* HEADER */}
      <h1 style={titulo}>Dashboard Executivo</h1>
      <p style={subtitulo}>Visão geral da sua operação</p>

      {/* CARDS */}
      <div style={grid}>
        <Card titulo="Obras" valor={obras.length} cor="#3b82f6" />
        <Card titulo="Receita" valor={totalEntradas} cor="#22c55e" />
        <Card titulo="Custos" valor={totalSaidas} cor="#ef4444" />
        <Card titulo="Lucro" valor={lucro} cor="#a855f7" destaque />
        <Card titulo="Margem" valor={margem} cor="#0ea5e9" tipo="percent" />
      </div>

      {/* ALERTA */}
      {obrasPrejuizo.length > 0 && (
        <div style={alerta}>
          ⚠️ Você tem {obrasPrejuizo.length} obra(s) com prejuízo!
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

            <strong
              style={{
                color: obra.lucro < 0 ? '#ef4444' : '#22c55e',
              }}
            >
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

/* COMPONENTE CARD */

function Card({ titulo, valor, cor, destaque, tipo }: any) {
  return (
    <div
      style={{
        ...card,
        borderLeft: `6px solid ${cor}`,
        transform: destaque ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <p style={cardTitulo}>{titulo}</p>

      <h2 style={cardValor}>
        {tipo === 'percent'
          ? `${valor.toFixed(2)}%`
          : typeof valor === 'number'
          ? valor.toLocaleString('pt-BR', {
              style: titulo === 'Obras' ? 'decimal' : 'currency',
              currency: 'BRL',
            })
          : valor}
      </h2>
    </div>
  )
}

/* 🎨 ESTILO */

const titulo = {
  color: '#0f172a',
  fontSize: '28px',
  marginBottom: '5px',
}

const subtitulo = {
  color: '#64748b',
  marginBottom: '20px',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '20px',
}

const card = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '14px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  transition: '0.2s',
}

const cardTitulo = {
  color: '#64748b',
  fontSize: '14px',
}

const cardValor = {
  color: '#0f172a',
  fontSize: '22px',
  fontWeight: 'bold',
}

const alerta = {
  marginTop: '20px',
  padding: '15px',
  background: '#fee2e2',
  color: '#991b1b',
  borderRadius: '10px',
  fontWeight: 'bold',
}

const sectionTitle = {
  marginTop: '30px',
  marginBottom: '10px',
  color: '#0f172a',
}

const box = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '14px',
  boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
}

const linha = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid #e2e8f0',
}
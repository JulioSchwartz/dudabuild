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

  const totalEntradas = financeiro
    .filter((f) => f.tipo === 'entrada')
    .reduce((acc, f) => acc + Number(f.valor), 0)

  const totalSaidas = financeiro
    .filter((f) => f.tipo === 'saida')
    .reduce((acc, f) => acc + Number(f.valor), 0)

  const lucro = totalEntradas - totalSaidas

  const lucroPorObra = obras.map((obra) => {
    const entradas = financeiro
      .filter((f) => f.obra_id === obra.id && f.tipo === 'entrada')
      .reduce((acc, f) => acc + Number(f.valor), 0)

    const saidas = financeiro
      .filter((f) => f.obra_id === obra.id && f.tipo === 'saida')
      .reduce((acc, f) => acc + Number(f.valor), 0)

    return {
      nome: obra.nome,
      lucro: entradas - saidas,
    }
  })

  const ranking = [...lucroPorObra].sort((a, b) => b.lucro - a.lucro)

  return (
    <div>
      {/* HEADER */}
      <h1 style={titulo}>Dashboard Geral</h1>
      <p style={subtitulo}>
        Visão geral financeira das obras
      </p>

      {/* CARDS */}
      <div style={grid}>
        <Card titulo="Obras" valor={obras.length} cor="#3b82f6" />
        <Card titulo="Receita" valor={totalEntradas} cor="#22c55e" />
        <Card titulo="Custos" valor={totalSaidas} cor="#ef4444" />
        <Card titulo="Lucro" valor={lucro} cor="#a855f7" destaque />
      </div>

      {/* RANKING */}
      <h2 style={sectionTitle}>Ranking de Obras</h2>

      <div style={box}>
        {ranking.map((obra, index) => (
          <div key={index} style={linha}>
            <span style={nomeObra}>
              {index + 1}º - {obra.nome}
            </span>

            <strong style={valorObra}>
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

function Card({ titulo, valor, cor, destaque }: any) {
  return (
    <div
      style={{
        ...card,
        borderLeft: `6px solid ${cor}`,
        transform: destaque ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      <p style={cardTitulo}>{titulo}</p>

      <h2 style={cardValor}>
        {typeof valor === 'number'
          ? valor.toLocaleString('pt-BR', {
              style: titulo === 'Obras' ? 'decimal' : 'currency',
              currency: 'BRL',
            })
          : valor}
      </h2>
    </div>
  )
}

/* 🎨 ESTILO PROFISSIONAL */

const titulo = {
  color: '#0f172a',
  fontSize: '26px',
  marginBottom: '5px',
}

const subtitulo = {
  color: '#64748b',
  marginBottom: '20px',
}

const sectionTitle = {
  marginTop: '30px',
  marginBottom: '10px',
  color: '#0f172a',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '20px',
  marginTop: '20px',
}

const card = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '14px',
  boxShadow: '0 8px 25px rgba(0,0,0,0.06)',
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

const box = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '14px',
  marginTop: '10px',
  boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
}

const linha = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid #e2e8f0',
}

const nomeObra = {
  color: '#334155',
}

const valorObra = {
  color: '#0f172a',
}
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
      <h1 style={{ color: '#0f172a' }}>Dashboard Geral</h1>

      <div style={grid}>
        <Card titulo="Obras" valor={obras.length} cor="#2563eb" />
        <Card titulo="Receita" valor={totalEntradas} cor="#22c55e" />
        <Card titulo="Custos" valor={totalSaidas} cor="#ef4444" />
        <Card titulo="Lucro" valor={lucro} cor="#9333ea" />
      </div>

      <h2 style={{ marginTop: '30px', color: '#0f172a' }}>
        Ranking de Obras
      </h2>

      <div style={box}>
        {ranking.map((obra, index) => (
          <div key={index} style={linha}>
            <span style={{ color: '#334155' }}>
              {index + 1}º - {obra.nome}
            </span>
            <strong style={{ color: '#0f172a' }}>
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

function Card({ titulo, valor, cor }: any) {
  return (
    <div style={{ ...card, borderLeft: `6px solid ${cor}` }}>
      <p style={{ color: '#64748b', marginBottom: '5px' }}>{titulo}</p>

      <h2 style={{ color: '#0f172a' }}>
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

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px',
  marginTop: '20px',
}

const card = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}

const box = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  marginTop: '10px',
}

const linha = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px',
}
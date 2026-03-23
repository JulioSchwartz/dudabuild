'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function FinanceiroGeral() {
  const [obras, setObras] = useState<any[]>([])
  const [financeiro, setFinanceiro] = useState<any[]>([])

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: obrasData } = await supabase.from('obras').select('*')
    const { data: financeiroData } = await supabase.from('financeiro').select('*')

    setObras(obrasData || [])
    setFinanceiro(financeiroData || [])
  }

  // =========================
  // 📊 CÁLCULOS
  // =========================

  const entradas = financeiro.filter(f => f.tipo === 'entrada')
  const saidas = financeiro.filter(f => f.tipo === 'saida')

  const receitaTotal = entradas.reduce((acc, item) => acc + Number(item.valor), 0)
  const custoTotal = saidas.reduce((acc, item) => acc + Number(item.valor), 0)

  const lucro = receitaTotal - custoTotal
  const margem = receitaTotal > 0 ? (lucro / receitaTotal) * 100 : 0

  // Valor por m² (simulado se não tiver área)
  const areaTotal = obras.reduce((acc, o) => acc + Number(o.area || 100), 0)
  const valorPorM2 = receitaTotal / areaTotal

  // Eficiência (simulada)
  const percentualFinanceiro = custoTotal / (receitaTotal || 1)
  const percentualFisico = obras.length > 0 ? 0.7 : 0 // mock inicial

  const eficiencia = percentualFisico - percentualFinanceiro

  // Giro do capital
  const giro = custoTotal > 0 ? receitaTotal / custoTotal : 0

  // =========================
  // 🎨 COMPONENTE CARD
  // =========================

  function Card({ titulo, valor, cor }: any) {
    return (
      <div
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          width: '250px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          borderLeft: `6px solid ${cor}`,
        }}
      >
        <h4>{titulo}</h4>
        <h2>{valor}</h2>
      </div>
    )
  }

  function formatar(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1>Financeiro Geral</h1>

      {/* ========================= */}
      {/* 💰 RESUMO */}
      {/* ========================= */}

      <div style={grid}>
        <Card titulo="Receita Total" valor={formatar(receitaTotal)} cor="#22c55e" />
        <Card titulo="Custo Total" valor={formatar(custoTotal)} cor="#ef4444" />
        <Card titulo="Lucro" valor={formatar(lucro)} cor="#2563eb" />
        <Card titulo="Margem" valor={margem.toFixed(2) + '%'} cor="#9333ea" />
      </div>

      {/* ========================= */}
      {/* 📈 RENTABILIDADE */}
      {/* ========================= */}

      <h2 style={tituloSecao}>Rentabilidade</h2>

      <div style={grid}>
        <Card titulo="Valor por m²" valor={formatar(valorPorM2)} cor="#14b8a6" />
        <Card titulo="Giro do Capital" valor={giro.toFixed(2)} cor="#f59e0b" />
      </div>

      {/* ========================= */}
      {/* ⏱️ EFICIÊNCIA */}
      {/* ========================= */}

      <h2 style={tituloSecao}>Eficiência da Obra</h2>

      <div style={grid}>
        <Card
          titulo="% Financeiro"
          valor={(percentualFinanceiro * 100).toFixed(2) + '%'}
          cor="#ef4444"
        />
        <Card
          titulo="% Físico (estimado)"
          valor={(percentualFisico * 100).toFixed(2) + '%'}
          cor="#22c55e"
        />
        <Card
          titulo="Eficiência"
          valor={eficiencia.toFixed(2)}
          cor="#3b82f6"
        />
      </div>

      {/* ========================= */}
      {/* 📉 ÍNDICES */}
      {/* ========================= */}

      <h2 style={tituloSecao}>Índices de Mercado</h2>

      <div style={grid}>
        <Card titulo="INCC (mock)" valor="+0.45%" cor="#6366f1" />
        <Card titulo="SINAPI (mock)" valor="R$ 1.250/m²" cor="#06b6d4" />
      </div>
    </div>
  )
}

// =========================
// 🎨 ESTILOS
// =========================

const grid = {
  display: 'flex',
  gap: '20px',
  flexWrap: 'wrap',
  marginBottom: '30px',
}

const tituloSecao = {
  marginTop: '30px',
  marginBottom: '10px',
}
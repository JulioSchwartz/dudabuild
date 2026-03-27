'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Financeiro() {
  const [obras, setObras] = useState<any[]>([])
  const [financeiro, setFinanceiro] = useState<any[]>([])
  const [obraFiltro, setObraFiltro] = useState('')

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
  // 🔍 FILTRO
  // =========================

  const dadosFiltrados = obraFiltro
    ? financeiro.filter((f) => String(f.obra_id) === obraFiltro)
    : financeiro

  // =========================
  // 📊 BASE
  // =========================

  const receita = dadosFiltrados
    .filter((f) => f.tipo === 'entrada')
    .reduce((acc, f) => acc + Number(f.valor), 0)

  const custo = dadosFiltrados
    .filter((f) => f.tipo === 'saida')
    .reduce((acc, f) => acc + Number(f.valor), 0)

  const lucro = receita - custo
  const margem = receita > 0 ? (lucro / receita) * 100 : 0

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

    return {
      nome: obra.nome,
      lucro: entradas - saidas,
    }
  })

  const ranking = [...lucroPorObra].sort((a, b) => b.lucro - a.lucro)
  const prejuizo = ranking.filter((o) => o.lucro < 0)

  return (
    <div>
      <h1 style={titulo}>Financeiro Geral</h1>
      <p style={subtitulo}>Visão consolidada da empresa</p>

      {/* FILTRO */}
      <select
        value={obraFiltro}
        onChange={(e) => setObraFiltro(e.target.value)}
        style={select}
      >
        <option value="">Todas as obras</option>
        {obras.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </select>

      {/* CARDS */}
      <div style={grid}>
        <Card titulo="Receita" valor={receita} cor="#22c55e" />
        <Card titulo="Custos" valor={custo} cor="#ef4444" />
        <Card titulo="Lucro" valor={lucro} cor="#3b82f6" destaque />
        <Card titulo="Margem" valor={margem} cor="#a855f7" tipo="percent" />
      </div>

      {/* ALERTA */}
      {prejuizo.length > 0 && (
        <div style={alerta}>
          ⚠️ {prejuizo.length} obra(s) estão no prejuízo
        </div>
      )}

      {/* RANKING */}
      <h2 style={sectionTitle}>Ranking Financeiro</h2>

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
          : Number(valor).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
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

const select = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
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
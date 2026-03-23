'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function FinanceiroGeral() {
  const [obras, setObras] = useState<any[]>([])
  const [financeiro, setFinanceiro] = useState<any[]>([])
  const [historico, setHistorico] = useState<any[]>([])

  const [novoValorM2, setNovoValorM2] = useState('')
  const [mes, setMes] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: obrasData } = await supabase.from('obras').select('*')
    const { data: financeiroData } = await supabase.from('financeiro').select('*')
    const { data: histData } = await supabase.from('historico_m2').select('*')

    setObras(obrasData || [])
    setFinanceiro(financeiroData || [])
    setHistorico(histData || [])
  }

  // =========================
  // 📊 CÁLCULOS
  // =========================

  const entradas = financeiro.filter(f => f.tipo === 'entrada')
  const saidas = financeiro.filter(f => f.tipo === 'saida')

  const receita = entradas.reduce((acc, i) => acc + Number(i.valor), 0)
  const custo = saidas.reduce((acc, i) => acc + Number(i.valor), 0)

  const lucro = receita - custo

  const cpi = custo > 0 ? receita / custo : 0

  const prazoPlanejado = obras.reduce((acc, o) => acc + Number(o.prazo_planejado || 0), 0)
  const prazoReal = obras.reduce((acc, o) => acc + Number(o.prazo_real || 0), 0)

  const desempenhoPrazo =
    prazoPlanejado > 0 ? ((prazoPlanejado - prazoReal) / prazoPlanejado) * 100 : 0

  const acidentes = obras.reduce((acc, o) => acc + Number(o.acidentes || 0), 0)

  // =========================
  // 💾 SALVAR M²
  // =========================

  async function salvarM2() {
    await supabase.from('historico_m2').insert([
      {
        valor: Number(novoValorM2),
        mes,
      },
    ])

    setNovoValorM2('')
    setMes('')
    carregarDados()
  }

  // =========================
  // 🎨 UI
  // =========================

  function Card({ titulo, valor, cor }: any) {
    return (
      <div style={{ ...card, borderLeft: `6px solid ${cor}` }}>
        <h4>{titulo}</h4>
        <h2>{valor}</h2>
      </div>
    )
  }

  function formatar(v: number) {
    return v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1>Financeiro Geral</h1>

      {/* RESUMO */}
      <div style={grid}>
        <Card titulo="Receita" valor={formatar(receita)} cor="#22c55e" />
        <Card titulo="Custos" valor={formatar(custo)} cor="#ef4444" />
        <Card titulo="Lucro" valor={formatar(lucro)} cor="#2563eb" />
        <Card titulo="CPI" valor={cpi.toFixed(2)} cor="#f59e0b" />
      </div>

      {/* PRAZO */}
      <h2 style={titulo}>Prazo da Obra</h2>

      <div style={grid}>
        <Card titulo="Planejado" valor={prazoPlanejado + ' dias'} cor="#3b82f6" />
        <Card titulo="Real" valor={prazoReal + ' dias'} cor="#ef4444" />
        <Card titulo="Desempenho" valor={desempenhoPrazo.toFixed(2) + '%'} cor="#22c55e" />
      </div>

      {/* SEGURANÇA */}
      <h2 style={titulo}>Segurança</h2>

      <div style={grid}>
        <Card titulo="Acidentes" valor={acidentes} cor="#dc2626" />
      </div>

      {/* VALOR M² */}
      <h2 style={titulo}>Valor por m²</h2>

      <div style={{ marginBottom: '20px' }}>
        <input
          placeholder="Valor por m²"
          value={novoValorM2}
          onChange={(e) => setNovoValorM2(e.target.value)}
        />

        <input
          placeholder="Mês (ex: Jan/2026)"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
        />

        <button onClick={salvarM2}>Salvar</button>
      </div>

      <div>
        {historico.map((h) => (
          <div key={h.id}>
            {h.mes} - {formatar(h.valor)}
          </div>
        ))}
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
}

const card = {
  background: '#fff',
  padding: '20px',
  borderRadius: '10px',
  width: '250px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
}

const titulo = {
  marginTop: '30px',
}
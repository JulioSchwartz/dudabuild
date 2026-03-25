'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Financeiro() {
  const [obras, setObras] = useState<any[]>([])
  const [obraId, setObraId] = useState('')
  const [financeiro, setFinanceiro] = useState<any[]>([])

  const [area, setArea] = useState(0)
  const [prazoPlanejado, setPrazoPlanejado] = useState(0)
  const [prazoReal, setPrazoReal] = useState(0)
  const [progressoPlanejado, setProgressoPlanejado] = useState(0)
  const [progressoReal, setProgressoReal] = useState(0)
  const [acidentes, setAcidentes] = useState(0)

  useEffect(() => {
    carregarObras()
  }, [])

  useEffect(() => {
    if (obraId) carregarFinanceiro()
  }, [obraId])

  async function carregarObras() {
    const empresa_id = localStorage.getItem('empresa_id')

    const { data } = await supabase
      .from('obras')
      .select('*')
      .eq('empresa_id', empresa_id)

    setObras(data || [])
  }

  async function carregarFinanceiro() {
    const empresa_id = localStorage.getItem('empresa_id')

    const { data } = await supabase
      .from('financeiro')
      .select('*')
      .eq('empresa_id', empresa_id)
      .eq('obra_id', obraId)

    setFinanceiro(data || [])
  }

  // =========================
  // 💰 BASE
  // =========================

  const receita = financeiro
    .filter(f => f.tipo === 'entrada')
    .reduce((acc, f) => acc + Number(f.valor), 0)

  const custo = financeiro
    .filter(f => f.tipo === 'saida')
    .reduce((acc, f) => acc + Number(f.valor), 0)

  const lucro = receita - custo

  // =========================
  // 📊 KPIs
  // =========================

  const margem = receita > 0 ? (lucro / receita) * 100 : 0
  const cpi = custo > 0 ? receita / custo : 0
  const spi = progressoPlanejado > 0 ? progressoReal / progressoPlanejado : 0
  const custoM2 = area > 0 ? custo / area : 0

  function formatar(v: number) {
    return v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  function formatarPercent(v: number) {
    return `${v.toFixed(2)}%`
  }

  return (
    <div>
      <h1 style={titulo}>Financeiro por Obra</h1>

      {/* SELECT OBRA */}
      <select
        value={obraId}
        onChange={(e) => setObraId(e.target.value)}
        style={select}
      >
        <option value="">Selecione uma obra</option>
        {obras.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </select>

      {obraId && (
        <>
          {/* RESUMO */}
          <div style={grid}>
            <Card titulo="Receita" valor={formatar(receita)} cor="#22c55e" />
            <Card titulo="Custos" valor={formatar(custo)} cor="#ef4444" />
            <Card titulo="Lucro" valor={formatar(lucro)} cor="#3b82f6" />
            <Card titulo="Margem" valor={formatarPercent(margem)} cor="#a855f7" />
          </div>

          {/* KPIs */}
          <h2 style={subtitulo}>Indicadores da Obra</h2>

          <div style={grid}>
            <Card titulo="CPI" valor={cpi.toFixed(2)} cor="#0ea5e9" />
            <Card titulo="SPI" valor={spi.toFixed(2)} cor="#f59e0b" />
            <Card titulo="Custo/m²" valor={formatar(custoM2)} cor="#14b8a6" />
            <Card titulo="Acidentes" valor={acidentes} cor="#ef4444" />
          </div>

          {/* DADOS */}
          <h2 style={subtitulo}>Dados da Obra</h2>

          <div style={form}>
            <Input label="Área (m²)" value={area} setValue={setArea} />
            <Input label="Prazo Planejado" value={prazoPlanejado} setValue={setPrazoPlanejado} />
            <Input label="Prazo Real" value={prazoReal} setValue={setPrazoReal} />
            <Input label="% Planejado" value={progressoPlanejado} setValue={setProgressoPlanejado} />
            <Input label="% Real" value={progressoReal} setValue={setProgressoReal} />
            <Input label="Acidentes" value={acidentes} setValue={setAcidentes} />
          </div>
        </>
      )}
    </div>
  )
}

// COMPONENTES

function Card({ titulo, valor, cor }: any) {
  return (
    <div style={{ ...card, borderLeft: `6px solid ${cor}` }}>
      <p style={label}>{titulo}</p>
      <h2 style={valorStyle}>{valor}</h2>
    </div>
  )
}

function Input({ label, value, setValue }: any) {
  return (
    <div style={inputBox}>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={input}
      />
    </div>
  )
}

/* 🎨 ESTILO */

const titulo = { color: '#0f172a' }

const subtitulo = {
  marginTop: '30px',
  color: '#0f172a',
}

const select = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  marginTop: '10px',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '20px',
  marginTop: '20px',
}

const card = {
  background: '#fff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
}

const label = { color: '#64748b' }
const valorStyle = { color: '#0f172a' }

const form = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px',
  marginTop: '20px',
}

const inputBox = { display: 'flex', flexDirection: 'column' }
const labelStyle = { fontSize: '12px', color: '#64748b' }

const input = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
}
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Financeiro() {
  const [financeiro, setFinanceiro] = useState<any[]>([])

  const [area, setArea] = useState(0)
  const [valorM2, setValorM2] = useState(0)
  const [prazoPlanejado, setPrazoPlanejado] = useState(0)
  const [prazoReal, setPrazoReal] = useState(0)
  const [progressoPlanejado, setProgressoPlanejado] = useState(0)
  const [progressoReal, setProgressoReal] = useState(0)
  const [acidentes, setAcidentes] = useState(0)

  const [configId, setConfigId] = useState<string | null>(null)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const empresa_id = localStorage.getItem('empresa_id')

    // 🔥 financeiro
    const { data: financeiroData } = await supabase
      .from('financeiro')
      .select('*')
      .eq('empresa_id', empresa_id)

    setFinanceiro(financeiroData || [])

    // 🔥 config
    const { data } = await supabase
      .from('financeiro_config')
      .select('*')
      .eq('empresa_id', empresa_id)
      .single()

    if (data) {
      setConfigId(data.id)
      setArea(data.area || 0)
      setValorM2(data.valor_m2 || 0)
      setPrazoPlanejado(data.prazo_planejado || 0)
      setPrazoReal(data.prazo_real || 0)
      setProgressoPlanejado(data.progresso_planejado || 0)
      setProgressoReal(data.progresso_real || 0)
      setAcidentes(data.acidentes || 0)
    }
  }

  async function salvar() {
    const empresa_id = localStorage.getItem('empresa_id')

    const payload = {
      empresa_id,
      area,
      valor_m2: valorM2,
      prazo_planejado: prazoPlanejado,
      prazo_real: prazoReal,
      progresso_planejado: progressoPlanejado,
      progresso_real: progressoReal,
      acidentes,
    }

    if (configId) {
      await supabase
        .from('financeiro_config')
        .update(payload)
        .eq('id', configId)
    } else {
      const { data } = await supabase
        .from('financeiro_config')
        .insert([payload])
        .select()

      if (data) setConfigId(data[0].id)
    }

    alert('Salvo com sucesso!')
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
      <h1 style={{ color: '#0f172a' }}>Financeiro Profissional</h1>

      <div style={grid}>
        <Card titulo="Receita" valor={formatar(receita)} cor="#22c55e" />
        <Card titulo="Custos" valor={formatar(custo)} cor="#ef4444" />
        <Card titulo="Lucro" valor={formatar(lucro)} cor="#2563eb" />
        <Card titulo="Margem" valor={formatarPercent(margem)} cor="#9333ea" />
      </div>

      <h2 style={subtitulo}>Indicadores</h2>

      <div style={grid}>
        <Card titulo="CPI" valor={cpi.toFixed(2)} cor="#0ea5e9" />
        <Card titulo="SPI" valor={spi.toFixed(2)} cor="#f59e0b" />
        <Card titulo="Custo/m²" valor={formatar(custoM2)} cor="#14b8a6" />
        <Card titulo="Acidentes" valor={acidentes} cor="#ef4444" />
      </div>

      <h2 style={subtitulo}>Dados da Obra</h2>

      <div style={form}>
        <Input label="Área (m²)" value={area} setValue={setArea} />
        <Input label="Valor m²" value={valorM2} setValue={setValorM2} />
        <Input label="Prazo Planejado" value={prazoPlanejado} setValue={setPrazoPlanejado} />
        <Input label="Prazo Real" value={prazoReal} setValue={setPrazoReal} />
        <Input label="% Planejado" value={progressoPlanejado} setValue={setProgressoPlanejado} />
        <Input label="% Real" value={progressoReal} setValue={setProgressoReal} />
        <Input label="Acidentes" value={acidentes} setValue={setAcidentes} />
      </div>

      <button style={botaoSalvar} onClick={salvar}>
        Salvar Dados
      </button>
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

// ESTILO

const subtitulo = { marginTop: '30px', color: '#0f172a' }

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
const input = { padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }

const botaoSalvar = {
  marginTop: '20px',
  background: '#2563eb',
  color: '#fff',
  padding: '10px',
  border: 'none',
  borderRadius: '6px',
}
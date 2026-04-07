'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {

  const [empresas, setEmpresas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {

    const { data, error } = await supabase
      .from('empresas')
      .select('*')

    if (error) {
      alert('Erro ao carregar')
      return
    }

    setEmpresas(data || [])
    setLoading(false)
  }

  if (loading) return <p>Carregando...</p>

  /* ================= MÉTRICAS ================= */

  const totalClientes = empresas.length

  const ativos = empresas.filter(e => e.status === 'active')
  const cancelados = empresas.filter(e => e.status === 'canceled')
  const inadimplentes = empresas.filter(e => e.status === 'past_due')

  const PRECO_PLANOS: any = {
  basico: 49.9,
  pro: 99.9,
  premium: 159.9
}

  const MRR = ativos.reduce((total, e) => {
  return total + (PRECO_PLANOS[e.plano] || 0)
}, 0)

const MRRFormatado = MRR.toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

  const churn =
    totalClientes > 0
      ? (cancelados.length / totalClientes) * 100
      : 0

  /* ================= CONTAGEM POR PLANO ================= */

  const planos = {
    basico: empresas.filter(e => e.plano === 'basico').length,
    pro: empresas.filter(e => e.plano === 'pro').length,
    premium: empresas.filter(e => e.plano === 'premium').length,
  }

  return (
    <div style={{ padding: 24 }}>

      <h1>👑 Dashboard SaaS</h1>

      <div style={grid}>
        <Card titulo="Clientes" valor={totalClientes} />
        <Card titulo="Ativos" valor={ativos.length} />
        <Card titulo="Cancelados" valor={cancelados.length} />
        <Card titulo="Inadimplentes" valor={inadimplentes.length} />
        <Card titulo="MRR" valor={`R$ ${MRR}`} />
        <Card titulo="Churn" valor={`${churn.toFixed(2)}%`} />
        <Card titulo="MRR" valor={MRRFormatado} />
      </div>

      <h2 style={{ marginTop: 30 }}>📊 Distribuição de Planos</h2>

      <div style={grid}>
        <Card titulo="Básico" valor={planos.basico} />
        <Card titulo="Pro" valor={planos.pro} />
        <Card titulo="Premium" valor={planos.premium} />
      </div>

      <h2 style={{ marginTop: 30 }}>Empresas</h2>

      {empresas.map(e => (
        <div key={e.id} style={card}>
          <b>{e.nome}</b>
          <p>Plano: {e.plano}</p>
          <p>Status: {e.status}</p>
        </div>
      ))}

    </div>
  )
}

function Card({ titulo, valor }: any) {
  return (
    <div style={cardBox}>
      <p>{titulo}</p>
      <h2>{valor}</h2>
    </div>
  )
}

/* UI */

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
  gap: 16
}

const cardBox = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  border: '1px solid #ddd'
}

const card = {
  border: '1px solid #ddd',
  padding: 10,
  borderRadius: 8,
  marginTop: 10
}
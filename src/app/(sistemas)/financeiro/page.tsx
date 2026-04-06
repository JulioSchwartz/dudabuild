'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts'

export default function FinanceiroBI() {

  const { empresaId } = useEmpresa()

  const [dados, setDados] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {

    const { data: f } = await supabase
      .from('financeiro')
      .select('*')
      .eq('empresa_id', empresaId)

    const { data: o } = await supabase
      .from('obras')
      .select('*')
      .eq('empresa_id', empresaId)

    setDados(f || [])
    setObras(o || [])
    setLoading(false)
  }

  /* ================= KPIs ================= */

  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas = dados.filter(d => d.tipo === 'saida')

  const totalEntrada = soma(entradas)
  const totalSaida = soma(saidas)
  const lucro = totalEntrada - totalSaida

  const margem = totalEntrada
    ? ((lucro / totalEntrada) * 100).toFixed(1)
    : '0'

  /* ================= AGRUPAMENTO MENSAL ================= */

  const porMes: any = {}

  dados.forEach(d => {
    if (!d.created_at) return

    const data = new Date(d.created_at)
    const mes = data.toLocaleDateString('pt-BR', { month: 'short' })

    if (!porMes[mes]) {
      porMes[mes] = { mes, entrada: 0, saida: 0 }
    }

    if (d.tipo === 'entrada') porMes[mes].entrada += d.valor
    if (d.tipo === 'saida') porMes[mes].saida += d.valor
  })

  const graficoMensal = Object.values(porMes)

  /* ================= LUCRO POR OBRA ================= */

  function lucroPorObra(obraId: string) {
    const ent = dados.filter(d => d.obra_id === obraId && d.tipo === 'entrada')
    const sai = dados.filter(d => d.obra_id === obraId && d.tipo === 'saida')
    return soma(ent) - soma(sai)
  }

  const ranking = obras.map(o => ({
    nome: o.nome,
    lucro: lucroPorObra(o.id)
  })).sort((a, b) => b.lucro - a.lucro)

  if (loading) return <Loader />

  return (
    <div style={container}>

      <h1 style={titulo}>💰 Financeiro Geral</h1>

      {/* KPIs */}
      <div style={grid}>

        <Card titulo="Receita" valor={format(totalEntrada)} cor="#16a34a" />
        <Card titulo="Custos" valor={format(totalSaida)} cor="#dc2626" />
        <Card titulo="Lucro" valor={format(lucro)} cor="#2563eb" />
        <Card titulo="Margem" valor={`${margem}%`} cor="#7c3aed" />

      </div>

      {/* GRÁFICO LINHA */}
      <div style={card}>
        <h3>Evolução Financeira</h3>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={graficoMensal}>
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="entrada" stroke="#16a34a" />
            <Line dataKey="saida" stroke="#dc2626" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* GRÁFICO BARRAS */}
      <div style={card}>
        <h3>Fluxo de Caixa</h3>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={graficoMensal}>
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="entrada" fill="#16a34a" />
            <Bar dataKey="saida" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* RANKING */}
      <div style={card}>
        <h3>Lucro por Obra</h3>

        {ranking.map((r, i) => (
          <div key={i} style={linha}>
            <span>{r.nome}</span>

            <strong style={{
              color: r.lucro < 0 ? '#dc2626' : '#16a34a'
            }}>
              {format(r.lucro)}
            </strong>
          </div>
        ))}
      </div>

    </div>
  )
}

/* ================= HELPERS ================= */

function soma(lista: any[]) {
  return lista.reduce((acc, i) => acc + Number(i.valor), 0)
}

function format(valor: number) {
  return valor?.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

/* ================= COMPONENTES ================= */

function Loader() {
  return <p style={{ padding: 24 }}>Carregando...</p>
}

function Card({ titulo, valor, cor }: any) {
  return (
    <div style={{ ...cardBox, borderLeft: `6px solid ${cor}` }}>
      <h4>{titulo}</h4>
      <h2>{valor}</h2>
    </div>
  )
}

/* ================= ESTILO ================= */

const container = {
  padding: 24,
  background: '#f1f5f9',
  minHeight: '100vh'
}

const titulo = {
  fontSize: 28,
  fontWeight: 700,
  marginBottom: 20
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 20,
  marginBottom: 20
}

const cardBox = {
  background: '#fff',
  padding: 20,
  borderRadius: 12
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  marginTop: 20
}

const linha = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 10
}}
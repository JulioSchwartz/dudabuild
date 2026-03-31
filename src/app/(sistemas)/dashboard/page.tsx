'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

export default function Dashboard() {

  const [dados, setDados] = useState<any[]>([])
  const [financeiro, setFinanceiro] = useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const empresa_id = localStorage.getItem('empresa_id')

    const { data: obras } = await supabase
      .from('obras')
      .select('*')
      .eq('empresa_id', empresa_id)

    const { data: fin } = await supabase
      .from('financeiro')
      .select('*')
      .eq('empresa_id', empresa_id)

    setDados(obras || [])
    setFinanceiro(fin || [])
  }

  const entradas = financeiro.filter(f => f.tipo === 'entrada')
  const saidas = financeiro.filter(f => f.tipo === 'saida')

  const totalEntradas = entradas.reduce((a, b) => a + Number(b.valor), 0)
  const totalSaidas = saidas.reduce((a, b) => a + Number(b.valor), 0)

  const lucro = totalEntradas - totalSaidas
  const margem = totalEntradas > 0 ? (lucro / totalEntradas) * 100 : 0

  const graficoObras = dados.map(o => ({
    nome: o.nome,
    valor: financeiro
      .filter(f => f.obra_id === o.id)
      .reduce((acc, f) => acc + Number(f.valor), 0)
  }))

  const graficoFinanceiro = [
    { name: 'Receitas', value: totalEntradas },
    { name: 'Custos', value: totalSaidas }
  ]

  return (
    <div>

      <h1 style={titulo}>📊 Dashboard Executivo</h1>

      {/* KPIs */}
      <div style={grid}>
        <Card titulo="Receita" valor={totalEntradas} cor="#22c55e" />
        <Card titulo="Custos" valor={totalSaidas} cor="#ef4444" />
        <Card titulo="Lucro" valor={lucro} cor="#3b82f6" />
        <Card titulo="Margem" valor={margem} cor="#a855f7" tipo="percent" />
      </div>

      {/* GRÁFICOS */}
      <div style={grid2}>

        <div style={box}>
          <h3>💰 Financeiro</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={graficoFinanceiro} dataKey="value">
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={box}>
          <h3>🏗️ Obras</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={graficoObras}>
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="valor" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  )
}

function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{ ...card, borderLeft: `5px solid ${cor}` }}>
      <p>{titulo}</p>
      <h2>
        {tipo === 'percent'
          ? `${valor.toFixed(2)}%`
          : Number(valor).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })}
      </h2>
    </div>
  )
}

/* 🎨 ESTILO PREMIUM */

const titulo = {
  fontSize: 26,
  marginBottom: 20
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,1fr)',
  gap: 20,
  marginBottom: 30
}

const grid2 = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
}

const box = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
}
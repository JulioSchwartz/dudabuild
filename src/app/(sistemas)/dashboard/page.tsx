'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

export default function Dashboard() {

  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data: o } = await supabase.from('orcamentos').select('*')
    const { data: ob } = await supabase.from('obras').select('*')

    setOrcamentos(o || [])
    setObras(ob || [])
  }

  // 📊 ORÇAMENTOS
  const aprovados = orcamentos.filter(o => o.status === 'aprovado')
  const recusados = orcamentos.filter(o => o.status === 'recusado')

  const totalOrcado = orcamentos.reduce((acc, o) => acc + (o.valor_total || 0), 0)

  // 🏗️ OBRAS
  const obrasAndamento = obras.filter(o => o.status === 'andamento')
  const obrasFinalizadas = obras.filter(o => o.status === 'finalizada')

  const totalObras = obras.reduce((acc, o) => acc + (o.valor_total || 0), 0)

  // 📊 FUNIL
  const funil = [
    { name: 'Orçados', value: orcamentos.length },
    { name: 'Aprovados', value: aprovados.length },
    { name: 'Em Obra', value: obrasAndamento.length },
    { name: 'Finalizados', value: obrasFinalizadas.length }
  ]

  return (
    <div style={container}>

      <h1>📊 Dashboard Geral</h1>

      {/* KPIs */}
      <div style={grid}>

        <Card titulo="💰 Total Orçado" valor={format(totalOrcado)} />
        <Card titulo="🏗️ Em Obras" valor={obrasAndamento.length} />
        <Card titulo="💵 Faturado" valor={format(totalObras)} />
        <Card titulo="✅ Aprovados" valor={aprovados.length} />

      </div>

      {/* GRÁFICOS */}
      <div style={grid2}>

        {/* FUNIL */}
        <div style={card}>
          <h3>Funil</h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={funil}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* STATUS OBRAS */}
        <div style={card}>
          <h3>Status das Obras</h3>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Andamento', value: obrasAndamento.length },
                  { name: 'Finalizadas', value: obrasFinalizadas.length }
                ]}
                dataKey="value"
                outerRadius={80}
              >
                <Cell fill="#f59e0b" />
                <Cell fill="#16a34a" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  )
}

/* COMPONENTES */

function Card({ titulo, valor }: any) {
  return (
    <div style={card}>
      <h4>{titulo}</h4>
      <h2>{valor}</h2>
    </div>
  )
}

/* ESTILO */

const container = {
  padding: 24,
  background: '#f1f5f9',
  minHeight: '100vh'
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 20,
  marginBottom: 20
}

const grid2 = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 10
}

function format(valor: number) {
  return valor?.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}
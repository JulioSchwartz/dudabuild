'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {

  const [dados, setDados] = useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data } = await supabase.from('orcamentos').select('*')
    setDados(data || [])
  }

  const total = dados.reduce((acc, o) => acc + o.valor_total, 0)

  const aprovados = dados.filter(o => o.status === 'aprovado')
  const recusados = dados.filter(o => o.status === 'recusado')

  const taxa = dados.length
    ? ((aprovados.length / dados.length) * 100).toFixed(1)
    : 0

  return (
    <div style={{ padding: 24 }}>

      <h1>Dashboard</h1>

      <div style={grid}>

        <Card titulo="Total Orçado" valor={`R$ ${total.toFixed(2)}`} />
        <Card titulo="Aprovados" valor={aprovados.length} />
        <Card titulo="Recusados" valor={recusados.length} />
        <Card titulo="Conversão" valor={`${taxa}%`} />

      </div>

    </div>
  )
}

function Card({ titulo, valor }: any) {
  return (
    <div style={card}>
      <h3>{titulo}</h3>
      <h2>{valor}</h2>
    </div>
  )
}

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr',
  gap: 20
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 10
}
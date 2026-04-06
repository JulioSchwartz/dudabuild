'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

export default function Dashboard() {

  const { empresaId, loading } = useEmpresa()

  const [financeiro, setFinanceiro] = useState<any[]>([])

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {
    const { data } = await supabase
      .from('financeiro')
      .select('*')
      .eq('empresa_id', empresaId)

    setFinanceiro(data || [])
  }

  if (loading) return <p>Carregando...</p>

  const entradas = financeiro.filter(f => f.tipo === 'entrada')
  const saidas = financeiro.filter(f => f.tipo === 'saida')

  const totalEntrada = entradas.reduce((a,b)=>a+b.valor,0)
  const totalSaida = saidas.reduce((a,b)=>a+b.valor,0)
  const lucro = totalEntrada - totalSaida

  const fluxo: any = {}

  financeiro.forEach(f => {
    if (!f.created_at) return

    const mes = new Date(f.created_at).toLocaleDateString('pt-BR',{month:'short'})

    if(!fluxo[mes]) fluxo[mes] = {mes, entrada:0, saida:0}

    if(f.tipo==='entrada') fluxo[mes].entrada += f.valor
    else fluxo[mes].saida += f.valor
  })

  const grafico = Object.values(fluxo)

  return (
    <div style={{ padding: 24 }}>

      <h1>Dashboard</h1>

      <div style={{ display: 'flex', gap: 20 }}>
        <Card titulo="Receita" valor={totalEntrada} />
        <Card titulo="Custos" valor={totalSaida} />
        <Card titulo="Lucro" valor={lucro} />
      </div>

      <div style={{ marginTop: 30 }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={grafico}>
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="entrada" stroke="#16a34a" />
            <Line dataKey="saida" stroke="#dc2626" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

function Card({ titulo, valor }: any) {
  return (
    <div style={{ background:'#fff', padding:20 }}>
      <p>{titulo}</p>
      <strong>{format(valor)}</strong>
    </div>
  )
}

function format(v:number){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}
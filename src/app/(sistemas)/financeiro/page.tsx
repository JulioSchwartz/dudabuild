'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

export default function Financeiro() {

  const { empresaId } = useEmpresa()

  const [dados, setDados] = useState<any[]>([])

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {
    const { data } = await supabase
      .from('financeiro')
      .select('*')
      .eq('empresa_id', empresaId)

    setDados(data || [])
  }

  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas = dados.filter(d => d.tipo === 'saida')

  const totalEntrada = soma(entradas)
  const totalSaida = soma(saidas)
  const lucro = totalEntrada - totalSaida

  const porMes: any = {}

  dados.forEach(d => {
    if (!d.created_at) return

    const mes = new Date(d.created_at).toLocaleDateString('pt-BR',{month:'short'})

    if (!porMes[mes]) porMes[mes] = { mes, entrada:0, saida:0 }

    if (d.tipo === 'entrada') porMes[mes].entrada += d.valor
    else porMes[mes].saida += d.valor
  })

  const grafico = Object.values(porMes)

  return (
    <div style={{ padding: 24 }}>

      <h1>Financeiro</h1>

      <div style={{ display:'flex', gap:20 }}>
        <Card titulo="Receita" valor={totalEntrada} />
        <Card titulo="Custos" valor={totalSaida} />
        <Card titulo="Lucro" valor={lucro} />
      </div>

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
  )
}

function soma(lista:any[]){
  return lista.reduce((acc,i)=>acc+Number(i.valor),0)
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
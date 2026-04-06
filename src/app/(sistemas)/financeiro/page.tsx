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

  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas = dados.filter(d => d.tipo === 'saida')

  const totalEntrada = soma(entradas)
  const totalSaida = soma(saidas)
  const lucro = totalEntrada - totalSaida

  const margem = totalEntrada
    ? ((lucro / totalEntrada) * 100).toFixed(1)
    : '0'

  const porMes: any = {}

  dados.forEach(d => {
    if (!d.created_at) return

    const mes = new Date(d.created_at).toLocaleDateString('pt-BR', { month: 'short' })

    if (!porMes[mes]) {
      porMes[mes] = { mes, entrada: 0, saida: 0 }
    }

    if (d.tipo === 'entrada') porMes[mes].entrada += d.valor
    if (d.tipo === 'saida') porMes[mes].saida += d.valor
  })

  const graficoMensal = Object.values(porMes)

  if (loading) return <p>Carregando...</p>

  return (
  )
}

/* HELPERS */

function soma(lista: any[]) {
  return lista.reduce((acc, i) => acc + Number(i.valor), 0)
}

function format(valor: number) {
  return valor?.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

/* COMPONENTES */

function Card({ titulo, valor, cor }: any) {
  return (
    <div style={{ ...cardBox, borderLeft: `6px solid ${cor}` }}>
      <h4>{titulo}</h4>
      <h2>{valor}</h2>
    </div>
  )
}

/* ESTILO */

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
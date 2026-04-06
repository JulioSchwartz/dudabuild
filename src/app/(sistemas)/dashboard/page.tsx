'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

export default function Dashboard() {

  const { empresaId } = useEmpresa()

  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {

    const { data, error } = await supabase
      .from('financeiro')
      .select('*')
      .eq('empresa_id', empresaId)

    if (error) {
      console.error(error)
      alert('Erro ao carregar dashboard')
      return
    }

    setDados(data || [])
    setLoading(false)
  }

  if (loading) return <p style={{ padding: 24 }}>Carregando...</p>

  const entradas = dados.filter(d=>d.tipo==='entrada')
  const saidas = dados.filter(d=>d.tipo==='saida')

  const receita = soma(entradas)
  const custo = soma(saidas)
  const lucro = receita - custo

  const margem = receita > 0 ? (lucro / receita) * 100 : 0
  const ticketMedio = entradas.length > 0 ? receita / entradas.length : 0

  const fluxo: any = {}

  dados.forEach(d => {
    if (!d.created_at) return

    const mes = new Date(d.created_at)
      .toLocaleDateString('pt-BR',{month:'short'})

    if (!fluxo[mes]) fluxo[mes] = { mes, entrada:0, saida:0 }

    if (d.tipo === 'entrada') fluxo[mes].entrada += d.valor
    else fluxo[mes].saida += d.valor
  })

  const grafico = Object.values(fluxo)

  return (
    <div>

      {/* 🔥 NAVBAR */}
      <div style={navbar}>
        <h2>DudaBuild</h2>

        <div style={menu}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/obras">Obras</Link>
          <Link href="/financeiro">Financeiro</Link>
          <Link href="/orcamentos">Orçamentos</Link>
          <Link href="/relatorios">Relatórios</Link>
        </div>
      </div>

      <div style={{ padding:24 }}>

        <h1 style={titulo}>🚀 Dashboard Executivo</h1>

        {lucro < 0 && (
          <div style={alertaErro}>
            ⚠️ Sua operação está no prejuízo
          </div>
        )}

        {margem < 10 && margem > 0 && (
          <div style={alertaAviso}>
            ⚠️ Margem baixa ({margem.toFixed(1)}%)
          </div>
        )}

        <div style={grid}>
          <Card titulo="Receita" valor={receita} cor="#16a34a"/>
          <Card titulo="Custos" valor={custo} cor="#dc2626"/>
          <Card titulo="Lucro" valor={lucro} cor="#2563eb"/>
          <Card titulo="Margem" valor={margem} cor="#a855f7" tipo="porcentagem"/>
          <Card titulo="Ticket Médio" valor={ticketMedio} cor="#0ea5e9"/>
          <Card titulo="Movimentações" valor={dados.length} cor="#f59e0b" tipo="numero"/>
        </div>

        <div style={graficoBox}>
          <h3>📊 Fluxo Financeiro</h3>

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

    </div>
  )
}

/* HELPERS */

function soma(lista:any[]){
  return lista.reduce((a,b)=>a+Number(b.valor),0)
}

function format(v:number){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}

/* COMPONENTES */

function Card({ titulo, valor, cor, tipo }: any){
  return(
    <div style={{
      background: cor + '15',
      padding:20,
      borderRadius:12,
      border:`1px solid ${cor}`,
      boxShadow:'0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <p style={{ color:'#64748b' }}>{titulo}</p>

      <h2 style={{ color: cor }}>
        {tipo === 'porcentagem'
          ? valor.toFixed(2) + '%'
          : tipo === 'numero'
          ? valor
          : format(valor)}
      </h2>
    </div>
  )
}

/* ESTILO */

const navbar = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'center',
  padding:'12px 24px',
  background:'#fff',
  borderBottom:'1px solid #e2e8f0'
}

const menu = {
  display:'flex',
  gap:16
}

const titulo = {
  fontSize: 26,
  fontWeight: 700,
  marginBottom: 20
}

const grid = {
  display:'grid',
  gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',
  gap:16,
  marginBottom:30
}

const graficoBox = {
  background:'#fff',
  padding:20,
  borderRadius:12,
  boxShadow:'0 4px 12px rgba(0,0,0,0.05)'
}

const alertaErro = {
  background:'#fee2e2',
  padding:12,
  borderRadius:8,
  marginBottom:10,
  color:'#991b1b'
}

const alertaAviso = {
  background:'#fef3c7',
  padding:12,
  borderRadius:8,
  marginBottom:10,
  color:'#92400e'
}
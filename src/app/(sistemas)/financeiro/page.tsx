'use client'


import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

export default function Financeiro() {

  const { empresaId, bloqueado, loading } = useEmpresa()
  const router = useRouter()
  const [dados, setDados] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

useEffect(() => {
  if (!loading && bloqueado) {
    router.push('/bloqueado')
  }
}, [loading, bloqueado])  

useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {

    try {

      const { data, error } = await supabase
        .from('financeiro')
        .select('*')
        .eq('empresa_id', empresaId)

      if (error) throw error

      setDados(data || [])

    } catch (err) {
      console.error('Erro financeiro:', err)
      alert('Erro ao carregar financeiro')
    } finally {
      setLoadingData(false) // 🔥 NUNCA MAIS TRAVA
    }
  }

  if (loading || loadingData) {
    return <p style={{ padding: 24 }}>Carregando financeiro...</p>
  }

  /* ================= DADOS ================= */

  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas = dados.filter(d => d.tipo === 'saida')

  const receita = soma(entradas)
  const custo = soma(saidas)
  const lucro = receita - custo

  const margem = receita > 0 ? (lucro / receita) * 100 : 0

  /* ================= GRÁFICO ================= */

  const porMes: any = {}

  dados.forEach(d => {

    if (!d.created_at) return

    const valor = Number(d.valor || 0) // 🔥 CORREÇÃO

    const mes = new Date(d.created_at)
      .toLocaleDateString('pt-BR',{month:'short'})

    if (!porMes[mes]) porMes[mes] = { mes, entrada:0, saida:0 }

    if (d.tipo === 'entrada') porMes[mes].entrada += valor
    else porMes[mes].saida += valor
  })

  const grafico = Object.values(porMes)

  return (
    <div style={{ padding: 24 }}>

      <h1 style={titulo}>💰 Financeiro</h1>

      {lucro < 0 && (
        <div style={alertaErro}>
          ⚠️ Prejuízo no período
        </div>
      )}

      <div style={grid}>
        <Card titulo="Receita" valor={receita} cor="#16a34a"/>
        <Card titulo="Custos" valor={custo} cor="#dc2626"/>
        <Card titulo="Lucro" valor={lucro} cor="#2563eb"/>
        <Card titulo="Margem" valor={margem} cor="#a855f7" tipo="porcentagem"/>
      </div>

      <div style={graficoBox}>
        <h3>📊 Evolução Financeira</h3>

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

/* ================= HELPERS ================= */

function soma(lista:any[]){
  return lista.reduce((acc,i)=>acc+Number(i.valor || 0),0)
}

function format(v:number){
  return Number(v || 0).toLocaleString('pt-BR',{
    style:'currency',
    currency:'BRL'
  })
}

/* ================= COMPONENTES ================= */

function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{
      background: cor + '15',
      padding:20,
      borderRadius:12,
      border:`1px solid ${cor}`,
      boxShadow:'0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <p style={{ color:'#64748b' }}>{titulo}</p>

      <h2 style={{
        color: cor,
        fontSize: 22,
        fontWeight: 700
      }}>
        {tipo === 'porcentagem'
          ? Number(valor).toFixed(2) + '%'
          : format(valor)}
      </h2>
    </div>
  )
}

/* ================= ESTILO ================= */

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
  color:'#991b1b',
  fontWeight:600
}
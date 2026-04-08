'use client'
 
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
 
export default function Dashboard() {
 
  const { empresaId, bloqueado, loading } = useEmpresa()
  const router = useRouter()
 
  const [dados, setDados] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
 
  // 🔒 BLOQUEIO
  useEffect(() => {
    if (!loading && bloqueado) {
      router.push('/bloqueado')
    }
  }, [loading, bloqueado, router])
 
  // 📊 CARREGAR DADOS
  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])
 
  async function carregar() {
    try {
      const [{ data: finData, error: errFin }, { data: obrasData, error: errObras }] =
        await Promise.all([
          supabase.from('financeiro').select('*').eq('empresa_id', empresaId),
          supabase.from('obras').select('id, nome').eq('empresa_id', empresaId),
        ])
 
      if (errFin) throw errFin
      if (errObras) throw errObras
 
      setDados(finData || [])
      setObras(obrasData || [])
 
    } catch (err) {
      console.error('Erro dashboard:', err)
      alert('Erro ao carregar dashboard')
    } finally {
      setLoadingData(false)
    }
  }
 
  if (loading || loadingData) {
    return <p style={{ padding: 24 }}>Carregando...</p>
  }
 
  /* ================= BASE ================= */
 
  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas   = dados.filter(d => d.tipo === 'saida')
 
  const receita     = soma(entradas)
  const custo       = soma(saidas)
  const lucro       = receita - custo
  const margem      = receita > 0 ? (lucro / receita) * 100 : 0
  const ticketMedio = entradas.length > 0 ? receita / entradas.length : 0
 
  /* ================= MAPA DE NOMES ================= */
 
  const nomeObra: Record<string, string> = {}
  obras.forEach(o => { nomeObra[o.id] = o.nome })
 
  /* ================= POR OBRA ================= */
 
  const porObra: Record<string, { receita: number; custo: number; lucro: number }> = {}
 
  dados.forEach(d => {
    const valor = Number(d.valor || 0)
    if (!porObra[d.obra_id]) porObra[d.obra_id] = { receita: 0, custo: 0, lucro: 0 }
    if (d.tipo === 'entrada') porObra[d.obra_id].receita += valor
    else                      porObra[d.obra_id].custo   += valor
    porObra[d.obra_id].lucro = porObra[d.obra_id].receita - porObra[d.obra_id].custo
  })
 
  const listaObras = Object.entries(porObra).sort((a: any, b: any) => b[1].lucro - a[1].lucro)
 
  /* ================= GRÁFICO ================= */
 
  const fluxo: Record<string, { mes: string; entrada: number; saida: number }> = {}
 
  dados.forEach(d => {
    if (!d.created_at) return
    const valor = Number(d.valor || 0)
    const mes = new Date(d.created_at).toLocaleDateString('pt-BR', { month: 'short' })
    if (!fluxo[mes]) fluxo[mes] = { mes, entrada: 0, saida: 0 }
    if (d.tipo === 'entrada') fluxo[mes].entrada += valor
    else                      fluxo[mes].saida   += valor
  })
 
  const grafico = Object.values(fluxo)
 
  return (
    <div>
 
      <div style={navbar}>
        <h2>DudaBuild</h2>
 
        <button onClick={() => router.push('/planos')}>
          Upgrade 🚀
        </button>
 
        <div style={menuStyle}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/obras">Obras</Link>
          <Link href="/financeiro">Financeiro</Link>
          <Link href="/orcamentos">Orçamentos</Link>
          <Link href="/relatorios">Relatórios</Link>
        </div>
      </div>
 
      <div style={{ padding: 24 }}>
 
        <h1 style={titulo}>🚀 Dashboard Executivo</h1>
 
        {lucro < 0 && (
          <div style={alertaErro}>⚠️ Sua operação está no prejuízo</div>
        )}
 
        {margem < 10 && margem > 0 && (
          <div style={alertaAviso}>⚠️ Margem baixa ({margem.toFixed(1)}%)</div>
        )}
 
        <div style={grid}>
          <Card titulo="Receita"       valor={receita}     cor="#16a34a" />
          <Card titulo="Custos"        valor={custo}       cor="#dc2626" />
          <Card titulo="Lucro"         valor={lucro}       cor="#2563eb" />
          <Card titulo="Margem"        valor={margem}      cor="#a855f7" tipo="porcentagem" />
          <Card titulo="Ticket Médio"  valor={ticketMedio} cor="#0ea5e9" />
          <Card titulo="Movimentações" valor={dados.length} cor="#f59e0b" tipo="numero" />
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
              <Line dataKey="saida"   stroke="#dc2626" />
            </LineChart>
          </ResponsiveContainer>
        </div>
 
        <div style={{ marginTop: 30 }}>
          <h3>🏗️ Resultado por Obra (ranking lucro)</h3>
 
          <div style={linhaHeader}>
            <span><strong>Obra</strong></span>
            <span><strong>Receita</strong></span>
            <span><strong>Custo</strong></span>
            <span><strong>Lucro</strong></span>
          </div>
 
          {listaObras.map(([id, d]: any) => (
            <div key={id} style={linha}>
              <span>{nomeObra[id] || `Obra ${id}`}</span>
              <span>{format(d.receita)}</span>
              <span>{format(d.custo)}</span>
              <span style={{ color: d.lucro >= 0 ? '#16a34a' : '#dc2626' }}>
                {format(d.lucro)}
              </span>
            </div>
          ))}
        </div>
 
      </div>
    </div>
  )
}
 
/* ================= HELPERS ================= */
 
function soma(lista: any[]) {
  return lista.reduce((a, b) => a + Number(b.valor || 0), 0)
}
 
function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
 
/* ================= COMPONENTES ================= */
 
function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{
      background: cor + '15',
      padding: 20,
      borderRadius: 12,
      border: `1px solid ${cor}`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <p style={{ color: '#64748b' }}>{titulo}</p>
      <h2 style={{ color: cor }}>
        {tipo === 'porcentagem'
          ? Number(valor).toFixed(2) + '%'
          : tipo === 'numero'
            ? valor
            : format(valor)}
      </h2>
    </div>
  )
}
 
/* ================= ESTILOS ================= */
 
const navbar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 24px',
  background: '#fff',
  borderBottom: '1px solid #e2e8f0'
}
 
const menuStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16
}
 
const titulo: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  marginBottom: 20
}
 
const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
  gap: 16,
  marginBottom: 30
}
 
const graficoBox: React.CSSProperties = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
}
 
const linhaHeader: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr',
  padding: '8px 10px',
  background: '#f8fafc',
  borderRadius: 8,
  marginBottom: 4
}
 
const linha: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr',
  padding: 10,
  borderBottom: '1px solid #e2e8f0'
}
 
const alertaErro: React.CSSProperties = {
  background: '#fee2e2',
  padding: 12,
  borderRadius: 8,
  marginBottom: 10,
  color: '#991b1b'
}
 
const alertaAviso: React.CSSProperties = {
  background: '#fef3c7',
  padding: 12,
  borderRadius: 8,
  marginBottom: 10,
  color: '#92400e'
}
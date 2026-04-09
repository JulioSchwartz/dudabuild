'use client'
 
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
 
export default function DetalheObra() {
 
  const { empresaId, loading: loadingEmpresa } = useEmpresa()
  const { id } = useParams()
  const router = useRouter()
 
  const [obra, setObra]           = useState<any>(null)
  const [financeiro, setFinanceiro] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
 
  useEffect(() => {
    // Aguarda useEmpresa terminar e empresaId estar disponível
    if (loadingEmpresa) return
    if (!empresaId) {
      router.push('/login')
      return
    }
    if (!id) return
    carregar()
  }, [id, empresaId, loadingEmpresa])
 
  async function carregar() {
    try {
      const [{ data: obraData }, { data: financeiroData }] = await Promise.all([
        supabase.from('obras').select('*').eq('id', Number(id)).eq('empresa_id', empresaId).maybeSingle(),
        supabase.from('financeiro').select('*').eq('obra_id', Number(id)).eq('empresa_id', empresaId).order('created_at', { ascending: true }),
      ])
      setObra(obraData)
      setFinanceiro(financeiroData || [])
    } catch (err) {
      console.error('Erro ao carregar obra:', err)
    } finally {
      setLoadingData(false)
    }
  }
 
  if (loadingEmpresa || loadingData) return <p style={{ padding: 24 }}>Carregando...</p>
  if (!obra) return <p style={{ padding: 24 }}>Obra não encontrada.</p>
 
  const entradas = financeiro.filter(f => f.tipo === 'entrada')
  const saidas   = financeiro.filter(f => f.tipo === 'saida')
 
  const totalEntradas = entradas.reduce((acc, e) => acc + Number(e.valor), 0)
  const totalSaidas   = saidas.reduce((acc, s) => acc + Number(s.valor), 0)
  const lucro         = totalEntradas - totalSaidas
  const margem        = totalEntradas > 0 ? (lucro / totalEntradas) * 100 : 0
  const roi           = totalSaidas > 0 ? (lucro / totalSaidas) * 100 : 0
  const custoPorMetro = obra?.area ? totalSaidas / obra.area : 0
  const valorTotal    = obra?.valor || 0
  const restanteReceber = valorTotal - totalEntradas
  const lucroPrevisto   = valorTotal - totalSaidas
 
  const fluxoMensal: Record<string, { mes: string; entrada: number; saida: number }> = {}
  financeiro.forEach(item => {
    const mes = new Date(item.created_at).toLocaleDateString('pt-BR', { month: 'short' })
    if (!fluxoMensal[mes]) fluxoMensal[mes] = { mes, entrada: 0, saida: 0 }
    if (item.tipo === 'entrada') fluxoMensal[mes].entrada += Number(item.valor)
    else                         fluxoMensal[mes].saida   += Number(item.valor)
  })
  const dadosGrafico = Object.values(fluxoMensal)
 
  const resumoCategoria: Record<string, number> = {}
  saidas.forEach(s => {
    if (!resumoCategoria[s.descricao]) resumoCategoria[s.descricao] = 0
    resumoCategoria[s.descricao] += Number(s.valor)
  })
  const rankingCategorias = Object.entries(resumoCategoria)
    .map(([k, v]) => ({ nome: k, valor: v, percentual: totalSaidas > 0 ? (v / totalSaidas) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor)
 
  return (
    <div style={{ padding: 24 }}>
 
      {lucro < 0 && (
        <div style={alerta}>🚨 Obra em prejuízo — revise custos imediatamente</div>
      )}
 
      <button onClick={() => router.back()} style={btnVoltar}>⬅ Voltar</button>
 
      <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 8 }}>{obra.nome}</h1>
      <p style={{ color: '#64748b' }}>{obra.cliente}</p>
      <p style={valorPrincipal}>💰 {format(obra.valor || 0)}</p>
 
      <div style={grid}>
        <Card titulo="Receita"       valor={totalEntradas}    cor="#22c55e" />
        <Card titulo="Custos"        valor={totalSaidas}      cor="#ef4444" />
        <Card titulo="Lucro"         valor={lucro}            cor="#3b82f6" />
        <Card titulo="Margem"        valor={margem}           cor="#a855f7" tipo="porcentagem" />
        <Card titulo="ROI"           valor={roi}              cor="#0ea5e9" tipo="porcentagem" />
        <Card titulo="Custo/m²"      valor={custoPorMetro}    cor="#f59e0b" />
        <Card titulo="A Receber"     valor={restanteReceber}  cor="#f59e0b" />
        <Card titulo="Lucro Previsto" valor={lucroPrevisto}   cor="#10b981" />
      </div>
 
      <div style={graficoBox}>
        <h3>📈 Fluxo Financeiro da Obra</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dadosGrafico}>
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="entrada" stroke="#22c55e" />
            <Line type="monotone" dataKey="saida"   stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </div>
 
      {rankingCategorias.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>💸 Maiores custos</h3>
          {rankingCategorias.map((c, i) => (
            <div key={c.nome} style={{ padding: 10, borderBottom: '1px solid #e2e8f0', fontWeight: i === 0 ? 'bold' : 'normal' }}>
              #{i + 1} — {c.nome} → {format(c.valor)} ({c.percentual.toFixed(1)}%)
            </div>
          ))}
        </div>
      )}
 
    </div>
  )
}
 
function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{ background: cor + '15', padding: 18, borderRadius: 12, border: `1px solid ${cor}` }}>
      <p style={{ color: '#64748b' }}>{titulo}</p>
      <h2 style={{ color: cor }}>
        {tipo === 'porcentagem' ? Number(valor).toFixed(2) + '%' : format(valor)}
      </h2>
    </div>
  )
}
 
const alerta: React.CSSProperties       = { background: '#fee2e2', padding: 16, borderRadius: 10, marginBottom: 15, color: '#991b1b', fontWeight: 700 }
const btnVoltar: React.CSSProperties    = { background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 14, padding: 0 }
const valorPrincipal: React.CSSProperties = { fontSize: 18, fontWeight: 600, color: '#16a34a', marginBottom: 20 }
const grid: React.CSSProperties         = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }
const graficoBox: React.CSSProperties   = { background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
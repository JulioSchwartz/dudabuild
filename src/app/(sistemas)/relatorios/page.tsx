'use client'
 
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
 
export default function Relatorios() {
 
  const { empresaId, bloqueado, loading: loadingEmpresa } = useEmpresa()
  const router = useRouter()
 
  const [dados, setDados]   = useState<any[]>([])
  const [inicio, setInicio] = useState('')
  const [fim, setFim]       = useState('')
  const [loading, setLoading] = useState(true)
 
  // 🔒 BLOQUEIO
  useEffect(() => {
    if (!loadingEmpresa && bloqueado) {
      router.push('/bloqueado')
    }
  }, [loadingEmpresa, bloqueado, router])
 
  // useCallback evita recriar a função a cada render
  const carregar = useCallback(async () => {
    if (!empresaId) return
 
    setLoading(true)
 
    try {
      let query = supabase
        .from('financeiro')
        .select('*')
        .eq('empresa_id', empresaId)
 
      if (inicio) query = query.gte('created_at', inicio)
      // FIM com hora 23:59:59 para incluir registros do dia inteiro
      if (fim)    query = query.lte('created_at', `${fim}T23:59:59`)
 
      const { data, error } = await query
 
      if (error) throw error
 
      setDados(data || [])
 
    } catch (err) {
      console.error(err)
      alert('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }, [empresaId, inicio, fim])
 
  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId]) // carga inicial sem filtros
 
  /* ================= DADOS ================= */
 
  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas   = dados.filter(d => d.tipo === 'saida')
 
  const receita = soma(entradas)
  const custo   = soma(saidas)
  const lucro   = receita - custo
  const margem  = receita > 0 ? (lucro / receita) * 100 : 0
 
  /* ================= GRÁFICO ================= */
 
  const porMes: Record<string, { mes: string; entrada: number; saida: number }> = {}
 
  dados.forEach(d => {
    if (!d.created_at) return
    const valor = Number(d.valor || 0) // sempre converter para número
    const mes = new Date(d.created_at).toLocaleDateString('pt-BR', { month: 'short' })
    if (!porMes[mes]) porMes[mes] = { mes, entrada: 0, saida: 0 }
    if (d.tipo === 'entrada') porMes[mes].entrada += valor
    else                      porMes[mes].saida   += valor
  })
 
  const grafico = Object.values(porMes)
 
  if (loadingEmpresa || loading) return <p style={{ padding: 24 }}>Carregando...</p>
 
  return (
    <div>
 
      {/* NAVBAR */}
      <div style={navbar}>
        <h2>DudaBuild</h2>
        <div style={menuStyle}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/obras">Obras</Link>
          <Link href="/financeiro">Financeiro</Link>
          <Link href="/orcamentos">Orçamentos</Link>
          <Link href="/relatorios">Relatórios</Link>
        </div>
      </div>
 
      <div style={{ padding: 24 }}>
 
        <h1 style={titulo}>📊 Relatórios</h1>
 
        {/* FILTRO */}
        <div style={filtro}>
          <div>
            <label style={labelStyle}>De</label>
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} style={inputDate} />
          </div>
          <div>
            <label style={labelStyle}>Até</label>
            <input type="date" value={fim} onChange={e => setFim(e.target.value)} style={inputDate} />
          </div>
          <button onClick={carregar} style={btnFiltrar}>
            Filtrar
          </button>
          {(inicio || fim) && (
            <button
              onClick={() => { setInicio(''); setFim('') }}
              style={btnLimpar}
            >
              Limpar
            </button>
          )}
        </div>
 
        {/* ALERTAS */}
        {lucro < 0 && (
          <div style={alertaErro}>⚠️ Prejuízo no período selecionado</div>
        )}
 
        {dados.length === 0 && (
          <p style={{ color: '#64748b', marginBottom: 16 }}>Nenhum lançamento no período.</p>
        )}
 
        {/* CARDS */}
        <div style={grid}>
          <Card titulo="Receita" valor={receita} cor="#16a34a" />
          <Card titulo="Custos"  valor={custo}   cor="#dc2626" />
          <Card titulo="Lucro"   valor={lucro}   cor="#2563eb" />
          <Card titulo="Margem"  valor={margem}  cor="#a855f7" tipo="porcentagem" />
        </div>
 
        {/* GRÁFICO */}
        {grafico.length > 0 && (
          <div style={graficoBox}>
            <h3>Evolução Mensal</h3>
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
        )}
 
        {/* EXPORTAÇÃO */}
        <button style={btnExport} disabled title="Em breve">
          📄 Exportar CSV (em breve)
        </button>
 
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
 
const menuStyle: React.CSSProperties = { display: 'flex', gap: 16 }
 
const titulo: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  marginBottom: 20
}
 
const filtro: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-end',
  marginBottom: 20,
  flexWrap: 'wrap'
}
 
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4
}
 
const inputDate: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #e2e8f0'
}
 
const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
  gap: 16,
  marginBottom: 30
}
 
const graficoBox: React.CSSProperties = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  marginBottom: 20
}
 
const alertaErro: React.CSSProperties = {
  background: '#fee2e2',
  padding: 10,
  borderRadius: 8,
  marginBottom: 16,
  color: '#991b1b'
}
 
const btnFiltrar: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer'
}
 
const btnLimpar: React.CSSProperties = {
  background: '#e2e8f0',
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer'
}
 
const btnExport: React.CSSProperties = {
  marginTop: 10,
  background: '#94a3b8',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  cursor: 'not-allowed'
}
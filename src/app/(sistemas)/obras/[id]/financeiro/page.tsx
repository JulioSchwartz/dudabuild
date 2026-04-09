'use client'
 
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
 
// Categorias pré-definidas de entradas
const CATEGORIAS_ENTRADA = [
  'Pagamento Inicial / Sinal',
  'Parcela Cliente',
  'Parcela Final',
  'Aditivo de Contrato',
  'Medição Parcial',
  'Outros (Entrada)',
]
 
// Categorias pré-definidas de saídas
const CATEGORIAS_SAIDA = [
  'Materiais de Construção',
  'Mão de Obra',
  'Aluguel de Equipamentos',
  'Transporte / Frete',
  'Serviços Terceirizados',
  'Taxas e Impostos',
  'Ferramentas',
  'Energia Elétrica / Água',
  'Segurança do Trabalho (EPI)',
  'Projeto / Engenharia',
  'Outros (Saída)',
]
 
export default function Financeiro() {
 
  const { empresaId, bloqueado, loading } = useEmpresa()
  const router = useRouter()
 
  const [dados, setDados]       = useState<any[]>([])
  const [obras, setObras]       = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
 
  // Form de lançamento
  const [tipo,      setTipo]      = useState<'entrada' | 'saida'>('entrada')
  const [categoria, setCategoria] = useState('')
  const [valor,     setValor]     = useState('')
  const [data,      setData]      = useState(new Date().toISOString().split('T')[0])
  const [obraId,    setObraId]    = useState('')
  const [salvando,  setSalvando]  = useState(false)
  const [abaAtiva,  setAbaAtiva]  = useState<'entrada' | 'saida'>('entrada')
 
  useEffect(() => {
    if (!loading && bloqueado) router.push('/bloqueado')
  }, [loading, bloqueado, router])
 
  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])
 
  async function carregar() {
    try {
      const [{ data: finData, error: errFin }, { data: obrasData }] = await Promise.all([
        supabase.from('financeiro').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
        supabase.from('obras').select('id, nome').eq('empresa_id', empresaId),
      ])
      if (errFin) throw errFin
      setDados(finData || [])
      setObras(obrasData || [])
    } catch (err) {
      console.error('Erro financeiro:', err)
      alert('Erro ao carregar financeiro')
    } finally {
      setLoadingData(false)
    }
  }
 
  async function lancar() {
    if (!categoria) return alert('Selecione uma categoria')
    if (!valor || Number(valor) <= 0) return alert('Informe um valor válido')
    if (!empresaId) return
 
    setSalvando(true)
    try {
      const { error } = await supabase.from('financeiro').insert({
        empresa_id:  empresaId,
        tipo,
        descricao:   categoria,
        valor:       Number(valor),
        obra_id:     obraId || null,
        created_at:  new Date(data).toISOString(),
      })
      if (error) throw error
 
      // Reseta form
      setCategoria('')
      setValor('')
      setData(new Date().toISOString().split('T')[0])
      setObraId('')
      await carregar()
 
    } catch (err) {
      console.error('Erro ao lançar:', err)
      alert('Erro ao salvar lançamento')
    } finally {
      setSalvando(false)
    }
  }
 
  async function excluir(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    await supabase.from('financeiro').delete().eq('id', id)
    carregar()
  }
 
  if (loading || loadingData) return <p style={{ padding: 24 }}>Carregando financeiro...</p>
 
  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas   = dados.filter(d => d.tipo === 'saida')
  const receita  = soma(entradas)
  const custo    = soma(saidas)
  const lucro    = receita - custo
  const margem   = receita > 0 ? (lucro / receita) * 100 : 0
 
  const porMes: Record<string, { mes: string; entrada: number; saida: number }> = {}
  dados.forEach(d => {
    if (!d.created_at) return
    const valor = Number(d.valor || 0)
    const mes = new Date(d.created_at).toLocaleDateString('pt-BR', { month: 'short' })
    if (!porMes[mes]) porMes[mes] = { mes, entrada: 0, saida: 0 }
    if (d.tipo === 'entrada') porMes[mes].entrada += valor
    else                      porMes[mes].saida   += valor
  })
  const grafico = Object.values(porMes)
 
  const categorias = tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA
  const listaFiltrada = dados.filter(d => d.tipo === abaAtiva)
 
  return (
    <div style={{ padding: 24 }}>
 
      <h1 style={titulo}>💰 Financeiro</h1>
 
      {lucro < 0 && <div style={alertaErro}>⚠️ Prejuízo no período</div>}
 
      {/* CARDS */}
      <div style={grid}>
        <Card titulo="Receita" valor={receita} cor="#16a34a" />
        <Card titulo="Custos"  valor={custo}   cor="#dc2626" />
        <Card titulo="Lucro"   valor={lucro}   cor="#2563eb" />
        <Card titulo="Margem"  valor={margem}  cor="#a855f7" tipo="porcentagem" />
      </div>
 
      {/* GRÁFICO */}
      <div style={graficoBox}>
        <h3>📊 Evolução Financeira</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={grafico}>
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="entrada" stroke="#16a34a" strokeWidth={2} />
            <Line dataKey="saida"   stroke="#dc2626" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
 
      {/* ── FORMULÁRIO DE LANÇAMENTO ── */}
      <div style={formCard}>
        <h3 style={formTitulo}>➕ Novo Lançamento</h3>
 
        {/* Tipo */}
        <div style={tipoToggle}>
          <button
            onClick={() => { setTipo('entrada'); setCategoria('') }}
            style={tipo === 'entrada' ? btnTipoAtivo('#16a34a') : btnTipoInativo}
          >
            ↑ Entrada
          </button>
          <button
            onClick={() => { setTipo('saida'); setCategoria('') }}
            style={tipo === 'saida' ? btnTipoAtivo('#dc2626') : btnTipoInativo}
          >
            ↓ Saída
          </button>
        </div>
 
        <div style={formRow}>
 
          {/* Categoria */}
          <div style={formGroup}>
            <label style={label}>Categoria *</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} style={select}>
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
 
          {/* Valor */}
          <div style={formGroup}>
            <label style={label}>Valor (R$) *</label>
            <input
              type="number"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              style={input}
              min="0"
              step="0.01"
            />
          </div>
 
          {/* Data */}
          <div style={formGroup}>
            <label style={label}>Data</label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              style={input}
            />
          </div>
 
          {/* Obra (opcional) */}
          <div style={formGroup}>
            <label style={label}>Obra (opcional)</label>
            <select value={obraId} onChange={e => setObraId(e.target.value)} style={select}>
              <option value="">Sem obra</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
 
        </div>
 
        <button onClick={lancar} style={btnLancar(tipo)} disabled={salvando}>
          {salvando ? 'Salvando...' : tipo === 'entrada' ? '↑ Registrar Entrada' : '↓ Registrar Saída'}
        </button>
      </div>
 
      {/* ── LISTA DE LANÇAMENTOS ── */}
      <div style={listaCard}>
        <div style={abaRow}>
          <button
            onClick={() => setAbaAtiva('entrada')}
            style={abaAtiva === 'entrada' ? abaAtivaStyle('#16a34a') : abaInativa}
          >
            Entradas ({entradas.length})
          </button>
          <button
            onClick={() => setAbaAtiva('saida')}
            style={abaAtiva === 'saida' ? abaAtivaStyle('#dc2626') : abaInativa}
          >
            Saídas ({saidas.length})
          </button>
        </div>
 
        {listaFiltrada.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>
            Nenhum lançamento ainda.
          </p>
        )}
 
        {listaFiltrada.map(d => (
          <div key={d.id} style={itemLinha(d.tipo)}>
            <div>
              <p style={{ fontWeight: 600, color: '#0f172a' }}>{d.descricao}</p>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {new Date(d.created_at).toLocaleDateString('pt-BR')}
                {d.obra_id && obras.find(o => o.id === d.obra_id)
                  ? ` · ${obras.find(o => o.id === d.obra_id)?.nome}`
                  : ''}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <strong style={{ color: d.tipo === 'entrada' ? '#16a34a' : '#dc2626', fontSize: 15 }}>
                {d.tipo === 'entrada' ? '+' : '-'} {format(Number(d.valor))}
              </strong>
              <button onClick={() => excluir(d.id)} style={btnExcluir}>✕</button>
            </div>
          </div>
        ))}
      </div>
 
    </div>
  )
}
 
/* HELPERS */
function soma(lista: any[]) { return lista.reduce((acc, i) => acc + Number(i.valor || 0), 0) }
function format(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
 
function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{ background: cor + '15', padding: 20, borderRadius: 12, border: `1px solid ${cor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <p style={{ color: '#64748b' }}>{titulo}</p>
      <h2 style={{ color: cor, fontSize: 22, fontWeight: 700 }}>
        {tipo === 'porcentagem' ? Number(valor).toFixed(2) + '%' : format(valor)}
      </h2>
    </div>
  )
}
 
/* ESTILOS */
const titulo: React.CSSProperties    = { fontSize: 26, fontWeight: 700, marginBottom: 20 }
const grid: React.CSSProperties      = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }
const graficoBox: React.CSSProperties = { background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 24 }
const alertaErro: React.CSSProperties = { background: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16, color: '#991b1b', fontWeight: 600 }
 
const formCard: React.CSSProperties = {
  background: '#fff', padding: 24, borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 24
}
const formTitulo: React.CSSProperties = { fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#0f172a' }
const tipoToggle: React.CSSProperties = { display: 'flex', gap: 10, marginBottom: 20 }
const formRow: React.CSSProperties    = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 16 }
const formGroup: React.CSSProperties  = { display: 'flex', flexDirection: 'column' }
const label: React.CSSProperties      = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }
const input: React.CSSProperties      = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }
const select: React.CSSProperties     = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#fff' }
 
const btnTipoAtivo = (cor: string): React.CSSProperties => ({
  flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${cor}`,
  background: cor, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14
})
const btnTipoInativo: React.CSSProperties = {
  flex: 1, padding: '10px 0', borderRadius: 8, border: '2px solid #e2e8f0',
  background: '#f8fafc', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 14
}
const btnLancar = (tipo: string): React.CSSProperties => ({
  background: tipo === 'entrada' ? '#16a34a' : '#dc2626',
  color: '#fff', border: 'none', padding: '12px 28px',
  borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer'
})
 
const listaCard: React.CSSProperties  = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }
const abaRow: React.CSSProperties     = { display: 'flex', borderBottom: '1px solid #e2e8f0' }
const abaAtivaStyle = (cor: string): React.CSSProperties => ({
  flex: 1, padding: '14px 0', border: 'none', background: '#fff',
  borderBottom: `3px solid ${cor}`, color: cor, fontWeight: 700, cursor: 'pointer', fontSize: 14
})
const abaInativa: React.CSSProperties = {
  flex: 1, padding: '14px 0', border: 'none', background: '#f8fafc',
  color: '#94a3b8', fontWeight: 600, cursor: 'pointer', fontSize: 14
}
const itemLinha = (tipo: string): React.CSSProperties => ({
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
  borderLeft: `4px solid ${tipo === 'entrada' ? '#16a34a' : '#dc2626'}`
})
const btnExcluir: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#cbd5e1',
  cursor: 'pointer', fontSize: 16, padding: '2px 6px'
}
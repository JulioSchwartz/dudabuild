'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

const CATEGORIAS_ENTRADA = [
  'Pagamento Inicial / Sinal',
  'Parcela Cliente',
  'Parcela Final',
  'Aditivo de Contrato',
  'Medição Parcial',
  'Outros (Entrada)',
]

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

export default function DetalheObra() {

  const { empresaId, loading: loadingEmpresa } = useEmpresa()
  const { id } = useParams()
  const router  = useRouter()

  const [obra,        setObra]        = useState<any>(null)
  const [financeiro,  setFinanceiro]  = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form lançamento
  const [tipo,      setTipo]      = useState<'entrada' | 'saida'>('entrada')
  const [categoria, setCategoria] = useState('')
  const [valor,     setValor]     = useState('')
  const [data,      setData]      = useState(new Date().toISOString().split('T')[0])
  const [salvando,  setSalvando]  = useState(false)
  const [abaAtiva,  setAbaAtiva]  = useState<'entrada' | 'saida'>('entrada')

  useEffect(() => {
    // ⚠️ Aguarda o hook terminar ANTES de qualquer decisão
    if (loadingEmpresa) return

    // Só redireciona se o hook terminou E não tem empresa
    // Evita redirect falso durante carregamento inicial
    if (!empresaId) {
      router.push('/login')
      return
    }

    if (!id) return
    carregar()
  }, [id, empresaId, loadingEmpresa])

  async function carregar() {
    try {
      setLoadingData(true)
      const [{ data: obraData }, { data: financeiroData }] = await Promise.all([
        supabase
          .from('obras')
          .select('*')
          .eq('id', Number(id))
          .eq('empresa_id', empresaId)
          .maybeSingle(),
        supabase
          .from('financeiro')
          .select('*')
          .eq('obra_id', Number(id))
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false }),
      ])
      setObra(obraData)
      setFinanceiro(financeiroData || [])
    } catch (err) {
      console.error('Erro ao carregar obra:', err)
    } finally {
      setLoadingData(false)
    }
  }

  async function lancar() {
    if (!categoria)                   return alert('Selecione uma categoria')
    if (!valor || Number(valor) <= 0) return alert('Informe um valor válido')
    if (!empresaId)                   return

    setSalvando(true)
    try {
      const { error } = await supabase.from('financeiro').insert({
        empresa_id: empresaId,
        obra_id:    Number(id),
        tipo,
        descricao:  categoria,
        valor:      Number(valor),
        created_at: new Date(data).toISOString(),
      })
      if (error) throw error

      setCategoria('')
      setValor('')
      setData(new Date().toISOString().split('T')[0])
      await carregar()

    } catch (err) {
      console.error('Erro ao lançar:', err)
      alert('Erro ao salvar lançamento')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(lancId: string) {
    if (!confirm('Excluir este lançamento?')) return
    await supabase.from('financeiro').delete().eq('id', lancId)
    carregar()
  }

  // ⚠️ Mostra loading enquanto o hook OU os dados carregam
  if (loadingEmpresa || loadingData) {
    return <p style={{ padding: 24 }}>Carregando...</p>
  }

  if (!obra) return <p style={{ padding: 24 }}>Obra não encontrada.</p>

  /* ── MÉTRICAS ── */
  const entradas = financeiro.filter(f => f.tipo === 'entrada')
  const saidas   = financeiro.filter(f => f.tipo === 'saida')

  const totalEntradas   = entradas.reduce((a, e) => a + Number(e.valor), 0)
  const totalSaidas     = saidas.reduce((a, s) => a + Number(s.valor), 0)
  const lucro           = totalEntradas - totalSaidas
  const margem          = totalEntradas > 0 ? (lucro / totalEntradas) * 100 : 0
  const roi             = totalSaidas > 0 ? (lucro / totalSaidas) * 100 : 0
  const custoPorMetro   = obra?.area ? totalSaidas / obra.area : 0
  const valorTotal      = obra?.valor || 0
  const restanteReceber = valorTotal - totalEntradas
  const lucroPrevisto   = valorTotal - totalSaidas

  /* ── GRÁFICO ── */
  const fluxoMensal: Record<string, { mes: string; entrada: number; saida: number }> = {}
  financeiro.forEach(item => {
    const mes = new Date(item.created_at).toLocaleDateString('pt-BR', { month: 'short' })
    if (!fluxoMensal[mes]) fluxoMensal[mes] = { mes, entrada: 0, saida: 0 }
    if (item.tipo === 'entrada') fluxoMensal[mes].entrada += Number(item.valor)
    else                         fluxoMensal[mes].saida   += Number(item.valor)
  })
  const dadosGrafico = Object.values(fluxoMensal)

  /* ── RANKING CUSTOS ── */
  const resumoCategoria: Record<string, number> = {}
  saidas.forEach(s => {
    if (!resumoCategoria[s.descricao]) resumoCategoria[s.descricao] = 0
    resumoCategoria[s.descricao] += Number(s.valor)
  })
  const rankingCategorias = Object.entries(resumoCategoria)
    .map(([k, v]) => ({ nome: k, valor: v, percentual: totalSaidas > 0 ? (v / totalSaidas) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor)

  const categorias      = tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA
  const listaFiltrada   = financeiro.filter(f => f.tipo === abaAtiva)

  return (
    <div style={{ padding: 24 }}>

      {lucro < 0 && (
        <div style={alerta}>🚨 Obra em prejuízo — revise custos imediatamente</div>
      )}

      <button onClick={() => router.back()} style={btnVoltar}>⬅ Voltar</button>

      <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 8 }}>{obra.nome}</h1>
      <p style={{ color: '#64748b' }}>{obra.cliente}</p>
      <p style={valorPrincipal}>💰 Valor do contrato: {format(obra.valor || 0)}</p>

      {/* ── CARDS ── */}
      <div style={grid}>
        <Card titulo="Receita"        valor={totalEntradas}   cor="#22c55e" />
        <Card titulo="Custos"         valor={totalSaidas}     cor="#ef4444" />
        <Card titulo="Lucro"          valor={lucro}           cor="#3b82f6" />
        <Card titulo="Margem"         valor={margem}          cor="#a855f7" tipo="porcentagem" />
        <Card titulo="ROI"            valor={roi}             cor="#0ea5e9" tipo="porcentagem" />
        <Card titulo="Custo/m²"       valor={custoPorMetro}   cor="#f59e0b" />
        <Card titulo="A Receber"      valor={restanteReceber} cor="#f59e0b" />
        <Card titulo="Lucro Previsto" valor={lucroPrevisto}   cor="#10b981" />
      </div>

      {/* ── GRÁFICO ── */}
      {dadosGrafico.length > 0 && (
        <div style={graficoBox}>
          <h3 style={{ marginBottom: 12 }}>📈 Fluxo Financeiro da Obra</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dadosGrafico}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="entrada" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="saida"   stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── FORMULÁRIO DE LANÇAMENTO ── */}
      <div style={formCard}>
        <h3 style={formTitulo}>➕ Novo Lançamento</h3>

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
          <div style={formGroup}>
            <label style={labelStyle}>Categoria *</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} style={selectStyle}>
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>Valor (R$) *</label>
            <input
              type="number"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              style={inputStyle}
              min="0"
              step="0.01"
            />
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>Data</label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <button onClick={lancar} style={btnLancar(tipo)} disabled={salvando}>
          {salvando
            ? 'Salvando...'
            : tipo === 'entrada' ? '↑ Registrar Entrada' : '↓ Registrar Saída'}
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
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>
            Nenhum lançamento ainda.
          </p>
        )}

        {listaFiltrada.map(d => (
          <div key={d.id} style={itemLinha(d.tipo)}>
            <div>
              <p style={{ fontWeight: 600, color: '#0f172a' }}>{d.descricao}</p>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {new Date(d.created_at).toLocaleDateString('pt-BR')}
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

      {/* ── RANKING CUSTOS ── */}
      {rankingCategorias.length > 0 && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: 12 }}>💸 Maiores custos</h3>
          {rankingCategorias.map((c, i) => (
            <div key={c.nome} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: i === 0 ? 700 : 400 }}>
                #{i + 1} {c.nome}
              </span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>
                {format(c.valor)} ({c.percentual.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

/* ── HELPERS ── */
function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{ background: cor + '15', padding: 18, borderRadius: 12, border: `1px solid ${cor}` }}>
      <p style={{ color: '#64748b', fontSize: 13 }}>{titulo}</p>
      <h2 style={{ color: cor, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
        {tipo === 'porcentagem' ? Number(valor).toFixed(2) + '%' : format(valor)}
      </h2>
    </div>
  )
}

/* ── ESTILOS ── */
const alerta: React.CSSProperties         = { background: '#fee2e2', padding: 16, borderRadius: 10, marginBottom: 15, color: '#991b1b', fontWeight: 700 }
const btnVoltar: React.CSSProperties      = { background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 14, padding: 0 }
const valorPrincipal: React.CSSProperties = { fontSize: 15, fontWeight: 600, color: '#16a34a', marginBottom: 20, marginTop: 4 }
const grid: React.CSSProperties           = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 24 }
const graficoBox: React.CSSProperties     = { background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 24 }

const formCard: React.CSSProperties  = { background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 24, marginTop: 24 }
const formTitulo: React.CSSProperties = { fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#0f172a' }
const tipoToggle: React.CSSProperties = { display: 'flex', gap: 10, marginBottom: 18 }
const formRow: React.CSSProperties   = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 16 }
const formGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }
const inputStyle: React.CSSProperties = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }
const selectStyle: React.CSSProperties = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#fff' }

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

const listaCard: React.CSSProperties   = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }
const abaRow: React.CSSProperties      = { display: 'flex', borderBottom: '1px solid #e2e8f0' }
const abaAtivaStyle = (cor: string): React.CSSProperties => ({
  flex: 1, padding: '14px 0', border: 'none', background: '#fff',
  borderBottom: `3px solid ${cor}`, color: cor, fontWeight: 700, cursor: 'pointer', fontSize: 14
})
const abaInativa: React.CSSProperties  = {
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
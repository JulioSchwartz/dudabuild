'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts'

export default function Relatorios() {
  const { empresaId, bloqueado, loading: loadingEmpresa } = useEmpresa()
  const router = useRouter()

  const [dados,      setDados]      = useState<any[]>([])
  const [obras,      setObras]      = useState<any[]>([])
  const [inicio,     setInicio]     = useState('')
  const [fim,        setFim]        = useState('')
  const [obraFiltro, setObraFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [loading,    setLoading]    = useState(true)
  const [abaAtiva,   setAbaAtiva]   = useState<'resumo' | 'lancamentos' | 'categorias'>('resumo')

  useEffect(() => { if (!loadingEmpresa && bloqueado) router.push('/bloqueado') }, [loadingEmpresa, bloqueado, router])

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setLoading(true)
    try {
      const [{ data: finData, error }, { data: obrasData }] = await Promise.all([
        (() => {
          let q = supabase.from('financeiro').select('*').eq('empresa_id', empresaId)
          if (inicio) q = q.gte('data', inicio)
          if (fim)    q = q.lte('data', fim)
          if (obraFiltro) q = q.eq('obra_id', obraFiltro)
          if (tipoFiltro) q = q.eq('tipo', tipoFiltro)
          return q.order('data', { ascending: false })
        })(),
        supabase.from('obras').select('id, nome').eq('empresa_id', empresaId),
      ])
      if (error) throw error
      setDados(finData   || [])
      setObras(obrasData || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [empresaId, inicio, fim, obraFiltro, tipoFiltro])

  useEffect(() => { if (!empresaId) return; carregar() }, [empresaId])

  function limparFiltros() { setInicio(''); setFim(''); setObraFiltro(''); setTipoFiltro('') }

  useEffect(() => {
    if (!inicio && !fim && !obraFiltro && !tipoFiltro && empresaId) carregar()
  }, [inicio, fim, obraFiltro, tipoFiltro])

  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas   = dados.filter(d => d.tipo === 'saida')
  const receita  = soma(entradas)
  const custo    = soma(saidas)
  const lucro    = receita - custo
  const margem   = receita > 0 ? (lucro / receita) * 100 : 0

  const nomeObra: Record<string, string> = {}
  obras.forEach(o => { nomeObra[String(o.id)] = o.nome })

  const porObra: Record<string, { nome: string; receita: number; custo: number }> = {}
  dados.forEach(d => {
    if (!d.obra_id) return
    const key = String(d.obra_id); const valor = Number(d.valor || 0)
    if (!porObra[key]) porObra[key] = { nome: nomeObra[key] || `Obra ${key}`, receita: 0, custo: 0 }
    if (d.tipo === 'entrada') porObra[key].receita += valor
    else                      porObra[key].custo   += valor
  })
  const comparativo = Object.values(porObra)

  const porMes: Record<string, { mes: string; receita: number; custo: number }> = {}
  dados.forEach(d => {
    const dataRef = d.data || d.created_at; if (!dataRef) return
    const mesKey = dataRef.slice(0, 7)
    const mesLabel = new Date(mesKey + '-15').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (!porMes[mesKey]) porMes[mesKey] = { mes: mesLabel, receita: 0, custo: 0 }
    if (d.tipo === 'entrada') porMes[mesKey].receita += Number(d.valor || 0)
    else                      porMes[mesKey].custo   += Number(d.valor || 0)
  })
  const evolucao = Object.entries(porMes).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)

  const porCategoria: Record<string, { descricao: string; total: number; tipo: string; count: number }> = {}
  dados.forEach(d => {
    const key = `${d.tipo}::${d.descricao || 'Sem categoria'}`
    if (!porCategoria[key]) porCategoria[key] = { descricao: d.descricao || 'Sem categoria', total: 0, tipo: d.tipo, count: 0 }
    porCategoria[key].total += Number(d.valor || 0)
    porCategoria[key].count++
  })
  const categorias = Object.values(porCategoria).sort((a, b) => b.total - a.total)

  function exportarCSV() {
    const linhas = [
      ['Data', 'Tipo', 'Categoria', 'Obra', 'Valor'],
      ...dados.map(d => [
        d.data ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR') : new Date(d.created_at).toLocaleDateString('pt-BR'),
        d.tipo, d.descricao || '', nomeObra[String(d.obra_id)] || '',
        String(Number(d.valor || 0).toFixed(2)).replace('.', ','),
      ])
    ]
    const csv  = linhas.map(l => l.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `relatorio_${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loadingEmpresa || loading) return <p style={{ padding: 24 }}>Carregando...</p>

  const filtrando = inicio || fim || obraFiltro || tipoFiltro

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        @media (max-width: 768px) {
          .rel-cabecalho { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .rel-resumo-grid { grid-template-columns: 1fr !important; }
          .rel-filtro-row { flex-direction: column !important; align-items: stretch !important; }
          .rel-filtro-row > * { width: 100% !important; }
          .rel-filtro-row input,
          .rel-filtro-row select { width: 100% !important; box-sizing: border-box !important; }
          .rel-tabela-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .rel-tabela-header,
          .rel-tabela-linha,
          .rel-tabela-total { grid-template-columns: 90px 80px 1fr 1fr 110px !important; font-size: 11px !important; min-width: 440px; }
          .rel-abas { flex-wrap: wrap !important; }
        }
      `}</style>

      {/* CABEÇALHO */}
      <div className="rel-cabecalho" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={titulo}>Relatórios</h1>
          <p style={subtitulo}>Análise financeira por período e obra</p>
        </div>
        <button onClick={exportarCSV} style={btnExport} disabled={dados.length === 0}>
          ⬇️ Exportar CSV
        </button>
      </div>

      {/* FILTROS */}
      <div style={filtroCard}>
        <p style={filtroTitulo}>🔍 Filtros</p>
        <div className="rel-filtro-row" style={filtroRow}>
          <div style={filtroGrupo}>
            <label style={labelStyle}>De</label>
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} style={inputStyle} />
          </div>
          <div style={filtroGrupo}>
            <label style={labelStyle}>Até</label>
            <input type="date" value={fim} onChange={e => setFim(e.target.value)} style={inputStyle} />
          </div>
          <div style={filtroGrupo}>
            <label style={labelStyle}>Obra</label>
            <select value={obraFiltro} onChange={e => setObraFiltro(e.target.value)} style={inputStyle}>
              <option value="">Todas as obras</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <div style={filtroGrupo}>
            <label style={labelStyle}>Tipo</label>
            <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)} style={inputStyle}>
              <option value="">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button onClick={carregar} style={btnFiltrar}>Filtrar</button>
            {filtrando && <button onClick={limparFiltros} style={btnLimpar}>✕ Limpar</button>}
          </div>
        </div>
      </div>

      {/* MÉTRICAS — 3 col desktop, 2 col mobile */}
      <div className="rel-resumo-grid" style={resumoGrid}>
        <Metrica label="Receitas"    valor={format(receita)} cor="#16a34a" icone="↑" sub={`${entradas.length} lançamentos`} />
        <Metrica label="Saídas"      valor={format(custo)}   cor="#dc2626" icone="↓" sub={`${saidas.length} lançamentos`} />
        <Metrica label="Resultado"   valor={format(lucro)}   cor={lucro >= 0 ? '#2563eb' : '#dc2626'} icone={lucro >= 0 ? '✓' : '!'} sub={lucro >= 0 ? 'Lucro' : 'Prejuízo'} />
        <Metrica label="Margem"      valor={margem.toFixed(1) + '%'} cor="#a855f7" icone="%" sub="Margem líquida" />
        <Metrica label="Lançamentos" valor={String(dados.length)} cor="#0ea5e9" icone="#" sub="Total no período" />
        <Metrica label="Obras"       valor={String(Object.keys(porObra).length)} cor="#f59e0b" icone="🏗" sub="Com lançamentos" />
      </div>

      {dados.length === 0 ? (
        <div style={vazioCard}>
          <p style={{ fontSize: 32 }}>📭</p>
          <p style={{ fontWeight: 600, color: '#0f172a', marginTop: 8 }}>Nenhum lançamento encontrado</p>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            {filtrando ? 'Tente ajustar os filtros acima' : 'Lance entradas e saídas dentro das obras'}
          </p>
        </div>
      ) : (
        <>
          {/* ABAS */}
          <div className="rel-abas" style={abasRow}>
            {(['resumo', 'lancamentos', 'categorias'] as const).map(aba => (
              <button key={aba} onClick={() => setAbaAtiva(aba)} style={abaBtn(abaAtiva === aba)}>
                {aba === 'resumo' ? '📊 Resumo' : aba === 'lancamentos' ? '📋 Lançamentos' : '🏷️ Categorias'}
              </button>
            ))}
          </div>

          {/* RESUMO */}
          {abaAtiva === 'resumo' && (
            <>
              {evolucao.length > 1 && (
                <div style={secaoCard}>
                  <h3 style={secaoTitulo}>📈 Evolução Mensal</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={evolucao}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="mes" fontSize={12} />
                      <YAxis fontSize={11} tickFormatter={v => 'R$' + (v / 1000).toFixed(0) + 'k'} />
                      <Tooltip formatter={(v: any) => format(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="receita" name="Receita" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="custo"   name="Custo"   stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {comparativo.length > 0 && (
                <div style={secaoCard}>
                  <h3 style={secaoTitulo}>📊 Receita × Custo por Obra</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={comparativo} barGap={4}>
                      <XAxis dataKey="nome" fontSize={12} />
                      <YAxis fontSize={11} tickFormatter={v => 'R$' + (v / 1000).toFixed(0) + 'k'} />
                      <Tooltip formatter={(v: any) => format(v)} />
                      <Legend />
                      <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[4,4,0,0]} />
                      <Bar dataKey="custo"   name="Custo"   fill="#ef4444" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* LANÇAMENTOS */}
          {abaAtiva === 'lancamentos' && (
            <div style={secaoCard}>
              <h3 style={secaoTitulo}>📋 Lançamentos detalhados ({dados.length})</h3>
              <div className="rel-tabela-wrap">
                <div style={{ minWidth: 440 }}>
                  <div className="rel-tabela-header" style={tabelaHeader}>
                    <span>Data</span><span>Tipo</span><span>Categoria</span><span>Obra</span>
                    <span style={{ textAlign: 'right' }}>Valor</span>
                  </div>
                  <div style={{ maxHeight: 440, overflowY: 'auto' }}>
                    {dados.map(d => {
                      const dataExib = d.data
                        ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR')
                        : new Date(d.created_at).toLocaleDateString('pt-BR')
                      return (
                        <div key={d.id} className="rel-tabela-linha" style={tabelaLinha}>
                          <span style={{ color: '#64748b', fontSize: 13 }}>{dataExib}</span>
                          <span>
                            <span style={{ background: d.tipo === 'entrada' ? '#dcfce7' : '#fee2e2', color: d.tipo === 'entrada' ? '#16a34a' : '#dc2626', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                              {d.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                            </span>
                          </span>
                          <span style={{ fontSize: 13 }}>{d.descricao || '—'}</span>
                          <span style={{ fontSize: 13, color: '#64748b' }}>{nomeObra[String(d.obra_id)] || '—'}</span>
                          <span style={{ textAlign: 'right', fontWeight: 600, color: d.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>
                            {d.tipo === 'entrada' ? '+' : '-'}{format(Number(d.valor))}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="rel-tabela-total" style={tabelaTotal}>
                    <span style={{ gridColumn: '1 / 5', fontWeight: 700 }}>Resultado do período</span>
                    <span style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: lucro >= 0 ? '#16a34a' : '#dc2626' }}>
                      {lucro >= 0 ? '+' : ''}{format(lucro)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIAS */}
          {abaAtiva === 'categorias' && (
            <div style={secaoCard}>
              <h3 style={secaoTitulo}>🏷️ Resumo por Categoria</h3>
              {categorias.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Nenhuma categoria encontrada</p>
              ) : categorias.map((c, i) => (
                <div key={i} style={catLinha}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ background: c.tipo === 'entrada' ? '#dcfce7' : '#fee2e2', color: c.tipo === 'entrada' ? '#16a34a' : '#dc2626', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      {c.tipo === 'entrada' ? '↑' : '↓'}
                    </span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{c.descricao}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8' }}>{c.count} lançamento{c.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, color: c.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>
                      {c.tipo === 'entrada' ? '+' : '-'}{format(c.total)}
                    </p>
                    {receita > 0 && (
                      <p style={{ fontSize: 11, color: '#94a3b8' }}>
                        {((c.total / (c.tipo === 'entrada' ? receita : custo)) * 100).toFixed(1)}% do total
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function soma(lista: any[]) { return lista.reduce((a, b) => a + Number(b.valor || 0), 0) }
function format(v: number)  { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function Metrica({ label, valor, cor, icone, sub }: any) {
  return (
    <div style={metricaBox}>
      <div style={metricaIcone(cor)}>{icone}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</p>
        <p style={{ fontSize: 18, fontWeight: 800, color: cor, marginTop: 2 }}>{valor}</p>
        {sub && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{sub}</p>}
      </div>
    </div>
  )
}

const titulo: React.CSSProperties       = { fontSize: 24, fontWeight: 800, color: '#0f172a' }
const subtitulo: React.CSSProperties    = { fontSize: 13, color: '#94a3b8', marginTop: 2 }
const filtroCard: React.CSSProperties   = { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }
const filtroTitulo: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 12 }
const filtroRow: React.CSSProperties    = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }
const filtroGrupo: React.CSSProperties  = { display: 'flex', flexDirection: 'column' }
const labelStyle: React.CSSProperties   = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }
const inputStyle: React.CSSProperties   = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff' }
const resumoGrid: React.CSSProperties   = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }
const metricaBox: React.CSSProperties   = { background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', gap: 14, alignItems: 'center', overflow: 'hidden', minWidth: 0 }
const metricaIcone = (cor: string): React.CSSProperties => ({ width: 40, height: 40, borderRadius: 10, background: cor + '20', color: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 })
const abasRow: React.CSSProperties      = { display: 'flex', gap: 8, marginBottom: 16 }
const abaBtn = (ativo: boolean): React.CSSProperties => ({ padding: '8px 16px', borderRadius: 8, border: '1px solid', borderColor: ativo ? '#2563eb' : '#e2e8f0', background: ativo ? '#2563eb' : '#fff', color: ativo ? '#fff' : '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer' })
const secaoCard: React.CSSProperties    = { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }
const secaoTitulo: React.CSSProperties  = { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }
const tabelaHeader: React.CSSProperties = { display: 'grid', gridTemplateColumns: '110px 100px 1fr 1fr 130px', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }
const tabelaLinha: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '110px 100px 1fr 1fr 130px', padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 13, alignItems: 'center' }
const tabelaTotal: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '110px 100px 1fr 1fr 130px', padding: '12px', background: '#f8fafc', borderRadius: 8, marginTop: 8 }
const vazioCard: React.CSSProperties    = { textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 14, marginBottom: 20 }
const catLinha: React.CSSProperties     = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }
const btnExport: React.CSSProperties    = { background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }
const btnFiltrar: React.CSSProperties   = { background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }
const btnLimpar: React.CSSProperties    = { background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }
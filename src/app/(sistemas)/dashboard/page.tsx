'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function Dashboard() {

  const { empresaId, bloqueado, loading } = useEmpresa()
  const router = useRouter()

  const [dados,        setDados]        = useState<any[]>([])
  const [obras,        setObras]        = useState<any[]>([])
  const [todasObras,   setTodasObras]   = useState<any[]>([])
  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [loadingData,  setLoadingData]  = useState(true)

  useEffect(() => {
    if (!loading && bloqueado) router.push('/planos')
  }, [loading, bloqueado, router])

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {
    try {
      const [
        { data: finData,       error: errFin },
        { data: obrasData,     error: errObras },
        { data: todasObras },
        { data: orcData,       error: errOrc },
        { data: lidasData },
      ] = await Promise.all([
        supabase.from('financeiro').select('*').eq('empresa_id', empresaId),
        supabase.from('obras').select('*').eq('empresa_id', empresaId).is('deleted_at', null),
        supabase.from('obras').select('id, nome').eq('empresa_id', empresaId), // todas, incluindo deletadas
        supabase.from('orcamentos').select('*').eq('empresa_id', empresaId)
          .is('deleted_at', null)
          .in('status', ['aprovado', 'recusado'])
          .order('aprovado_em', { ascending: false })
          .limit(20),
        supabase.from('notificacoes_lidas').select('orcamento_id').eq('empresa_id', empresaId),
      ])

      if (errFin)   throw errFin
      if (errObras) throw errObras

      setDados(finData   || [])
      setObras(obrasData || [])
      setTodasObras(todasObras || [])

      // Filtra notificações não lidas usando banco
      const lidasIds = new Set((lidasData || []).map((l: any) => l.orcamento_id))
      const novas = (orcData || []).filter(o =>
        !lidasIds.has(o.id) && (o.aprovado_em || o.status === 'recusado')
      )
      setNotificacoes(novas)

    } catch (err) {
      console.error('Erro dashboard:', err)
    } finally {
      setLoadingData(false)
    }
  }

  async function marcarLida(id: string) {
    await supabase.from('notificacoes_lidas').upsert({
      empresa_id: empresaId,
      orcamento_id: id,
    }, { onConflict: 'empresa_id,orcamento_id' })
    setNotificacoes(prev => prev.filter(n => n.id !== id))
  }

  async function marcarTodasLidas() {
    const rows = notificacoes.map(n => ({
      empresa_id: empresaId,
      orcamento_id: n.id,
    }))
    await supabase.from('notificacoes_lidas').upsert(rows, { onConflict: 'empresa_id,orcamento_id' })
    setNotificacoes([])
  }

  if (loading || loadingData) return <p style={{ padding: 24 }}>Carregando...</p>

  /* ── TOTAIS ── */
  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas   = dados.filter(d => d.tipo === 'saida')
  const receita  = soma(entradas)
  const custo    = soma(saidas)
  const lucro    = receita - custo
  const margem   = receita > 0 ? (lucro / receita) * 100 : 0

  /* ── RESULTADO POR OBRA ── */
  const nomeObra: Record<string, string> = {}
  todasObras.forEach(o => { nomeObra[String(o.id)] = o.nome }) // usa todas incluindo deletadas para exibir nome

  const porObra: Record<string, { receita: number; custo: number; lucro: number; margem: number }> = {}
  dados.forEach(d => {
    if (!d.obra_id) return
    const key   = String(d.obra_id)
    const valor = Number(d.valor || 0)
    if (!porObra[key]) porObra[key] = { receita: 0, custo: 0, lucro: 0, margem: 0 }
    if (d.tipo === 'entrada') porObra[key].receita += valor
    else                      porObra[key].custo   += valor
    porObra[key].lucro  = porObra[key].receita - porObra[key].custo
    porObra[key].margem = porObra[key].receita > 0
      ? (porObra[key].lucro / porObra[key].receita) * 100 : 0
  })

  const listaObras         = Object.entries(porObra)
  const topLucro           = [...listaObras].sort((a: any, b: any) => b[1].lucro - a[1].lucro).slice(0, 3)
  const topCusto           = [...listaObras].sort((a: any, b: any) => b[1].custo - a[1].custo).slice(0, 3)
  const obrasNegativas     = listaObras.filter(([, d]: any) => d.lucro < 0)
  const obrasBaixaMargem   = listaObras.filter(([, d]: any) => d.margem < 10 && d.margem >= 0 && d.receita > 0)
  const obrasIds           = new Set(Object.keys(porObra))
  const obrasSemLancamento = obras.filter(o => !obrasIds.has(String(o.id)))

  // IDs de obras ativas (não deletadas) — só essas podem ser clicadas
  const obrasAtivasIds = new Set(obras.map(o => String(o.id)))
  function irParaObra(id: string) {
    if (obrasAtivasIds.has(id)) router.push(`/obras/${id}`)
  }

  return (
    <div style={{ padding: 24 }}>

      {/* ── NOTIFICAÇÕES DE ORÇAMENTOS ── */}
      {notificacoes.length > 0 && (
        <div style={notifBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={notifIcone}>🔔</span>
              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                Novidades nos Orçamentos
              </p>
              <span style={notifBadge}>{notificacoes.length}</span>
            </div>
            <button onClick={marcarTodasLidas} style={btnMarcarTodas}>
              Marcar todas como lidas
            </button>
          </div>

          {notificacoes.map(n => (
            <div key={n.id} style={notifItem(n.status)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                <span style={{ fontSize: 20 }}>
                  {n.status === 'aprovado' ? '✅' : '❌'}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                    {n.status === 'aprovado' ? 'Orçamento aprovado!' : 'Orçamento recusado'}
                  </p>
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    <strong>{n.cliente_nome}</strong> —{' '}
                    {Number(n.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  {n.aprovado_em && (
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {new Date(n.aprovado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => router.push(`/orcamentos/${n.id}`)}
                  style={btnVerOrc(n.status)}
                >
                  Ver orçamento →
                </button>
                <button onClick={() => marcarLida(n.id)} style={btnFecharNotif}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CABEÇALHO */}
      <div style={cabecalho}>
        <h1 style={titulo}>Dashboard Executivo</h1>
        <p style={subtitulo}>Visão geral da operação</p>
        <div style={kpiRow}>
          <KPI label="Receita Total"  valor={format(receita)} cor="#16a34a" />
          <KPI label="Lucro Total"    valor={format(lucro)}   cor={lucro >= 0 ? '#2563eb' : '#dc2626'} />
          <KPI label="Margem Geral"   valor={`${margem.toFixed(1)}%`} cor="#7c3aed" />
          <KPI label="Obras Ativas"   valor={String(obras.filter(o => o.status !== 'concluida').length)} cor="#0ea5e9" />
        </div>
      </div>

      {/* ALERTAS FINANCEIROS */}
      {(obrasNegativas.length > 0 || obrasBaixaMargem.length > 0 || (margem < 10 && margem > 0)) && (
        <div style={alertaBox}>
          <p style={alertaTitulo}>⚠️ Atenção necessária</p>
          {obrasNegativas.map(([id]) => (
            <div key={id} style={alertaItem} onClick={() => irParaObra(String(id))}>
              🔴 <strong>{nomeObra[id] || `Obra ${id}`}</strong> está no prejuízo — clique para revisar
            </div>
          ))}
          {obrasBaixaMargem.map(([id, d]: any) => (
            <div key={id} style={{ ...alertaItem, background: '#fefce8', borderColor: '#fef08a' }}
              onClick={() => irParaObra(String(id))}>
              🟡 <strong>{nomeObra[id] || `Obra ${id}`}</strong> com margem baixa ({d.margem.toFixed(1)}%)
            </div>
          ))}
          {obrasSemLancamento.length > 0 && (
            <div style={{ ...alertaItem, background: '#f0f9ff', borderColor: '#bae6fd' }}>
              🔵 {obrasSemLancamento.length} obra(s) sem lançamentos financeiros
            </div>
          )}
        </div>
      )}

      {/* RANKINGS */}
      <div style={doisGrid}>
        <div style={rankCard}>
          <h3 style={rankTitulo}>🏆 Obras mais lucrativas</h3>
          {topLucro.length === 0
            ? <p style={vazio}>Sem dados ainda</p>
            : topLucro.map(([id, d]: any, i) => (
              <div key={id} style={{ ...rankLinha, cursor: obrasAtivasIds.has(String(id)) ? 'pointer' : 'default', opacity: obrasAtivasIds.has(String(id)) ? 1 : 0.6 }} onClick={() => irParaObra(String(id))}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>
                      {nomeObra[id] || `Obra ${id}`}
                      {!obrasAtivasIds.has(String(id)) && <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6, fontWeight: 400 }}>(excluída)</span>}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>Margem: {d.margem.toFixed(1)}%</p>
                  </div>
                </div>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>{format(d.lucro)}</span>
              </div>
            ))
          }
        </div>

        <div style={rankCard}>
          <h3 style={rankTitulo}>💸 Obras com maior custo</h3>
          {topCusto.length === 0
            ? <p style={vazio}>Sem dados ainda</p>
            : topCusto.map(([id, d]: any, i) => (
              <div key={id} style={{ ...rankLinha, cursor: obrasAtivasIds.has(String(id)) ? 'pointer' : 'default', opacity: obrasAtivasIds.has(String(id)) ? 1 : 0.6 }} onClick={() => irParaObra(String(id))}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>#{i + 1}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>
                      {nomeObra[id] || `Obra ${id}`}
                      {!obrasAtivasIds.has(String(id)) && <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6, fontWeight: 400 }}>(excluída)</span>}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>Receita: {format(d.receita)}</p>
                  </div>
                </div>
                <span style={{ color: '#dc2626', fontWeight: 700 }}>{format(d.custo)}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* LISTA DE OBRAS */}
      <div style={listaCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={rankTitulo}>🏗️ Todas as Obras</h3>
          <button onClick={() => router.push('/obras')} style={btnVer}>Ver todas →</button>
        </div>
        {obras.length === 0
          ? <p style={vazio}>Nenhuma obra cadastrada.{' '}
              <span style={{ color: '#2563eb', cursor: 'pointer' }} onClick={() => router.push('/obras/nova')}>
                Criar primeira obra →
              </span>
            </p>
          : obras.slice(0, 5).map(o => {
            const d = porObra[String(o.id)]
            return (
              <div key={o.id} style={obraLinha} onClick={() => router.push(`/obras/${o.id}`)}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontWeight: 600 }}>{o.nome}</p>
                    {o.status === 'concluida' && (
                      <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                        ✅ Concluída
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b' }}>{o.cliente || '—'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {d
                    ? <p style={{ color: d.lucro >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                        {d.lucro >= 0 ? '+' : ''}{format(d.lucro)}
                      </p>
                    : <p style={{ color: '#94a3b8', fontSize: 13 }}>Sem lançamentos</p>
                  }
                  {d && <p style={{ fontSize: 12, color: '#94a3b8' }}>Margem: {d.margem.toFixed(1)}%</p>}
                </div>
              </div>
            )
          })
        }
      </div>

    </div>
  )
}

/* ── HELPERS ── */
function soma(lista: any[]) { return lista.reduce((a, b) => a + Number(b.valor || 0), 0) }
function format(v: number)  { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function KPI({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div style={kpiBox}>
      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: cor, marginTop: 2 }}>{valor}</p>
    </div>
  )
}

/* ── ESTILOS ── */
const cabecalho: React.CSSProperties    = { marginBottom: 24 }
const titulo: React.CSSProperties       = { fontSize: 24, fontWeight: 800, color: '#0f172a' }
const subtitulo: React.CSSProperties    = { fontSize: 13, color: '#94a3b8', marginTop: 2, marginBottom: 16 }
const kpiRow: React.CSSProperties       = { display: 'flex', gap: 12, flexWrap: 'wrap' }
const kpiBox: React.CSSProperties       = { background: '#fff', padding: '12px 20px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minWidth: 160 }
const alertaBox: React.CSSProperties    = { marginBottom: 24 }
const alertaTitulo: React.CSSProperties = { fontWeight: 700, color: '#0f172a', marginBottom: 8, fontSize: 14 }
const alertaItem: React.CSSProperties   = { background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', marginBottom: 6, cursor: 'pointer', fontSize: 13, color: '#0f172a' }
const doisGrid: React.CSSProperties     = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }
const rankCard: React.CSSProperties     = { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
const rankTitulo: React.CSSProperties   = { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }
const rankLinha: React.CSSProperties    = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }
const vazio: React.CSSProperties        = { color: '#94a3b8', fontSize: 13, padding: '8px 0' }
const listaCard: React.CSSProperties    = { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
const obraLinha: React.CSSProperties    = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }
const btnVer: React.CSSProperties       = { background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', color: '#2563eb' }

// Notificações
const notifBox: React.CSSProperties      = { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24, border: '1px solid #e2e8f0' }
const notifIcone: React.CSSProperties    = { fontSize: 20 }
const notifBadge: React.CSSProperties    = { background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }
const notifItem = (status: string): React.CSSProperties => ({
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  padding: '12px 14px', borderRadius: 10, marginBottom: 8,
  background: status === 'aprovado' ? '#f0fdf4' : '#fff1f2',
  border: `1px solid ${status === 'aprovado' ? '#bbf7d0' : '#fecdd3'}`,
})
const btnVerOrc = (status: string): React.CSSProperties => ({
  background: status === 'aprovado' ? '#16a34a' : '#dc2626',
  color: '#fff', border: 'none', padding: '6px 12px',
  borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap'
})
const btnFecharNotif: React.CSSProperties  = { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }
const btnMarcarTodas: React.CSSProperties  = { background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#64748b' }
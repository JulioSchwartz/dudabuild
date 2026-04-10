'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const TIPOS = [
  { valor: 'fachada',    label: '🏠 Fachada' },
  { valor: 'interior',   label: '🛋️ Interior' },
  { valor: 'estrutura',  label: '🏗️ Estrutura' },
  { valor: 'acabamento', label: '🎨 Acabamento' },
  { valor: 'outros',     label: '📷 Outros' },
]

export default function ObraPublica() {

  const { id }         = useParams<{ id: string }>()
  const searchParams   = useSearchParams()
  const token          = searchParams.get('token')

  const [obra,           setObra]           = useState<any>(null)
  const [fotos,          setFotos]          = useState<any[]>([])
  const [etapas,         setEtapas]         = useState<any[]>([])
  const [medicoes,       setMedicoes]       = useState<Record<string, any[]>>({})
  const [loading,        setLoading]        = useState(true)
  const [acesso,         setAcesso]         = useState(false)
  const [fotoExpandida,  setFotoExpandida]  = useState<string | null>(null)
  const [tipoAtivo,      setTipoAtivo]      = useState('todos')
  const [abaAtiva,       setAbaAtiva]       = useState<'fotos' | 'etapas'>('fotos')

  useEffect(() => {
    if (id && token) carregar()
  }, [id, token])

  async function carregar() {
    try {
      // Busca obra e valida token
      const { data: obraData } = await supabase
        .from('obras')
        .select('id, nome, cliente, endereco, valor, percentual_concluido, status, data_inicio, data_previsao, data_conclusao, token_publico')
        .eq('id', Number(id))
        .maybeSingle()

      if (!obraData || obraData.token_publico !== token) {
        setLoading(false)
        return
      }

      setObra(obraData)
      setAcesso(true)

      // Busca fotos, etapas e medições
      const [{ data: fotosData }, { data: etapasData }, { data: medicoesData }] = await Promise.all([
        supabase.from('obra_fotos').select('*').eq('obra_id', Number(id)).order('created_at', { ascending: false }),
        supabase.from('obra_etapas').select('*').eq('obra_id', Number(id)).order('ordem', { ascending: true }),
        supabase.from('etapa_medicoes').select('*').eq('obra_id', Number(id)).order('data', { ascending: true }),
      ])

      setFotos(fotosData || [])
      setEtapas(etapasData || [])

      const medPorEtapa: Record<string, any[]> = {}
      ;(medicoesData || []).forEach((m: any) => {
        if (!medPorEtapa[m.etapa_id]) medPorEtapa[m.etapa_id] = []
        medPorEtapa[m.etapa_id].push(m)
      })
      setMedicoes(medPorEtapa)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={loadingBox}>
      <p style={{ color: '#64748b' }}>Carregando...</p>
    </div>
  )

  if (!acesso) return (
    <div style={loadingBox}>
      <p style={{ fontSize: 40, marginBottom: 16 }}>🔒</p>
      <h2 style={{ fontWeight: 800, color: '#0f172a' }}>Acesso não autorizado</h2>
      <p style={{ color: '#64748b', marginTop: 8 }}>Link inválido ou expirado.</p>
    </div>
  )

  const perc        = Number(obra.percentual_concluido || 0)
  const corProgresso = perc < 30 ? '#ef4444' : perc < 70 ? '#f59e0b' : '#22c55e'
  const fotosFiltradas = tipoAtivo === 'todos' ? fotos : fotos.filter(f => f.tipo === tipoAtivo)
  const totalPesos  = etapas.reduce((a, e) => a + Number(e.peso || 0), 0)

  return (
    <div style={page}>

      {/* CABEÇALHO */}
      <div style={header}>
        <div style={headerInner}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>{obra.nome}</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              {obra.cliente}{obra.endereco ? ` · ${obra.endereco}` : ''}
            </p>
          </div>
          <div style={statusBadge(obra.status)}>
            {obra.status === 'concluida' ? '✅ Concluída' : '🔄 Em andamento'}
          </div>
        </div>
      </div>

      <div style={container}>

        {/* PROGRESSO GLOBAL */}
        <div style={progressoCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>📐 Progresso da Obra</p>
              {obra.data_inicio && (
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Início: {new Date(obra.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}
                  {obra.data_previsao && ` · Previsão: ${new Date(obra.data_previsao + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                </p>
              )}
              {obra.data_conclusao && (
                <p style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                  ✅ Concluída em {new Date(obra.data_conclusao + 'T12:00:00').toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 36, fontWeight: 900, color: corProgresso, lineHeight: 1 }}>{perc}%</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>concluído</p>
            </div>
          </div>
          <div style={{ height: 16, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${perc}%`, background: corProgresso, borderRadius: 999, transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* ABAS */}
        <div style={abaContainer}>
          <button onClick={() => setAbaAtiva('fotos')} style={abaAtiva === 'fotos' ? abaAtivaStyle : abaInativaStyle}>
            📸 Fotos ({fotos.length})
          </button>
          <button onClick={() => setAbaAtiva('etapas')} style={abaAtiva === 'etapas' ? abaAtivaStyle : abaInativaStyle}>
            📋 Cronograma ({etapas.length} etapas)
          </button>
        </div>

        {/* ABA FOTOS */}
        {abaAtiva === 'fotos' && (
          <div>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <button onClick={() => setTipoAtivo('todos')} style={tipoAtivo === 'todos' ? filtroAtivo : filtroInativo}>
                Todas ({fotos.length})
              </button>
              {TIPOS.map(t => {
                const qtd = fotos.filter(f => f.tipo === t.valor).length
                if (qtd === 0) return null
                return (
                  <button key={t.valor} onClick={() => setTipoAtivo(t.valor)}
                    style={tipoAtivo === t.valor ? filtroAtivo : filtroInativo}>
                    {t.label} ({qtd})
                  </button>
                )
              })}
            </div>

            {fotosFiltradas.length === 0
              ? <div style={vazioCard}><p style={{ fontSize: 36 }}>📷</p><p style={{ color: '#94a3b8' }}>Nenhuma foto registrada ainda</p></div>
              : (
                <div style={grid}>
                  {fotosFiltradas.map(foto => (
                    <div key={foto.id} style={cardFoto} onClick={() => setFotoExpandida(foto.url)}>
                      <img src={foto.url} alt={foto.tipo} style={imgStyle} />
                      <div style={fotoInfo}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                          {TIPOS.find(t => t.valor === foto.tipo)?.label || foto.tipo}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          {new Date(foto.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ABA CRONOGRAMA */}
        {abaAtiva === 'etapas' && (
          <div>
            {etapas.length === 0
              ? <div style={vazioCard}><p style={{ fontSize: 36 }}>📋</p><p style={{ color: '#94a3b8' }}>Nenhuma etapa cadastrada ainda</p></div>
              : etapas.map(etapa => {
                const corStatus = etapa.status === 'concluida' ? '#16a34a'
                  : etapa.status === 'em_andamento' ? '#f59e0b' : '#94a3b8'
                const medEtapa = medicoes[etapa.id] || []

                return (
                  <div key={etapa.id} style={{ ...etapaCard, borderLeft: `4px solid ${corStatus}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{etapa.nome}</p>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: corStatus + '20', color: corStatus }}>
                            {etapa.status === 'concluida' ? '✅ Concluída' : etapa.status === 'em_andamento' ? '🔄 Em andamento' : '⏳ Aguardando'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#64748b', marginTop: 4 }}>
                          {etapa.data_inicio    && <span>Início: {new Date(etapa.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                          {etapa.data_prevista  && <span>Previsto: {new Date(etapa.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                          {etapa.data_conclusao && <span style={{ color: '#16a34a' }}>Concluído: {new Date(etapa.data_conclusao + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 24, fontWeight: 900, color: corStatus }}>{etapa.percentual}%</span>
                    </div>

                    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ height: '100%', width: `${etapa.percentual}%`, background: corStatus, borderRadius: 999 }} />
                    </div>

                    {/* MEDIÇÕES */}
                    {medEtapa.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                          Medições ({medEtapa.length})
                        </p>
                        {medEtapa.map((m: any) => (
                          <div key={m.id} style={medicaoItem}>
                            <div style={{ flex: 1 }}>
                              {m.descricao && <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{m.descricao}</p>}
                              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                {new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </p>
                              {m.foto_url && (
                                <img
                                  src={m.foto_url}
                                  alt="foto medição"
                                  onClick={() => setFotoExpandida(m.foto_url)}
                                  style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginTop: 8, cursor: 'pointer', border: '1px solid #e2e8f0' }}
                                />
                              )}
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#16a34a', marginLeft: 12 }}>+{m.percentual}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            }
          </div>
        )}

      </div>

      {/* RODAPÉ */}
      <div style={rodape}>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>
          Acompanhamento de obra · Atualizado em {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* MODAL FOTO */}
      {fotoExpandida && (
        <div style={modalOverlay} onClick={() => setFotoExpandida(null)}>
          <div style={{ position: 'relative' }}>
            <img src={fotoExpandida} style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 12, display: 'block' }} alt="foto" />
            <button style={modalClose} onClick={() => setFotoExpandida(null)}>✕</button>
          </div>
        </div>
      )}

    </div>
  )
}

/* ── ESTILOS ── */
const page: React.CSSProperties        = { minHeight: '100vh', background: '#f8fafc' }
const loadingBox: React.CSSProperties  = { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }
const header: React.CSSProperties      = { background: '#0f172a', padding: '24px 0' }
const headerInner: React.CSSProperties = { maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }
const container: React.CSSProperties   = { maxWidth: 900, margin: '0 auto', padding: '24px 24px' }
const progressoCard: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }
const abaContainer: React.CSSProperties = { display: 'flex', gap: 0, marginBottom: 20, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
const abaAtivaStyle: React.CSSProperties  = { flex: 1, padding: '14px 0', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }
const abaInativaStyle: React.CSSProperties = { flex: 1, padding: '14px 0', border: 'none', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }
const filtroAtivo: React.CSSProperties   = { background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const filtroInativo: React.CSSProperties = { background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer' }
const grid: React.CSSProperties         = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }
const cardFoto: React.CSSProperties     = { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer' }
const imgStyle: React.CSSProperties     = { width: '100%', height: 190, objectFit: 'cover', display: 'block' }
const fotoInfo: React.CSSProperties     = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }
const vazioCard: React.CSSProperties    = { textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 14, marginBottom: 16 }
const etapaCard: React.CSSProperties    = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 12 }
const medicaoItem: React.CSSProperties  = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 6, border: '1px solid #e2e8f0' }
const rodape: React.CSSProperties       = { textAlign: 'center', padding: '24px', borderTop: '1px solid #e2e8f0', marginTop: 20 }
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }
const modalClose: React.CSSProperties   = { position: 'absolute', top: -14, right: -14, background: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 14, cursor: 'pointer', fontWeight: 700 }

const statusBadge = (status: string): React.CSSProperties => ({
  background: status === 'concluida' ? '#dcfce7' : '#dbeafe',
  color:      status === 'concluida' ? '#15803d' : '#1d4ed8',
  padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700
})
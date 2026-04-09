'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

type Orcamento = {
  id: string
  cliente_nome: string
  valor_total: number
  status?: string
  created_at: string
  telefone?: string
  token?: string
  descricao?: string
  obra_id?: number | null
}

export default function OrcamentosPage() {

  const { empresaId, limites, loading: loadingEmpresa } = useEmpresa()
  const [lista,     setLista]     = useState<Orcamento[]>([])
  const [loading,   setLoading]   = useState(true)
  const [aprovando, setAprovando] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setLista(data || [])
    } catch (err) {
      console.error(err)
      alert('Erro ao carregar orçamentos')
    } finally {
      setLoading(false)
    }
  }

  async function aprovarEGerarObra(o: Orcamento) {
    if (!confirm(`Aprovar orçamento de ${o.cliente_nome} e gerar obra automaticamente?`)) return
    setAprovando(o.id)
    try {
      await supabase.from('orcamentos').update({ status: 'aprovado' }).eq('id', o.id)

      const { data: novaObra, error: errObra } = await supabase
        .from('obras')
        .insert({
          nome:                 `Obra — ${o.cliente_nome}`,
          cliente:              o.cliente_nome,
          valor:                o.valor_total,
          empresa_id:           empresaId,
          orcamento_id:         o.id,
          percentual_concluido: 0,
        })
        .select().single()

      if (errObra || !novaObra) throw errObra || new Error('Obra não criada')

      // Vincula obra_id ao orçamento
      await supabase.from('orcamentos').update({ obra_id: novaObra.id }).eq('id', o.id)

      await carregar()

      const irParaObra = confirm(
        `✅ Aprovado!\n\nObra "${novaObra.nome}" criada com sucesso.\n\nDeseja ir para a obra agora?`
      )
      if (irParaObra) router.push(`/obras/${novaObra.id}`)

    } catch (err) {
      console.error('Erro ao aprovar:', err)
      alert('Erro ao aprovar orçamento. Tente novamente.')
    } finally {
      setAprovando(null)
    }
  }

  async function recusar(id: string) {
    if (!confirm('Marcar orçamento como recusado?')) return
    await supabase.from('orcamentos').update({ status: 'recusado' }).eq('id', id)
    carregar()
  }

  function copiarLink(id: string, token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/orcamento-publico/${id}?token=${token}`)
    alert('Link copiado!')
  }

  function enviarCliente(id: string, telefone: string, token: string) {
    const link  = `${window.location.origin}/orcamento-publico/${id}?token=${token}`
    const texto = `Olá! Segue sua proposta:\n${link}`
    window.open(telefone ? `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`)
  }

  const limite        = limites?.orcamentos
  const atingiuLimite = limite !== undefined && limite !== Infinity && lista.length >= limite

  if (loadingEmpresa || loading) return <p style={{ padding: 40 }}>Carregando...</p>

  // ── SEPARAR POR SEÇÃO ──
  const pendentes      = lista.filter(o => (!o.status || o.status === 'pendente'))
  const aprovadosSemObra = lista.filter(o => o.status === 'aprovado' && !o.obra_id)
  const comObra        = lista.filter(o => o.status === 'aprovado' && !!o.obra_id)
  const recusados      = lista.filter(o => o.status === 'recusado')

  return (
    <div style={container}>

      {atingiuLimite && (
        <div style={alertaLimite}>
          🚨 Limite do plano atingido
          <button style={btnUpgrade} onClick={() => router.push('/planos')}>Fazer upgrade</button>
        </div>
      )}

      <div style={header}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>📑 Orçamentos</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>
            {pendentes.length} pendente(s) · {aprovadosSemObra.length} aprovado(s) · {comObra.length} com obra · {recusados.length} recusado(s)
          </p>
        </div>
        <button
          style={btnNovo}
          onClick={() => {
            if (atingiuLimite) { alert('Limite atingido. Faça upgrade para continuar.'); return }
            router.push('/orcamentos/novo')
          }}
        >
          + Novo Orçamento
        </button>
      </div>

      {lista.length === 0 && (
        <div style={vazioCard}>
          <p style={{ fontSize: 32 }}>📋</p>
          <p style={{ fontWeight: 600, color: '#0f172a' }}>Nenhum orçamento criado ainda</p>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Crie seu primeiro orçamento para enviar ao cliente</p>
        </div>
      )}

      {/* ── PENDENTES ── */}
      {pendentes.length > 0 && (
        <Secao titulo="⏳ Aguardando resposta" qtd={pendentes.length}>
          {pendentes.map(o => (
            <CardOrcamento key={o.id} o={o} aprovando={aprovando}
              onAprovar={() => aprovarEGerarObra(o)}
              onRecusar={() => recusar(o.id)}
              onVer={() => router.push(`/orcamentos/${o.id}`)}
              onEditar={() => router.push(`/orcamentos/editar/${o.id}`)}
              onLink={() => o.token && copiarLink(o.id, o.token)}
              onWhats={() => o.token && enviarCliente(o.id, o.telefone || '', o.token)}
            />
          ))}
        </Secao>
      )}

      {/* ── APROVADOS SEM OBRA ── */}
      {aprovadosSemObra.length > 0 && (
        <Secao titulo="✅ Aprovados" qtd={aprovadosSemObra.length} cor="#16a34a">
          {aprovadosSemObra.map(o => (
            <CardOrcamento key={o.id} o={o} aprovando={aprovando}
              onVer={() => router.push(`/orcamentos/${o.id}`)}
              onEditar={() => router.push(`/orcamentos/editar/${o.id}`)}
              onLink={() => o.token && copiarLink(o.id, o.token)}
              onWhats={() => o.token && enviarCliente(o.id, o.telefone || '', o.token)}
            />
          ))}
        </Secao>
      )}

      {/* ── COM OBRA GERADA ── */}
      {comObra.length > 0 && (
        <Secao titulo="🏗️ Obra gerada" qtd={comObra.length} cor="#2563eb">
          {comObra.map(o => (
            <CardOrcamento key={o.id} o={o} aprovando={aprovando}
              onVer={() => router.push(`/orcamentos/${o.id}`)}
              onEditar={() => router.push(`/orcamentos/editar/${o.id}`)}
              onLink={() => o.token && copiarLink(o.id, o.token)}
              onWhats={() => o.token && enviarCliente(o.id, o.telefone || '', o.token)}
              onVerObra={() => router.push(`/obras/${o.obra_id}`)}
            />
          ))}
        </Secao>
      )}

      {/* ── RECUSADOS ── */}
      {recusados.length > 0 && (
        <Secao titulo="❌ Recusados" qtd={recusados.length} cor="#dc2626">
          {recusados.map(o => (
            <CardOrcamento key={o.id} o={o} aprovando={aprovando}
              onVer={() => router.push(`/orcamentos/${o.id}`)}
              onEditar={() => router.push(`/orcamentos/editar/${o.id}`)}
              onLink={() => o.token && copiarLink(o.id, o.token)}
              onWhats={() => o.token && enviarCliente(o.id, o.telefone || '', o.token)}
            />
          ))}
        </Secao>
      )}

    </div>
  )
}

/* ── SEÇÃO ── */
function Secao({ titulo, qtd, cor, children }: any) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: cor || '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          {titulo}
        </h2>
        <span style={{ background: (cor || '#64748b') + '20', color: cor || '#64748b', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
          {qtd}
        </span>
      </div>
      <div style={grid}>{children}</div>
    </div>
  )
}

/* ── CARD ── */
function CardOrcamento({ o, aprovando, onAprovar, onRecusar, onVer, onEditar, onLink, onWhats, onVerObra }: any) {
  const estaAprovando = aprovando === o.id
  const f = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div style={cardStyle(o.status, !!o.obra_id)}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{o.cliente_nome}</h3>
          <span style={badgeStyle(o.status, !!o.obra_id)}>
            {o.obra_id ? '🏗️ com obra' : o.status || 'pendente'}
          </span>
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', marginTop: 6 }}>{f(o.valor_total)}</p>
        {o.descricao && <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{o.descricao}</p>}
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Botão Ver Obra — só para orçamentos com obra */}
      {o.obra_id && onVerObra && (
        <button onClick={onVerObra} style={btnVerObra}>
          🏗️ Ver Obra →
        </button>
      )}

      {/* Botões aprovar/recusar — só pendentes */}
      {(!o.status || o.status === 'pendente') && onAprovar && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onAprovar} style={btnAprovar} disabled={estaAprovando}>
            {estaAprovando ? '⏳ Gerando...' : '✅ Aprovar e Gerar Obra'}
          </button>
          <button onClick={onRecusar} style={btnRecusar}>❌</button>
        </div>
      )}

      {/* Ações secundárias */}
      <div style={acoesSecundarias}>
        <button onClick={onLink}   style={btnSec}>🔗 Link</button>
        <button onClick={onVer}    style={btnSec}>👁 Ver</button>
        <button onClick={onEditar} style={btnSec}>✏️ Editar</button>
        <button onClick={onWhats}  style={btnWhats}>WhatsApp</button>
      </div>
    </div>
  )
}

/* ── HELPERS DE ESTILO ── */
function badgeStyle(status?: string, temObra?: boolean): React.CSSProperties {
  if (temObra)                 return { background: '#dbeafe', color: '#2563eb', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }
  if (status === 'aprovado')   return { background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }
  if (status === 'recusado')   return { background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }
  return { background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }
}

function cardStyle(status?: string, temObra?: boolean): React.CSSProperties {
  const base: React.CSSProperties = { background: '#fff', padding: 20, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }
  if (temObra)               return { ...base, borderLeft: '4px solid #2563eb' }
  if (status === 'aprovado') return { ...base, borderLeft: '4px solid #22c55e' }
  if (status === 'recusado') return { ...base, borderLeft: '4px solid #ef4444' }
  return { ...base, borderLeft: '4px solid #f59e0b' }
}

const container: React.CSSProperties    = { padding: 24 }
const header: React.CSSProperties       = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }
const grid: React.CSSProperties         = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }
const acoesSecundarias: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 10, borderTop: '1px solid #f1f5f9' }
const btnNovo: React.CSSProperties      = { background: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }
const btnAprovar: React.CSSProperties   = { flex: 1, background: '#16a34a', color: '#fff', border: 'none', padding: '10px 0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }
const btnRecusar: React.CSSProperties   = { background: '#fee2e2', color: '#dc2626', border: 'none', padding: '10px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }
const btnVerObra: React.CSSProperties   = { background: '#dbeafe', color: '#2563eb', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, textAlign: 'left' }
const btnSec: React.CSSProperties       = { background: '#f1f5f9', color: '#374151', padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12 }
const btnWhats: React.CSSProperties     = { background: '#22c55e', color: '#fff', padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12 }
const alertaLimite: React.CSSProperties = { background: '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }
const btnUpgrade: React.CSSProperties   = { background: '#f59e0b', color: '#fff', padding: '6px 10px', border: 'none', borderRadius: 6, cursor: 'pointer' }
const vazioCard: React.CSSProperties    = { textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
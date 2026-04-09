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
}

export default function OrcamentosPage() {

  const { empresaId, limites, loading: loadingEmpresa } = useEmpresa()
  const [lista,    setLista]    = useState<Orcamento[]>([])
  const [loading,  setLoading]  = useState(true)
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
      // 1️⃣ Atualiza status do orçamento para aprovado
      const { error: errStatus } = await supabase
        .from('orcamentos')
        .update({ status: 'aprovado' })
        .eq('id', o.id)

      if (errStatus) throw errStatus

      // 2️⃣ Cria a obra automaticamente com dados do orçamento
      const { data: novaObra, error: errObra } = await supabase
        .from('obras')
        .insert({
          nome:           `Obra — ${o.cliente_nome}`,
          cliente:        o.cliente_nome,
          valor:          o.valor_total,
          empresa_id:     empresaId,
          orcamento_id:   o.id, // vínculo com o orçamento de origem
          percentual_concluido: 0,
        })
        .select()
        .single()

      if (errObra || !novaObra) throw errObra || new Error('Obra não criada')

      await carregar()

      // 3️⃣ Pergunta se quer ir para a obra criada
      const irParaObra = confirm(
        `✅ Orçamento aprovado!\n\nObra "${novaObra.nome}" criada com sucesso.\n\nDeseja ir para a obra agora?`
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

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function copiarLink(id: string, token: string) {
    const link = `${window.location.origin}/orcamento-publico/${id}?token=${token}`
    navigator.clipboard.writeText(link)
    alert('Link copiado!')
  }

  function enviarCliente(id: string, telefone: string, token: string) {
    const link  = `${window.location.origin}/orcamento-publico/${id}?token=${token}`
    const texto = `Olá! Segue sua proposta:\n${link}`
    const url   = telefone
      ? `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url)
  }

  const limite       = limites?.orcamentos
  const atingiuLimite = limite !== undefined && limite !== Infinity && lista.length >= limite

  if (loadingEmpresa || loading) return <p style={{ padding: 40 }}>Carregando...</p>

  // Separar por status para melhor visualização
  const pendentes  = lista.filter(o => !o.status || o.status === 'pendente')
  const aprovados  = lista.filter(o => o.status === 'aprovado')
  const recusados  = lista.filter(o => o.status === 'recusado')

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
            {pendentes.length} pendente(s) · {aprovados.length} aprovado(s) · {recusados.length} recusado(s)
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
        <div style={secaoWrapper}>
          <h2 style={secaoTitulo}>⏳ Aguardando resposta ({pendentes.length})</h2>
          <div style={grid}>
            {pendentes.map(o => (
              <CardOrcamento
                key={o.id}
                o={o}
                aprovando={aprovando}
                onAprovar={() => aprovarEGerarObra(o)}
                onRecusar={() => recusar(o.id)}
                onVer={() => router.push(`/orcamentos/${o.id}`)}
                onEditar={() => router.push(`/orcamentos/editar/${o.id}`)}
                onLink={() => o.token && copiarLink(o.id, o.token)}
                onWhats={() => o.token && enviarCliente(o.id, o.telefone || '', o.token)}
                formatarMoeda={formatarMoeda}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── APROVADOS ── */}
      {aprovados.length > 0 && (
        <div style={secaoWrapper}>
          <h2 style={secaoTitulo}>✅ Aprovados ({aprovados.length})</h2>
          <div style={grid}>
            {aprovados.map(o => (
              <CardOrcamento
                key={o.id}
                o={o}
                aprovando={aprovando}
                onVer={() => router.push(`/orcamentos/${o.id}`)}
                onEditar={() => router.push(`/orcamentos/editar/${o.id}`)}
                onLink={() => o.token && copiarLink(o.id, o.token)}
                onWhats={() => o.token && enviarCliente(o.id, o.telefone || '', o.token)}
                formatarMoeda={formatarMoeda}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── RECUSADOS ── */}
      {recusados.length > 0 && (
        <div style={secaoWrapper}>
          <h2 style={secaoTitulo}>❌ Recusados ({recusados.length})</h2>
          <div style={grid}>
            {recusados.map(o => (
              <CardOrcamento
                key={o.id}
                o={o}
                aprovando={aprovando}
                onVer={() => router.push(`/orcamentos/${o.id}`)}
                onEditar={() => router.push(`/orcamentos/editar/${o.id}`)}
                onLink={() => o.token && copiarLink(o.id, o.token)}
                onWhats={() => o.token && enviarCliente(o.id, o.telefone || '', o.token)}
                formatarMoeda={formatarMoeda}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

/* ── CARD COMPONENTE ── */
function CardOrcamento({ o, aprovando, onAprovar, onRecusar, onVer, onEditar, onLink, onWhats, formatarMoeda }: any) {
  const estaAprovando = aprovando === o.id

  return (
    <div style={cardStyle(o.status)}>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{o.cliente_nome}</h3>
          <span style={badgeStyle(o.status)}>{o.status || 'pendente'}</span>
        </div>

        <p style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', marginTop: 6 }}>
          {formatarMoeda(o.valor_total)}
        </p>

        {o.descricao && (
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{o.descricao}</p>
        )}

        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
          {new Date(o.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* BOTÕES DE AÇÃO PRINCIPAL — só para pendentes */}
      {(!o.status || o.status === 'pendente') && onAprovar && (
        <div style={acoesPrincipais}>
          <button
            onClick={onAprovar}
            style={btnAprovar}
            disabled={estaAprovando}
          >
            {estaAprovando ? '⏳ Gerando...' : '✅ Aprovar e Gerar Obra'}
          </button>
          <button onClick={onRecusar} style={btnRecusar}>
            ❌ Recusar
          </button>
        </div>
      )}

      {/* AÇÕES SECUNDÁRIAS */}
      <div style={acoesSecundarias}>
        <button onClick={onLink}   style={btnSec}>🔗 Link</button>
        <button onClick={onVer}    style={btnSec}>👁 Ver</button>
        <button onClick={onEditar} style={btnSec}>✏️ Editar</button>
        <button onClick={onWhats}  style={btnWhats}>WhatsApp</button>
      </div>

    </div>
  )
}

/* ── ESTILOS ── */

function badgeStyle(status?: string): React.CSSProperties {
  if (status === 'aprovado') return { background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }
  if (status === 'recusado') return { background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }
  return { background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }
}

function cardStyle(status?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    background: '#fff', padding: 20, borderRadius: 14,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', gap: 14,
    borderLeft: '4px solid #e2e8f0'
  }
  if (status === 'aprovado') return { ...base, borderLeft: '4px solid #22c55e' }
  if (status === 'recusado') return { ...base, borderLeft: '4px solid #ef4444' }
  return { ...base, borderLeft: '4px solid #f59e0b' }
}

const container: React.CSSProperties = { padding: 24 }

const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  alignItems: 'flex-start', marginBottom: 24
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: 16
}

const secaoWrapper: React.CSSProperties = { marginBottom: 32 }

const secaoTitulo: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14
}

const acoesPrincipais: React.CSSProperties = { display: 'flex', gap: 8 }

const acoesSecundarias: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 6,
  paddingTop: 12, borderTop: '1px solid #f1f5f9'
}

const btnNovo: React.CSSProperties = {
  background: '#2563eb', color: '#fff',
  padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontWeight: 600, fontSize: 14
}

const btnAprovar: React.CSSProperties = {
  flex: 1, background: '#16a34a', color: '#fff',
  border: 'none', padding: '10px 0', borderRadius: 8,
  fontWeight: 700, cursor: 'pointer', fontSize: 13
}

const btnRecusar: React.CSSProperties = {
  background: '#fee2e2', color: '#dc2626',
  border: 'none', padding: '10px 12px', borderRadius: 8,
  fontWeight: 600, cursor: 'pointer', fontSize: 13
}

const btnSec: React.CSSProperties = {
  background: '#f1f5f9', color: '#374151',
  padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12
}

const btnWhats: React.CSSProperties = {
  background: '#22c55e', color: '#fff',
  padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12
}

const alertaLimite: React.CSSProperties = {
  background: '#fef3c7', padding: 12, borderRadius: 8,
  marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10
}

const btnUpgrade: React.CSSProperties = {
  background: '#f59e0b', color: '#fff',
  padding: '6px 10px', border: 'none', borderRadius: 6, cursor: 'pointer'
}

const vazioCard: React.CSSProperties = {
  textAlign: 'center', padding: '48px 20px',
  background: '#fff', borderRadius: 14,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
}
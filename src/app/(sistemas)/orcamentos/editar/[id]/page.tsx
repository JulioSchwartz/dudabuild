'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import TabelaOrcamento from '@/components/TabelaOrcamento'

export default function EditarOrcamento() {

  const { id }        = useParams<{ id: string }>()
  const router        = useRouter()
  const { empresaId } = useEmpresa()

  const [cliente,     setCliente]     = useState('')
  const [descricao,   setDescricao]   = useState('')
  const [token,       setToken]       = useState('')
  const [telefone,    setTelefone]    = useState('')
  const [status,      setStatus]      = useState('')
  const [itens,       setItens]       = useState<any[]>([])
  const [loading,     setLoading]     = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [aprovando,   setAprovando]   = useState(false)

  useEffect(() => {
    if (id) carregar()
  }, [id])

  async function carregar() {
    try {
      const { data: orc, error } = await supabase
        .from('orcamentos').select('*').eq('id', id).maybeSingle()

      if (error) throw error
      if (!orc)  throw new Error('Orçamento não encontrado')

      setCliente(orc.cliente_nome  || '')
      setDescricao(orc.descricao   || '')
      setToken(orc.token           || '')
      setTelefone(orc.telefone     || '')
      setStatus(orc.status         || 'pendente')

      const { data: itensData, error: errItens } = await supabase
        .from('orcamento_itens').select('*').eq('orcamento_id', id)

      if (errItens) throw errItens
      setItens(itensData || [])

    } catch (err) {
      console.error('Erro ao carregar:', err)
      alert('Erro ao carregar orçamento')
      router.push('/orcamentos')
    } finally {
      setLoadingData(false)
    }
  }

  function atualizarItem(index: number, campo: string, valor: any) {
    const novos = [...itens]; novos[index][campo] = valor; setItens(novos)
  }
  function removerItem(index: number) { setItens(itens.filter((_, i) => i !== index)) }
  function adicionarItem() {
    setItens([...itens, { descricao: '', unidade: 'm²', quantidade: 1, material: 0, mao_obra: 0, equipamentos: 0 }])
  }
  function totalItem(i: any) {
    return (Number(i.material || 0) + Number(i.mao_obra || 0) + Number(i.equipamentos || 0)) * Number(i.quantidade || 0)
  }
  function totalGeral() { return itens.reduce((a, i) => a + totalItem(i), 0) }

  async function salvar() {
    if (!cliente.trim()) return alert('Informe o nome do cliente')
    setLoading(true)
    try {
      const { error: errUpdate } = await supabase.from('orcamentos').update({
        cliente_nome: cliente.trim(), telefone: telefone.trim() || null,
        descricao: descricao.trim(), valor_total: totalGeral()
      }).eq('id', id)
      if (errUpdate) throw errUpdate

      await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)
      await supabase.from('orcamento_itens').insert(itens.map(i => ({
        ...i, orcamento_id: id, valor_total: totalItem(i)
      })))

      alert('Atualizado com sucesso!')
      router.push('/orcamentos')
    } catch (err) {
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function aprovarEGerarObra() {
    if (!confirm(`Aprovar orçamento de ${cliente} e gerar obra automaticamente?`)) return

    setAprovando(true)
    try {
      // 1️⃣ Marca como aprovado
      const { error: errStatus } = await supabase
        .from('orcamentos').update({ status: 'aprovado' }).eq('id', id)
      if (errStatus) throw errStatus

      // 2️⃣ Cria a obra
      const { data: novaObra, error: errObra } = await supabase
        .from('obras')
        .insert({
          nome:                 `Obra — ${cliente}`,
          cliente:              cliente,
          valor:                totalGeral(),
          empresa_id:           empresaId,
          orcamento_id:         id,
          percentual_concluido: 0,
        })
        .select()
        .single()

      if (errObra || !novaObra) throw errObra || new Error('Obra não criada')

      setStatus('aprovado')

      const irParaObra = confirm(
        `✅ Orçamento aprovado!\n\nObra "${novaObra.nome}" criada com sucesso.\n\nDeseja ir para a obra agora?`
      )
      if (irParaObra) router.push(`/obras/${novaObra.id}`)
      else router.push('/orcamentos')

    } catch (err) {
      console.error(err)
      alert('Erro ao aprovar. Tente novamente.')
    } finally {
      setAprovando(false)
    }
  }

  function gerarPDF() {
    import('html2pdf.js').then(({ default: html2pdf }) => {
      const element = document.createElement('div')
      element.innerHTML = `
        <div style="font-family:Arial;padding:40px;color:#0f172a">
          <h1>DudaBuild Engenharia</h1>
          <h2>Proposta Comercial</h2>
          <p><strong>Cliente:</strong> ${cliente}</p>
          <p><strong>Descrição:</strong> ${descricao}</p>
          <hr/>
          ${itens.map(i => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0">
              <span>${i.descricao || '—'}</span>
              <strong>${format(totalItem(i))}</strong>
            </div>
          `).join('')}
          <div style="margin-top:30px;padding:20px;background:#16a34a;color:#fff;border-radius:8px;text-align:center">
            <h2>Total: ${format(totalGeral())}</h2>
          </div>
        </div>
      `
      html2pdf().from(element).set({
        margin: 0,
        filename: `Proposta_${cliente.replace(/\s+/g, '_')}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save()
    })
  }

  function enviarWhatsApp() {
    if (!token) return alert('Token não encontrado.')
    const link  = `${window.location.origin}/orcamento-publico/${id}?token=${token}`
    const texto = `Olá! Segue sua proposta:\n${link}`
    const url   = telefone
      ? `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url)
  }

  if (loadingData) return <p style={{ padding: 24 }}>Carregando...</p>

  const jaAprovado = status === 'aprovado'
  const jaRecusado = status === 'recusado'

  return (
    <div style={container}>

      <button onClick={() => router.back()} style={btnVoltar}>← Voltar</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h1 style={titulo}>✏️ Editar Orçamento</h1>
        <span style={badgeStyle(status)}>{status || 'pendente'}</span>
      </div>

      {/* ── BANNER APROVAÇÃO ── */}
      {jaAprovado && (
        <div style={bannerAprovado}>
          ✅ Este orçamento foi aprovado e uma obra foi gerada automaticamente.
          <button onClick={() => router.push('/obras')} style={btnVerObras}>Ver Obras →</button>
        </div>
      )}

      {/* ── BOTÃO APROVAR — só para pendentes ── */}
      {!jaAprovado && !jaRecusado && (
        <div style={aprovacaoBox}>
          <div>
            <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
              Cliente aceitou a proposta?
            </p>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
              Ao aprovar, uma obra será criada automaticamente com os dados deste orçamento.
            </p>
          </div>
          <button
            onClick={aprovarEGerarObra}
            style={btnAprovar}
            disabled={aprovando}
          >
            {aprovando ? '⏳ Gerando obra...' : '✅ Aprovar e Gerar Obra'}
          </button>
        </div>
      )}

      {/* FORMULÁRIO */}
      <div style={card}>
        <div style={formGroup}>
          <label style={label}>Cliente *</label>
          <input value={cliente} onChange={e => setCliente(e.target.value)} style={input} />
        </div>
        <div style={formGroup}>
          <label style={label}>Telefone (WhatsApp)</label>
          <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="5511999999999" style={input} />
        </div>
        <div style={formGroup}>
          <label style={label}>Descrição</label>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} style={input} />
        </div>
      </div>

      <div style={card}>
        <TabelaOrcamento itens={itens} atualizarItem={atualizarItem} removerItem={removerItem} />
        <button onClick={adicionarItem} style={btnAdd}>+ Adicionar Item</button>
      </div>

      <div style={totalBox}>
        Total: <strong style={{ color: '#16a34a' }}>{format(totalGeral())}</strong>
      </div>

      <div style={acoes}>
        <button onClick={salvar}          style={btnPrim}  disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={gerarPDF}        style={btnPdf}>📄 PDF</button>
        <button onClick={enviarWhatsApp}  style={btnWhats}>WhatsApp</button>
      </div>

    </div>
  )
}

function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function badgeStyle(status?: string): React.CSSProperties {
  if (status === 'aprovado') return { background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }
  if (status === 'recusado') return { background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }
  return { background: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }
}

const container: React.CSSProperties  = { maxWidth: 1100, margin: '0 auto', padding: 24 }
const titulo: React.CSSProperties     = { fontSize: 24, fontWeight: 800 }
const card: React.CSSProperties       = { background: '#fff', padding: 20, borderRadius: 12, marginTop: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
const formGroup: React.CSSProperties  = { marginBottom: 14 }
const label: React.CSSProperties      = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }
const input: React.CSSProperties      = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }
const totalBox: React.CSSProperties   = { fontSize: 22, fontWeight: 700, marginTop: 20 }
const acoes: React.CSSProperties      = { display: 'flex', gap: 10, marginTop: 20 }
const btnVoltar: React.CSSProperties  = { background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 12, color: '#2563eb' }
const btnAdd: React.CSSProperties     = { marginTop: 15, padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }
const btnPrim: React.CSSProperties    = { background: '#2563eb', color: '#fff', padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }
const btnPdf: React.CSSProperties     = { background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }
const btnWhats: React.CSSProperties   = { background: '#22c55e', color: '#fff', padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }

const aprovacaoBox: React.CSSProperties = {
  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
  padding: '16px 20px', marginBottom: 20, marginTop: 8,
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap'
}
const btnAprovar: React.CSSProperties = {
  background: '#16a34a', color: '#fff', border: 'none',
  padding: '12px 20px', borderRadius: 8, fontWeight: 700,
  cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap'
}
const bannerAprovado: React.CSSProperties = {
  background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10,
  padding: '12px 16px', marginBottom: 20, fontWeight: 600,
  color: '#15803d', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
}
const btnVerObras: React.CSSProperties = {
  background: '#16a34a', color: '#fff', border: 'none',
  padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13
}
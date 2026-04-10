'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import { InputTelefone } from '@/components/InputFormatado'
import TabelaOrcamento from '@/components/TabelaOrcamento'

const itemMaterialVazio = () => ({
  tipo: 'material', codigo: '', descricao: '', unidade: 'm²',
  quantidade: 1, material: 0, mao_obra: 0, equipamentos: 0
})
const itemServicoVazio = () => ({
  tipo: 'servico', codigo: '', descricao: '', unidade: 'h',
  quantidade: 1, material: 0, mao_obra: 0, equipamentos: 0
})

export default function EditarOrcamento() {

  const { id }        = useParams<{ id: string }>()
  const router        = useRouter()
  const { empresaId } = useEmpresa()

  const [cliente,     setCliente]     = useState('')
  const [descricao,   setDescricao]   = useState('')
  const [token,       setToken]       = useState('')
  const [telefone,    setTelefone]    = useState('')
  const [status,      setStatus]      = useState('')
  const [materiais,   setMateriais]   = useState<any[]>([])
  const [servicos,    setServicos]    = useState<any[]>([])
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

      // Separa itens em materiais e serviços pelo campo mao_obra
      const todos = itensData || []
      const mats  = todos.filter(i => Number(i.material || 0) > 0 && Number(i.mao_obra || 0) === 0)
      const servs = todos.filter(i => Number(i.mao_obra || 0) > 0 || Number(i.equipamentos || 0) > 0)
      // Itens sem classificação clara vão para materiais
      const semClassificacao = todos.filter(i =>
        Number(i.material || 0) === 0 && Number(i.mao_obra || 0) === 0 && Number(i.equipamentos || 0) === 0
      )

      setMateriais(mats.length > 0 || semClassificacao.length > 0
        ? [...mats, ...semClassificacao].map(i => ({ ...i, tipo: 'material' }))
        : [itemMaterialVazio()])
      setServicos(servs.length > 0
        ? servs.map(i => ({ ...i, tipo: 'servico' }))
        : [itemServicoVazio()])

    } catch (err) {
      console.error('Erro ao carregar:', err)
      alert('Erro ao carregar orçamento')
      router.push('/orcamentos')
    } finally {
      setLoadingData(false)
    }
  }

  function atualizarMaterial(index: number, campo: string, valor: any) {
    const novos = [...materiais]; novos[index][campo] = valor; setMateriais(novos)
  }
  function atualizarServico(index: number, campo: string, valor: any) {
    const novos = [...servicos]; novos[index][campo] = valor; setServicos(novos)
  }
  function removerMaterial(index: number) { setMateriais(materiais.filter((_, i) => i !== index)) }
  function removerServico(index: number)  { setServicos(servicos.filter((_, i) => i !== index)) }

  function totalItem(i: any) {
    return (Number(i.material || 0) + Number(i.mao_obra || 0) + Number(i.equipamentos || 0))
      * Number(i.quantidade || 0)
  }
  function totalGeral() {
    return [...materiais, ...servicos].reduce((a, i) => a + totalItem(i), 0)
  }

  async function salvar() {
    if (!cliente.trim()) return alert('Informe o nome do cliente')
    setLoading(true)
    try {
      const { error: errUpdate } = await supabase.from('orcamentos').update({
        cliente_nome: cliente.trim(),
        telefone:     telefone.trim() || null,
        descricao:    descricao.trim(),
        valor_total:  totalGeral()
      }).eq('id', id)
      if (errUpdate) throw errUpdate

      await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)

      const todosItens = [...materiais, ...servicos]
      await supabase.from('orcamento_itens').insert(todosItens.map(i => ({
        orcamento_id: id,
        codigo:       i.codigo       || null,
        descricao:    i.descricao    || null,
        unidade:      i.unidade      || null,
        quantidade:   Number(i.quantidade   || 1),
        material:     Number(i.material     || 0),
        mao_obra:     Number(i.mao_obra     || 0),
        equipamentos: Number(i.equipamentos || 0),
        valor_total:  totalItem(i),
      })))

      alert('Atualizado com sucesso!')
      router.push('/orcamentos')
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function aprovarEGerarObra() {
    if (!confirm(`Aprovar orçamento de ${cliente} e gerar obra automaticamente?`)) return
    setAprovando(true)
    try {
      const { error: errStatus } = await supabase
        .from('orcamentos').update({ status: 'aprovado' }).eq('id', id)
      if (errStatus) throw errStatus

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
        .select().single()

      if (errObra || !novaObra) throw errObra || new Error('Obra não criada')

      // Vincula obra ao orçamento
      await supabase.from('orcamentos').update({ obra_id: novaObra.id }).eq('id', id)

      setStatus('aprovado')
      const irParaObra = confirm(`✅ Aprovado!\n\nObra "${novaObra.nome}" criada.\n\nDeseja ir para a obra agora?`)
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
      const f   = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      const tMat  = materiais.reduce((a, i) => a + totalItem(i), 0)
      const tServ = servicos.reduce((a, i)  => a + totalItem(i), 0)
      const el  = document.createElement('div')
      el.innerHTML = `
        <div style="font-family:Arial;color:#0f172a">
          <div style="height:160px;background:#0f172a;color:white;display:flex;flex-direction:column;justify-content:center;align-items:center">
            <h1 style="margin:0;font-size:22px">DudaBuild Engenharia</h1>
            <p style="margin:6px 0 0;opacity:0.7">Proposta Comercial</p>
          </div>
          <div style="padding:36px">
            <p><strong>Cliente:</strong> ${cliente}</p>
            ${descricao ? `<p><strong>Descrição:</strong> ${descricao}</p>` : ''}
            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <hr style="margin:16px 0;border:none;border-top:1px solid #e2e8f0"/>
            <h3 style="color:#3b82f6">🧱 Materiais</h3>
            ${materiais.map(i => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px"><span>${i.descricao || '—'} (${i.quantidade} ${i.unidade})</span><strong>${f(totalItem(i))}</strong></div>`).join('')}
            <div style="text-align:right;padding:6px 0;font-weight:700;color:#3b82f6">Subtotal: ${f(tMat)}</div>
            <h3 style="color:#f59e0b;margin-top:16px">👷 Serviços</h3>
            ${servicos.map(i => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px"><span>${i.descricao || '—'} (${i.quantidade} ${i.unidade})</span><strong>${f(totalItem(i))}</strong></div>`).join('')}
            <div style="text-align:right;padding:6px 0;font-weight:700;color:#f59e0b">Subtotal: ${f(tServ)}</div>
            <div style="margin-top:24px;padding:20px;background:#16a34a;color:white;border-radius:8px;text-align:center">
              <p style="margin:0;opacity:0.8">Total do Investimento</p>
              <h1 style="margin:6px 0 0">${f(totalGeral())}</h1>
            </div>
            <div style="margin-top:40px"><p>______________________________________</p><p><strong>DudaBuild Engenharia</strong></p></div>
          </div>
        </div>`
      html2pdf().from(el).set({ margin: 0, filename: `Proposta_${cliente.replace(/\s+/g, '_')}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).save()
    })
  }

  function enviarWhatsApp() {
    if (!token) return alert('Token não encontrado.')
    const link  = `${window.location.origin}/orcamento-publico/${id}?token=${token}`
    const texto = `Olá! Segue sua proposta:\n${link}`
    window.open(telefone ? `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`)
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

      {jaAprovado && (
        <div style={bannerAprovado}>
          ✅ Este orçamento foi aprovado e uma obra foi gerada automaticamente.
          <button onClick={() => router.push('/obras')} style={btnVerObras}>Ver Obras →</button>
        </div>
      )}

      {!jaAprovado && !jaRecusado && (
        <div style={aprovacaoBox}>
          <div>
            <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>Cliente aceitou a proposta?</p>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Ao aprovar, uma obra será criada automaticamente.</p>
          </div>
          <button onClick={aprovarEGerarObra} style={btnAprovar} disabled={aprovando}>
            {aprovando ? '⏳ Gerando obra...' : '✅ Aprovar e Gerar Obra'}
          </button>
        </div>
      )}

      <div style={card}>
        <div style={formGroup}>
          <label style={label}>Cliente *</label>
          <input value={cliente} onChange={e => setCliente(e.target.value)} style={input} />
        </div>
        <div style={formGroup}>
          <label style={label}>Telefone (WhatsApp)</label>
          <InputTelefone value={telefone} onChange={setTelefone} style={input} />
        </div>
        <div style={formGroup}>
          <label style={label}>Descrição</label>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} style={input} />
        </div>
      </div>

      <TabelaOrcamento
        materiais={materiais}
        servicos={servicos}
        atualizarMaterial={atualizarMaterial}
        atualizarServico={atualizarServico}
        removerMaterial={removerMaterial}
        removerServico={removerServico}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 8, marginBottom: 20 }}>
        <button onClick={() => setMateriais([...materiais, itemMaterialVazio()])} style={btnAddMat}>+ Material</button>
        <button onClick={() => setServicos([...servicos, itemServicoVazio()])}   style={btnAddServ}>+ Serviço</button>
      </div>

      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Total: <strong style={{ color: '#16a34a' }}>{format(totalGeral())}</strong>
      </div>

      <div style={acoes}>
        <button onClick={salvar}         style={btnPrim} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
        <button onClick={gerarPDF}       style={btnPdf}>📄 PDF</button>
        <button onClick={enviarWhatsApp} style={btnWhats}>WhatsApp</button>
      </div>

    </div>
  )
}

function format(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function badgeStyle(status?: string): React.CSSProperties {
  if (status === 'aprovado') return { background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }
  if (status === 'recusado') return { background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }
  return { background: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }
}

const container: React.CSSProperties  = { maxWidth: 1100, margin: '0 auto', padding: 24 }
const titulo: React.CSSProperties     = { fontSize: 24, fontWeight: 800 }
const card: React.CSSProperties       = { background: '#fff', padding: 20, borderRadius: 12, marginTop: 20, marginBottom: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
const formGroup: React.CSSProperties  = { marginBottom: 14 }
const label: React.CSSProperties      = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }
const input: React.CSSProperties      = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }
const acoes: React.CSSProperties      = { display: 'flex', gap: 10, marginTop: 8 }
const btnVoltar: React.CSSProperties  = { background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 12, color: '#2563eb' }
const btnAddMat: React.CSSProperties  = { background: '#eff6ff', color: '#3b82f6', border: '1px dashed #3b82f6', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }
const btnAddServ: React.CSSProperties = { background: '#fffbeb', color: '#f59e0b', border: '1px dashed #f59e0b', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }
const btnPrim: React.CSSProperties    = { background: '#2563eb', color: '#fff', padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }
const btnPdf: React.CSSProperties     = { background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }
const btnWhats: React.CSSProperties   = { background: '#22c55e', color: '#fff', padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }
const aprovacaoBox: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', marginBottom: 20, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }
const btnAprovar: React.CSSProperties = { background: '#16a34a', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }
const bannerAprovado: React.CSSProperties = { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontWeight: 600, color: '#15803d', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }
const btnVerObras: React.CSSProperties = { background: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }
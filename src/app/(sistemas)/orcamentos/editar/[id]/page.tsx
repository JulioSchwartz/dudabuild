'use client'
 
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'
 
export default function EditarOrcamento() {
 
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
 
  const [cliente, setCliente]     = useState('')
  const [descricao, setDescricao] = useState('')
  const [token, setToken]         = useState('')
  const [telefone, setTelefone]   = useState('')
  const [itens, setItens]         = useState<any[]>([])
  const [loading, setLoading]     = useState(false)
  const [loadingData, setLoadingData] = useState(true)
 
  useEffect(() => {
    if (id) carregar()
  }, [id])
 
  async function carregar() {
    try {
      const { data: orc, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id', id)
        .maybeSingle()
 
      if (error) throw error
      if (!orc)  throw new Error('Orçamento não encontrado')
 
      setCliente(orc.cliente_nome || '')
      setDescricao(orc.descricao || '')
      setToken(orc.token || '')
      setTelefone(orc.telefone || '')
 
      const { data: itensData, error: errItens } = await supabase
        .from('orcamento_itens')
        .select('*')
        .eq('orcamento_id', id)
 
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
    const novos = [...itens]
    novos[index][campo] = valor
    setItens(novos)
  }
 
  function removerItem(index: number) {
    setItens(itens.filter((_, i) => i !== index))
  }
 
  function adicionarItem() {
    setItens([...itens, {
      descricao: '',
      unidade: 'm²',
      quantidade: 1,
      material: 0,
      mao_obra: 0,
      equipamentos: 0
    }])
  }
 
  function totalItem(i: any) {
    return (
      Number(i.material || 0) +
      Number(i.mao_obra || 0) +
      Number(i.equipamentos || 0)
    ) * Number(i.quantidade || 0)
  }
 
  function totalGeral() {
    return itens.reduce((a, i) => a + totalItem(i), 0)
  }
 
  async function salvar() {
    if (!cliente.trim()) return alert('Informe o nome do cliente')
 
    setLoading(true)
 
    try {
      const { error: errUpdate } = await supabase
        .from('orcamentos')
        .update({
          cliente_nome: cliente.trim(),
          telefone: telefone.trim() || null,
          descricao:   descricao.trim(),
          valor_total: totalGeral()
        })
        .eq('id', id)
 
      if (errUpdate) throw errUpdate
 
      const { error: errDel } = await supabase
        .from('orcamento_itens')
        .delete()
        .eq('orcamento_id', id)
 
      if (errDel) throw errDel
 
      const { error: errIns } = await supabase
        .from('orcamento_itens')
        .insert(itens.map(i => ({
          ...i,
          orcamento_id: id,
          valor_total:  totalItem(i)
        })))
 
      if (errIns) throw errIns
 
      alert('Atualizado com sucesso!')
      router.push('/orcamentos')
 
    } catch (err) {
      console.error('Erro ao salvar:', err)
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
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
      html2pdf()
        .from(element)
        .set({
          margin: 0,
          filename: `Proposta_${cliente.replace(/\s+/g, '_')}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .save()
    })
  }
 
  function enviarWhatsApp() {
    if (!token) {
      alert('Token não encontrado. Recrie o orçamento.')
      return
    }
    const link  = `${window.location.origin}/orcamento-publico/${id}?token=${token}`
    const texto = `Olá! Segue sua proposta:\n${link}`
    const url = telefone
      ? `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url)
  }
 
  if (loadingData) return <p style={{ padding: 24 }}>Carregando...</p>
 
  return (
    <div style={container}>
 
      <button onClick={() => router.back()} style={btnVoltar}>← Voltar</button>
 
      <h1 style={titulo}>✏️ Editar Orçamento</h1>
 
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
        <TabelaOrcamento
          itens={itens}
          atualizarItem={atualizarItem}
          removerItem={removerItem}
        />
        <button onClick={adicionarItem} style={btnAdd}>+ Adicionar Item</button>
      </div>
 
      <div style={totalBox}>
        Total: <strong style={{ color: '#16a34a' }}>{format(totalGeral())}</strong>
      </div>
 
      <div style={acoes}>
        <button onClick={salvar} style={btnPrim} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
 
        <button onClick={gerarPDF} style={btnPdf}>
          📄 Baixar PDF
        </button>
 
        <button onClick={enviarWhatsApp} style={btnWhats}>
          WhatsApp
        </button>
      </div>
 
    </div>
  )
}
 
/* ================= HELPERS ================= */
 
function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
 
/* ================= ESTILOS ================= */
 
const container: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: 24 }
 
const titulo: React.CSSProperties = { fontSize: 26, fontWeight: 700 }
 
const card: React.CSSProperties = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  marginTop: 20,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
}
 
const formGroup: React.CSSProperties = { marginBottom: 14 }
 
const label: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4
}
 
const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 14,
  boxSizing: 'border-box'
}
 
const totalBox: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  marginTop: 20
}
 
const acoes: React.CSSProperties = { display: 'flex', gap: 10, marginTop: 20 }
 
const btnVoltar: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  marginBottom: 12,
  color: '#2563eb'
}
 
const btnAdd: React.CSSProperties = {
  marginTop: 15,
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  cursor: 'pointer'
}
 
const btnPrim: React.CSSProperties  = { background: '#2563eb', color: '#fff', padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }
const btnPdf: React.CSSProperties   = { background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }
const btnWhats: React.CSSProperties = { background: '#22c55e', color: '#fff', padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }
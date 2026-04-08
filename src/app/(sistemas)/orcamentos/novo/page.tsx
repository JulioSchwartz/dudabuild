'use client'
 
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'
import { useEmpresa } from '@/hooks/useEmpresa'
 
export default function NovoOrcamento() {
 
  const { empresaId } = useEmpresa()
  const router = useRouter()
 
  const [cliente, setCliente]     = useState('')
  const [telefone, setTelefone]   = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading]     = useState(false)
 
  const [itens, setItens] = useState<any[]>([{
    descricao: '',
    quantidade: 1,
    material: 0,
    mao_obra: 0,
    equipamentos: 0
  }])
 
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
    if (!empresaId)      return alert('Erro: empresa não identificada')
 
    setLoading(true)
 
    try {
      const token = crypto.randomUUID()
 
      const { data: orc, error } = await supabase
        .from('orcamentos')
        .insert({
          empresa_id:  empresaId,
          cliente_nome: cliente.trim(),
          telefone:    telefone.trim() || null,
          descricao:   descricao.trim(),
          valor_total: totalGeral(),
          token
        })
        .select()
        .single()
 
      if (error || !orc) throw error || new Error('Orçamento não retornado')
 
      const itensPayload = itens.map(i => ({
        ...i,
        orcamento_id: orc.id,
        valor_total:  totalItem(i)
      }))
 
      const { error: errItens } = await supabase
        .from('orcamento_itens')
        .insert(itensPayload)
 
      if (errItens) throw errItens
 
      const link = `${window.location.origin}/orcamento-publico/${orc.id}?token=${token}`
      await navigator.clipboard.writeText(link)
 
      alert('Orçamento salvo! Link copiado para a área de transferência.')
      router.push('/orcamentos')
 
    } catch (err) {
      console.error('Erro ao salvar:', err)
      alert('Erro ao salvar orçamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }
 
  function gerarPDF() {
    // html2pdf carregado dinamicamente para evitar erro de SSR
    import('html2pdf.js').then(({ default: html2pdf }) => {
      const dataHoje = new Date().toLocaleDateString('pt-BR')
 
      const element = document.createElement('div')
      element.innerHTML = `
        <div style="font-family:Arial;color:#0f172a">
 
          <div style="
            height:200px;
            background:#0f172a;
            color:white;
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
          ">
            <h1 style="margin:0">DudaBuild Engenharia</h1>
            <p style="margin:4px 0 0">Proposta Comercial</p>
          </div>
 
          <div style="padding:40px">
 
            <div style="margin-bottom:30px">
              <h2>Dados do Cliente</h2>
              <p><strong>Cliente:</strong> ${cliente}</p>
              <p><strong>Descrição:</strong> ${descricao}</p>
              <p><strong>Data:</strong> ${dataHoje}</p>
            </div>
 
            <div>
              <h2 style="margin-bottom:10px">Itens do Orçamento</h2>
              ${itens.map(i => `
                <div style="
                  display:flex;
                  justify-content:space-between;
                  padding:12px 0;
                  border-bottom:1px solid #e2e8f0;
                ">
                  <span>${i.descricao || '—'}</span>
                  <strong>${format(totalItem(i))}</strong>
                </div>
              `).join('')}
            </div>
 
            <div style="
              margin-top:40px;
              padding:25px;
              background:#16a34a;
              color:white;
              border-radius:10px;
              text-align:center;
            ">
              <h2>Total do Investimento</h2>
              <h1>${format(totalGeral())}</h1>
            </div>
 
            <div style="margin-top:60px">
              <p>______________________________________</p>
              <p><strong>DudaBuild Engenharia</strong></p>
              <p>Responsável Técnico</p>
            </div>
 
            <div style="margin-top:40px;text-align:center;font-size:12px;color:#64748b">
              Proposta válida por 7 dias<br/>contato@dudabuild.com
            </div>
 
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
 
  return (
    <div style={container}>
 
      <button onClick={() => router.back()} style={btnVoltar}>← Voltar</button>
 
      <h1 style={titulo}>Nova Proposta Comercial</h1>
 
      <div style={formGroup}>
        <label style={label}>Cliente *</label>
        <input
          value={cliente}
          onChange={e => setCliente(e.target.value)}
          placeholder="Nome do cliente"
          style={input}
        />
      </div>
 
      <div style={formGroup}>
        <label style={label}>Telefone (WhatsApp)</label>
        <input
          value={telefone}
          onChange={e => setTelefone(e.target.value)}
          placeholder="5511999999999"
          style={input}
        />
      </div>
 
      <div style={formGroup}>
        <label style={label}>Descrição</label>
        <input
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          placeholder="Descrição do serviço"
          style={input}
        />
      </div>
 
      <TabelaOrcamento
        itens={itens}
        atualizarItem={atualizarItem}
        removerItem={removerItem}
      />
 
      <button onClick={adicionarItem} style={btnAdd}>+ Adicionar Item</button>
 
      <div style={totalBox}>
        Total: <strong>{format(totalGeral())}</strong>
      </div>
 
      <div style={acoes}>
        <button onClick={salvar} style={btnPrim} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Orçamento'}
        </button>
 
        <button onClick={gerarPDF} style={btnPdf}>
          📄 Baixar PDF
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
 
const container: React.CSSProperties = { maxWidth: 800, margin: '0 auto', padding: 24 }
 
const titulo: React.CSSProperties = { fontSize: 26, fontWeight: 700, marginBottom: 20 }
 
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
  fontSize: 20,
  marginTop: 16,
  marginBottom: 16,
  color: '#16a34a'
}
 
const acoes: React.CSSProperties = { display: 'flex', gap: 10 }
 
const btnVoltar: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  marginBottom: 12,
  color: '#2563eb'
}
 
const btnAdd: React.CSSProperties = {
  marginTop: 10,
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  cursor: 'pointer'
}
 
const btnPrim: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  padding: '12px 20px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer'
}
 
const btnPdf: React.CSSProperties = {
  background: '#0f172a',
  color: '#fff',
  padding: '12px 20px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer'
}
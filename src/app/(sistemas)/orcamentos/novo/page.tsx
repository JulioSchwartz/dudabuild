'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'
import { useEmpresa } from '@/hooks/useEmpresa'
import { InputTelefone, telefoneParaWhatsApp } from '@/components/InputFormatado'

const itemMaterialVazio = () => ({
  tipo: 'material', codigo: '', descricao: '', unidade: 'm²',
  quantidade: 1, material: 0, mao_obra: 0, equipamentos: 0
})

const itemServicoVazio = () => ({
  tipo: 'servico', codigo: '', descricao: '', unidade: 'h',
  quantidade: 1, material: 0, mao_obra: 0, equipamentos: 0
})

export default function NovoOrcamento() {

  const { empresaId } = useEmpresa()
  const router        = useRouter()

  const [cliente,   setCliente]   = useState('')
  const [telefone,  setTelefone]  = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading,   setLoading]   = useState(false)

  const [materiais, setMateriais] = useState<any[]>([itemMaterialVazio()])
  const [servicos,  setServicos]  = useState<any[]>([itemServicoVazio()])

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
    if (!empresaId)      return alert('Erro: empresa não identificada')

    setLoading(true)

    try {
      const token = crypto.randomUUID()

      const { data: orc, error } = await supabase
        .from('orcamentos')
        .insert({
          empresa_id:   empresaId,
          cliente_nome: cliente.trim(),
          telefone:     telefone.replace(/\D/g, '') ? `+55${telefone.replace(/\D/g, '')}` : null,
          descricao:    descricao.trim(),
          valor_total:  totalGeral(),
          token,
        })
        .select()
        .single()

      if (error || !orc) throw error || new Error('Orçamento não retornado')

      // Combina materiais e serviços em um único array de itens
      const todosItens = [...materiais, ...servicos]

      const itensPayload = todosItens.map(i => ({
        orcamento_id: orc.id,
        codigo:       i.codigo       || null,
        descricao:    i.descricao    || null,
        unidade:      i.unidade      || null,
        quantidade:   Number(i.quantidade   || 1),
        material:     Number(i.material     || 0),
        mao_obra:     Number(i.mao_obra     || 0),
        equipamentos: Number(i.equipamentos || 0),
        valor_total:  totalItem(i),
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
    import('html2pdf.js').then(({ default: html2pdf }) => {
      const dataHoje  = new Date().toLocaleDateString('pt-BR')
      const format    = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      const totalMat  = materiais.reduce((a, i) => a + totalItem(i), 0)
      const totalServ = servicos.reduce((a, i)  => a + totalItem(i), 0)

      const el = document.createElement('div')
      el.innerHTML = `
        <div style="font-family:Arial;color:#0f172a">
          <div style="height:180px;background:#0f172a;color:white;display:flex;flex-direction:column;justify-content:center;align-items:center">
            <h1 style="margin:0;font-size:24px">DudaBuild Engenharia</h1>
            <p style="margin:6px 0 0;opacity:0.7">Proposta Comercial</p>
          </div>
          <div style="padding:40px">
            <p><strong>Cliente:</strong> ${cliente}</p>
            ${descricao ? `<p><strong>Descrição:</strong> ${descricao}</p>` : ''}
            <p><strong>Data:</strong> ${dataHoje}</p>
            <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0"/>

            <h3 style="color:#3b82f6;margin-bottom:10px">🧱 Materiais</h3>
            ${materiais.map(i => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px">
                <span>${i.codigo ? `[${i.codigo}] ` : ''}${i.descricao || '—'} (${i.quantidade} ${i.unidade})</span>
                <strong>${format(totalItem(i))}</strong>
              </div>
            `).join('')}
            <div style="text-align:right;padding:8px 0;font-weight:700;color:#3b82f6">Subtotal Materiais: ${format(totalMat)}</div>

            <h3 style="color:#f59e0b;margin:20px 0 10px">👷 Serviços</h3>
            ${servicos.map(i => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px">
                <span>${i.codigo ? `[${i.codigo}] ` : ''}${i.descricao || '—'} (${i.quantidade} ${i.unidade})</span>
                <strong>${format(totalItem(i))}</strong>
              </div>
            `).join('')}
            <div style="text-align:right;padding:8px 0;font-weight:700;color:#f59e0b">Subtotal Serviços: ${format(totalServ)}</div>

            <div style="margin-top:30px;padding:24px;background:#16a34a;color:white;border-radius:10px;text-align:center">
              <p style="margin:0;opacity:0.8;font-size:14px">Total do Investimento</p>
              <h1 style="margin:8px 0 0;font-size:30px">${format(totalGeral())}</h1>
            </div>

            <div style="margin-top:50px">
              <p>______________________________________</p>
              <p><strong>DudaBuild Engenharia</strong> · Responsável Técnico</p>
            </div>
            <p style="margin-top:30px;text-align:center;font-size:11px;color:#94a3b8">
              Proposta válida por 7 dias · contato@dudabuild.com
            </p>
          </div>
        </div>
      `
      html2pdf().from(el).set({
        margin: 0,
        filename: `Proposta_${cliente.replace(/\s+/g, '_')}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save()
    })
  }

  return (
    <div style={container}>

      <button onClick={() => router.back()} style={btnVoltar}>← Voltar</button>
      <h1 style={titulo}>📋 Nova Proposta Comercial</h1>

      {/* DADOS DO CLIENTE */}
      <div style={dadosCard}>
        <h3 style={secTitulo}>Dados do Cliente</h3>
        <div style={formGrid}>
          <div style={formGrupo}>
            <label style={label}>Cliente *</label>
            <input value={cliente} onChange={e => setCliente(e.target.value)}
              placeholder="Nome do cliente" style={input} />
          </div>
          <div style={formGrupo}>
            <label style={label}>Telefone (WhatsApp)</label>
            <InputTelefone value={telefone} onChange={setTelefone} style={input} />
          </div>
          <div style={{ ...formGrupo, gridColumn: '1 / -1' }}>
            <label style={label}>Descrição da Obra</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Construção de residência unifamiliar" style={input} />
          </div>
        </div>
      </div>

      {/* TABELA COM DUAS SEÇÕES */}
      <TabelaOrcamento
        materiais={materiais}
        servicos={servicos}
        atualizarMaterial={atualizarMaterial}
        atualizarServico={atualizarServico}
        removerMaterial={removerMaterial}
        removerServico={removerServico}
      />

      {/* BOTÕES ADICIONAR */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8, marginBottom: 24 }}>
        <button onClick={() => setMateriais([...materiais, itemMaterialVazio()])} style={btnAddMat}>
          + Material
        </button>
        <button onClick={() => setServicos([...servicos, itemServicoVazio()])} style={btnAddServ}>
          + Serviço
        </button>
      </div>

      {/* AÇÕES */}
      <div style={acoes}>
        <button onClick={salvar} style={btnSalvar} disabled={loading}>
          {loading ? 'Salvando...' : '💾 Salvar Orçamento'}
        </button>
        <button onClick={gerarPDF} style={btnPdf}>📄 Baixar PDF</button>
      </div>

    </div>
  )
}

/* ── ESTILOS ── */
const container: React.CSSProperties  = { maxWidth: 1100, margin: '0 auto', padding: 24 }
const titulo: React.CSSProperties     = { fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 20 }
const dadosCard: React.CSSProperties  = { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }
const secTitulo: React.CSSProperties  = { fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 14 }
const formGrid: React.CSSProperties   = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const formGrupo: React.CSSProperties  = { display: 'flex', flexDirection: 'column', gap: 4 }
const label: React.CSSProperties      = { fontSize: 12, fontWeight: 600, color: '#374151' }
const input: React.CSSProperties      = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#f8fafc' }
const acoes: React.CSSProperties      = { display: 'flex', gap: 10 }
const btnVoltar: React.CSSProperties  = { background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 12, color: '#2563eb', fontSize: 14 }
const btnAddMat: React.CSSProperties  = { background: '#eff6ff', color: '#3b82f6', border: '1px dashed #3b82f6', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }
const btnAddServ: React.CSSProperties = { background: '#fffbeb', color: '#f59e0b', border: '1px dashed #f59e0b', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }
const btnSalvar: React.CSSProperties  = { background: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15 }
const btnPdf: React.CSSProperties     = { background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }
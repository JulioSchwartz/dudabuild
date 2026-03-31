'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'
import jsPDF from 'jspdf'

// ✅ Tipagem forte
type Item = {
  categoria: string
  codigo: string
  descricao: string
  unidade: string
  quantidade: number
  material: number
  mao_obra: number
  equipamentos: number
}

export default function NovoOrcamento() {
  const [cliente, setCliente] = useState('')
  const [descricao, setDescricao] = useState('')
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null)

  const [itens, setItens] = useState<Item[]>([
    {
      categoria: 'Lista de Materiais',
      codigo: '',
      descricao: '',
      unidade: 'm²',
      quantidade: 1,
      material: 0,
      mao_obra: 0,
      equipamentos: 0
    }
  ])

  function atualizarItem(index: number, campo: keyof Item, valor: any) {
    const novos = [...itens]
    novos[index][campo] = valor
    setItens(novos)
  }

  function removerItem(index: number) {
    const novos = [...itens]
    novos.splice(index, 1)
    setItens(novos)
  }

  function adicionarItem() {
    setItens([
      ...itens,
      {
        categoria: 'Lista de Materiais',
        codigo: '',
        descricao: '',
        unidade: 'm²',
        quantidade: 1,
        material: 0,
        mao_obra: 0,
        equipamentos: 0
      }
    ])
  }

  function totalItem(i: Item) {
    return (i.material + i.mao_obra + i.equipamentos) * i.quantidade
  }

  function totalGeral() {
    return itens.reduce((acc, i) => acc + totalItem(i), 0)
  }

  async function salvar() {
    const empresa_id = localStorage.getItem('empresa_id')

    if (!empresa_id) {
      alert('Empresa não encontrada')
      return
    }

    const { data: orc, error } = await supabase
      .from('orcamentos')
      .insert({
        empresa_id,
        cliente_nome: cliente,
        descricao,
        valor_total: totalGeral()
      })
      .select()
      .single()

    if (error || !orc) {
      alert('Erro ao salvar')
      return
    }

    setOrcamentoId(orc.id)

    await supabase.from('orcamento_itens').insert(
      itens.map(i => ({
        ...i,
        orcamento_id: orc.id,
        valor_total: totalItem(i)
      }))
    )

    alert('Orçamento salvo!')
  }

  function enviarWhatsApp() {
    if (!orcamentoId) {
      alert('Salve o orçamento primeiro')
      return
    }

    const link = `https://dudabuild.vercel.app/orcamento/${orcamentoId}`
    const msg = `Olá! Segue seu orçamento:\n${link}`

    window.open(`https://wa.me/5549991587646?text=${encodeURIComponent(msg)}`)
  }

  function gerarPDF() {
    const doc = new jsPDF()

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, 210, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text('DudaBuild Engenharia', 20, 25)

    doc.setFontSize(12)
    doc.text('PROPOSTA COMERCIAL', 140, 25)

    doc.setTextColor(0, 0, 0)

    doc.setFontSize(12)
    doc.text(`Cliente: ${cliente}`, 20, 60)
    doc.text(`Descrição: ${descricao}`, 20, 68)

    let y = 80

    doc.setFillColor(230, 230, 230)
    doc.rect(20, y, 170, 10, 'F')

    doc.text('Descrição', 22, y + 7)
    doc.text('Qtd', 120, y + 7)
    doc.text('Total', 160, y + 7)

    y += 15

    itens.forEach(item => {
      doc.text(item.descricao || '-', 22, y)
      doc.text(String(item.quantidade), 120, y)
      doc.text(`R$ ${totalItem(item).toFixed(2)}`, 160, y)
      y += 10
    })

    y += 10
    doc.setFontSize(14)
    doc.text(`TOTAL: R$ ${totalGeral().toFixed(2)}`, 20, y)

    y += 20
    doc.setFontSize(10)
    doc.text('Validade: 7 dias', 20, y)
    doc.text('Forma de pagamento: A combinar', 20, y + 5)

    y += 25
    doc.text('_________________________________', 20, y)
    doc.text('Responsável técnico', 20, y + 5)

    doc.save('orcamento.pdf')
  }

  const container = { maxWidth: 1100, margin: '0 auto', padding: 24 }
  const titulo = { fontSize: 26, fontWeight: 700 }
  const input = { width: '100%', marginTop: 10, padding: 10 }
  const total = { fontSize: 24, fontWeight: 700, marginTop: 20 }
  const btn = { marginTop: 10 }
  const btnBlack = { background: 'black', color: '#fff', marginTop: 10 }
  const btnWhats = {
    background: '#25D366',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  }

  return (
    <div style={container}>
      <h1 style={titulo}>Novo Orçamento</h1>

      <input
        placeholder="Cliente"
        value={cliente}
        onChange={e => setCliente(e.target.value)}
        style={input}
      />

      <input
        placeholder="Descrição"
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
        style={input}
      />

      <TabelaOrcamento
        itens={itens}
        atualizarItem={atualizarItem}
        removerItem={removerItem}
      />

      <button onClick={adicionarItem} style={btn}>
        + Adicionar Item
      </button>

      <h2 style={total}>Total: R$ {totalGeral().toFixed(2)}</h2>

      <button onClick={salvar} style={btn}>
        Salvar Orçamento
      </button>

      <button onClick={gerarPDF} style={btnBlack}>
        Gerar PDF
      </button>

      <button onClick={enviarWhatsApp} style={btnWhats}>
        Enviar WhatsApp
      </button>
    </div>
  )
}

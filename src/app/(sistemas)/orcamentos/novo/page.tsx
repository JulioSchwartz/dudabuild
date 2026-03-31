'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'
import jsPDF from 'jspdf'

// 🚀 TIPAGEM PROFISSIONAL
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

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export default function NovoOrcamento() {
  const [cliente, setCliente] = useState('')
  const [descricao, setDescricao] = useState('')
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    if (!cliente) {
      alert('Informe o cliente')
      return
    }

    setLoading(true)

    const empresa_id = localStorage.getItem('empresa_id')

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
      setLoading(false)
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

    alert('Orçamento salvo com sucesso!')
    setLoading(false)
  }

  function enviarWhatsApp() {
    if (!orcamentoId) {
      alert('Salve primeiro')
      return
    }

    const link = `https://dudabuild.vercel.app/orcamento/${orcamentoId}`
    const msg = `Olá! Segue seu orçamento:\n${link}`

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`)
  }

  function gerarPDF() {
  const html = `
    <html>
    <body style="font-family: Arial; padding: 40px">

      <h1>DudaBuild Engenharia</h1>
      <h2>Proposta Comercial</h2>

      <p><b>Cliente:</b> ${cliente}</p>
      <p><b>Descrição:</b> ${descricao}</p>

      <hr/>

      ${itens.map(i => `
        <p>${i.descricao} - ${i.quantidade}x - R$ ${totalItem(i).toFixed(2)}</p>
      `).join('')}

      <hr/>

      <h2>Total: R$ ${totalGeral().toFixed(2)}</h2>

      <br/>

      <p><b>CNPJ:</b> 00.000.000/0001-00</p>
      <p><b>Responsável:</b> Eng. Civil</p>

      <br/><br/>

      <p>__________________________</p>
      <p>Assinatura</p>

    </body>
    </html>
  `

  const w = window.open('', '', 'width=900,height=700')
  w?.document.write(html)
  w?.document.close()
  w?.print()
}

  const input = { width: '100%', marginTop: 10, padding: 12, borderRadius: 8 }
  const btn = { marginTop: 10, padding: 12, borderRadius: 8 }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Novo Orçamento</h1>

      <input
        placeholder="Nome do cliente"
        value={cliente}
        onChange={e => setCliente(e.target.value)}
        style={input}
      />

      <input
        placeholder="Descrição do serviço"
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

      <h2 style={{ fontSize: 26, marginTop: 20 }}>
        Total: {formatarMoeda(totalGeral())}
      </h2>

      <button onClick={salvar} style={btn} disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Orçamento'}
      </button>

      <button onClick={gerarPDF} style={{ ...btn, background: '#000', color: '#fff' }}>
        Gerar PDF
      </button>

      <button onClick={enviarWhatsApp} style={{ ...btn, background: '#25D366', color: '#fff' }}>
        Enviar WhatsApp
      </button>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditarOrcamento() {
  const { id } = useParams()
  const router = useRouter()

  const [carregando, setCarregando] = useState(true)

  const [clienteNome, setClienteNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [descricao, setDescricao] = useState('')
  const [endereco, setEndereco] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [memorial, setMemorial] = useState('')

  const [itens, setItens] = useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', id)
      .single()

    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)

    if (data) {
      setClienteNome(data.cliente_nome || '')
      setWhatsapp(data.cliente_whatsapp || '')
      setEmail(data.cliente_email || '')
      setDescricao(data.descricao || '')
    }

    if (itensData) {
      setItens(
        itensData.map(i => ({
          id: i.id,
          descricao: i.descricao,
          unidade: i.unidade || 'm²',
          quantidade: i.quantidade,
          valor_unitario: i.valor_unitario
        }))
      )
    }

    setCarregando(false)
  }

  function adicionarItem() {
    setItens([...itens, { descricao: '', unidade: 'm²', quantidade: 1, valor_unitario: 0 }])
  }

  function removerItem(index: number) {
    const novos = [...itens]
    novos.splice(index, 1)
    setItens(novos)
  }

  function atualizarItem(index: number, campo: string, valor: any) {
    const novos = [...itens]
    novos[index][campo] = valor
    setItens(novos)
  }

  function calcularTotal() {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0)
  }

  async function salvar() {
    const total = calcularTotal()

    await supabase
      .from('orcamentos')
      .update({
        cliente_nome: clienteNome,
        cliente_whatsapp: whatsapp,
        cliente_email: email,
        descricao,
        valor_total: total
      })
      .eq('id', id)

    // remove antigos itens
    await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)

    // insere novos
    const itensFormatados = itens.map(item => ({
      orcamento_id: id,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: item.quantidade * item.valor_unitario
    }))

    await supabase.from('orcamento_itens').insert(itensFormatados)

    alert('Orçamento atualizado!')
    router.push('/orcamentos')
  }

  function gerarPDF() {
    const conteudo = `
      <h1>ORÇAMENTO</h1>
      <p><strong>Cliente:</strong> ${clienteNome}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>WhatsApp:</strong> ${whatsapp}</p>
      <hr/>
      ${itens.map(i => `
        <p>${i.descricao} (${i.unidade}) - ${i.quantidade} x ${i.valor_unitario} = ${i.quantidade * i.valor_unitario}</p>
      `).join('')}
      <h2>Total: R$ ${calcularTotal()}</h2>
    `

    const win = window.open('', '', 'width=900,height=700')
    win?.document.write(conteudo)
    win?.document.close()
    win?.print()
  }

  if (carregando) return <p>Carregando...</p>

  const total = calcularTotal()

  return (
    <div style={container}>
      <h1 style={titulo}>✏️ Editar Orçamento</h1>

      {/* CLIENTE */}
      <div style={card}>
        <h3>Dados do Cliente</h3>

        <div style={grid}>
          <input value={clienteNome} onChange={e => setClienteNome(e.target.value)} style={input}/>
          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={input}/>
          <input value={email} onChange={e => setEmail(e.target.value)} style={input}/>
          <input value={endereco} onChange={e => setEndereco(e.target.value)} style={input}/>
          <input value={responsavel} onChange={e => setResponsavel(e.target.value)} style={input}/>
        </div>
      </div>

      {/* DESCRIÇÃO */}
      <div style={card}>
        <h3>Descrição</h3>
        <textarea value={descricao} onChange={e => setDescricao(e.target.value)} style={textarea}/>
      </div>

      {/* ITENS */}
      <div style={card}>
        <h3>Planilha Orçamentária</h3>

        {itens.map((item, index) => (
          <div key={index} style={linha}>
            <input value={item.descricao} onChange={e => atualizarItem(index, 'descricao', e.target.value)} style={input}/>
            <input value={item.unidade} onChange={e => atualizarItem(index, 'unidade', e.target.value)} style={inputPequeno}/>
            <input type="number" value={item.quantidade} onChange={e => atualizarItem(index, 'quantidade', Number(e.target.value))} style={inputPequeno}/>
            <input type="number" value={item.valor_unitario} onChange={e => atualizarItem(index, 'valor_unitario', Number(e.target.value))} style={inputPequeno}/>
            <strong>R$ {(item.quantidade * item.valor_unitario).toFixed(2)}</strong>
            <button onClick={() => removerItem(index)} style={btnRemover}>X</button>
          </div>
        ))}

        <button onClick={adicionarItem} style={btnAdd}>+ Item</button>
      </div>

      {/* TOTAL */}
      <div style={totalBox}>
        💰 Total: R$ {total.toFixed(2)}
      </div>

      {/* AÇÕES */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={salvar} style={btnSalvar}>Salvar Alterações</button>
        <button onClick={gerarPDF} style={btnPDF}>📄 Gerar PDF</button>
      </div>
    </div>
  )
}

/* ESTILO PROFISSIONAL */

const container = { maxWidth: 1100, margin: '0 auto' }

const titulo = {
  fontSize: 30,
  marginBottom: 20,
  color: '#0f172a'
}

const card = {
  background: '#fff',
  padding: 24,
  borderRadius: 16,
  marginBottom: 20,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
}

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10
}

const input = {
  padding: 12,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff'
}

const inputPequeno = {
  padding: 10,
  width: 80,
  borderRadius: 8,
  border: '1px solid #e2e8f0'
}

const textarea = {
  width: '100%',
  height: 120,
  padding: 12,
  borderRadius: 8,
  border: '1px solid #e2e8f0'
}

const linha = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  marginBottom: 10
}

const btnAdd = {
  background: '#22c55e',
  color: '#fff',
  padding: 10,
  borderRadius: 6
}

const btnRemover = {
  background: '#ef4444',
  color: '#fff',
  padding: 6
}

const totalBox = {
  fontSize: 26,
  fontWeight: 'bold',
  color: '#16a34a',
  marginBottom: 20
}

const btnSalvar = {
  background: '#2563eb',
  color: '#fff',
  padding: 14,
  borderRadius: 8
}

const btnPDF = {
  background: '#111827',
  color: '#fff',
  padding: 14,
  borderRadius: 8
}
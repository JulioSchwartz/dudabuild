'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NovoOrcamento() {
  const router = useRouter()

  const [clienteNome, setClienteNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [descricao, setDescricao] = useState('')

  const [itens, setItens] = useState([
    { descricao: '', quantidade: 1, valor_unitario: 0 }
  ])

  function adicionarItem() {
    setItens([...itens, { descricao: '', quantidade: 1, valor_unitario: 0 }])
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
    return itens.reduce((acc, item) => {
      return acc + (item.quantidade * item.valor_unitario)
    }, 0)
  }

  async function salvar() {
    const empresa_id = localStorage.getItem('empresa_id')

    if (!clienteNome) return alert('Nome do cliente obrigatório')

    const total = calcularTotal()

    const { data: orcamento, error } = await supabase
      .from('orcamentos')
      .insert([{
        empresa_id,
        cliente_nome: clienteNome,
        cliente_whatsapp: whatsapp,
        cliente_email: email,
        descricao,
        valor_total: total,
        token: Math.random().toString(36).substring(2)
      }])
      .select()
      .single()

    if (error) {
      alert('Erro ao salvar orçamento')
      return
    }

    const itensFormatados = itens.map(item => ({
      orcamento_id: orcamento.id,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: item.quantidade * item.valor_unitario
    }))

    await supabase.from('orcamento_itens').insert(itensFormatados)

    alert('Orçamento criado com sucesso!')
    router.push('/orcamentos')
  }

  const total = calcularTotal()

  return (
    <div>
      <h1 style={titulo}>Novo Orçamento</h1>

      {/* CLIENTE */}
      <div style={box}>
        <h3>Dados do Cliente</h3>

        <input placeholder="Nome" value={clienteNome} onChange={e => setClienteNome(e.target.value)} style={input} />
        <input placeholder="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={input} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={input} />
      </div>

      {/* DESCRIÇÃO */}
      <div style={box}>
        <h3>Descrição do Projeto</h3>
        <textarea value={descricao} onChange={e => setDescricao(e.target.value)} style={textarea} />
      </div>

      {/* ITENS */}
      <div style={box}>
        <h3>Itens do Orçamento</h3>

        {itens.map((item, index) => (
          <div key={index} style={linha}>
            <input
              placeholder="Descrição"
              value={item.descricao}
              onChange={e => atualizarItem(index, 'descricao', e.target.value)}
              style={input}
            />

            <input
              type="number"
              value={item.quantidade}
              onChange={e => atualizarItem(index, 'quantidade', Number(e.target.value))}
              style={inputPequeno}
            />

            <input
              type="number"
              value={item.valor_unitario}
              onChange={e => atualizarItem(index, 'valor_unitario', Number(e.target.value))}
              style={inputPequeno}
            />

            <strong>
              R$ {(item.quantidade * item.valor_unitario).toFixed(2)}
            </strong>

            <button onClick={() => removerItem(index)} style={btnRemover}>
              X
            </button>
          </div>
        ))}

        <button onClick={adicionarItem} style={btnAdd}>
          + Adicionar Item
        </button>
      </div>

      {/* TOTAL */}
      <div style={totalBox}>
        Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </div>

      <button onClick={salvar} style={btnSalvar}>
        Salvar Orçamento
      </button>
    </div>
  )
}

/* ESTILO */

const titulo = { fontSize: '26px', marginBottom: '20px' }

const box = {
  background: '#fff',
  padding: '20px',
  borderRadius: '12px',
  marginBottom: '20px'
}

const input = {
  width: '100%',
  padding: '10px',
  marginBottom: '10px'
}

const inputPequeno = {
  width: '80px',
  padding: '8px'
}

const textarea = {
  width: '100%',
  height: '80px',
  padding: '10px'
}

const linha = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  marginBottom: '10px'
}

const btnAdd = {
  background: '#22c55e',
  color: '#fff',
  padding: '10px',
  border: 'none',
  borderRadius: '6px'
}

const btnRemover = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  padding: '6px'
}

const totalBox = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '20px'
}

const btnSalvar = {
  background: '#2563eb',
  color: '#fff',
  padding: '14px',
  border: 'none',
  borderRadius: '8px'
}
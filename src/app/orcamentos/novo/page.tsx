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
  const [endereco, setEndereco] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [memorial, setMemorial] = useState('')

  const [itens, setItens] = useState([
    { descricao: '', unidade: 'm²', quantidade: 1, valor_unitario: 0 }
  ])

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
    const empresa_id = localStorage.getItem('empresa_id')
    const total = calcularTotal()

    const { data: orcamento } = await supabase
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

    const itensFormatados = itens.map(item => ({
      orcamento_id: orcamento.id,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: item.quantidade * item.valor_unitario
    }))

    await supabase.from('orcamento_itens').insert(itensFormatados)

    alert('Orçamento salvo!')
  }

  function gerarPDF() {
    window.print()
  }

  const total = calcularTotal()

  return (
    <div style={container}>
      <h1 style={titulo}>📄 Novo Orçamento</h1>

      {/* CABEÇALHO */}
      <div style={card}>
        <h3>Dados do Cliente</h3>

        <div style={grid}>
          <input placeholder="Nome do cliente" value={clienteNome} onChange={e => setClienteNome(e.target.value)} style={input}/>
          <input placeholder="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={input}/>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={input}/>
          <input placeholder="Endereço da obra" value={endereco} onChange={e => setEndereco(e.target.value)} style={input}/>
          <input placeholder="Responsável técnico" value={responsavel} onChange={e => setResponsavel(e.target.value)} style={input}/>
        </div>
      </div>

      {/* DESCRIÇÃO */}
      <div style={card}>
        <h3>Descrição do Projeto</h3>
        <textarea value={descricao} onChange={e => setDescricao(e.target.value)} style={textarea}/>
      </div>

      {/* ITENS */}
      <div style={card}>
        <h3>Planilha Orçamentária</h3>

        <table style={tabela}>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Un</th>
              <th>Qtd</th>
              <th>Valor Unit.</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {itens.map((item, index) => (
              <tr key={index}>
                <td>
                  <input value={item.descricao} onChange={e => atualizarItem(index, 'descricao', e.target.value)} style={input}/>
                </td>

                <td>
                  <input value={item.unidade} onChange={e => atualizarItem(index, 'unidade', e.target.value)} style={inputPequeno}/>
                </td>

                <td>
                  <input type="number" value={item.quantidade} onChange={e => atualizarItem(index, 'quantidade', Number(e.target.value))} style={inputPequeno}/>
                </td>

                <td>
                  <input type="number" value={item.valor_unitario} onChange={e => atualizarItem(index, 'valor_unitario', Number(e.target.value))} style={inputPequeno}/>
                </td>

                <td>
                  R$ {(item.quantidade * item.valor_unitario).toFixed(2)}
                </td>

                <td>
                  <button onClick={() => removerItem(index)} style={btnRemover}>X</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={adicionarItem} style={btnAdd}>+ Adicionar Item</button>
      </div>

      {/* MEMORIAL */}
      <div style={card}>
        <h3>Memorial Descritivo</h3>
        <textarea value={memorial} onChange={e => setMemorial(e.target.value)} style={textarea}/>
      </div>

      {/* TOTAL */}
      <div style={totalBox}>
        💰 Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </div>

      {/* AÇÕES */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={salvar} style={btnSalvar}>Salvar</button>
        <button onClick={gerarPDF} style={btnPDF}>📄 Gerar PDF</button>
      </div>
    </div>
  )
}

/* ESTILO */

const container = { maxWidth: 1100, margin: '0 auto' }
const titulo = { fontSize: 28, marginBottom: 20 }

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  marginBottom: 20,
  boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
}

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10
}

const input = { padding: 10, width: '100%' }
const inputPequeno = { padding: 8, width: 80 }

const textarea = { width: '100%', height: 100, padding: 10 }

const tabela = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginBottom: 10
}

const btnAdd = {
  background: '#22c55e',
  color: '#fff',
  padding: 10,
  border: 'none',
  borderRadius: 6
}

const btnRemover = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  padding: 6
}

const totalBox = {
  fontSize: 22,
  fontWeight: 'bold',
  marginBottom: 20
}

const btnSalvar = {
  background: '#2563eb',
  color: '#fff',
  padding: 14,
  border: 'none',
  borderRadius: 8
}

const btnPDF = {
  background: '#111827',
  color: '#fff',
  padding: 14,
  border: 'none',
  borderRadius: 8
}
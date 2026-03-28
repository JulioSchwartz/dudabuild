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
  const [memorial, setMemorial] = useState('')

  const [itens, setItens] = useState([
    {
      categoria: 'Serviços Iniciais',
      codigo: '',
      descricao: '',
      unidade: 'm²',
      quantidade: 1,
      valor_unitario: 0
    }
  ])

  function adicionarItem() {
    setItens([
      ...itens,
      {
        categoria: 'Serviços',
        codigo: '',
        descricao: '',
        unidade: 'm²',
        quantidade: 1,
        valor_unitario: 0
      }
    ])
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

  async function buscarSinapi(termo: string, index: number) {
    if (!termo || termo.length < 3) return

    const { data } = await supabase
      .from('sinapi')
      .select('*')
      .ilike('descricao', `%${termo}%`)
      .limit(1)

    if (data && data.length > 0) {
      const item = data[0]

      atualizarItem(index, 'codigo', item.codigo)
      atualizarItem(index, 'descricao', item.descricao)
      atualizarItem(index, 'unidade', item.unidade)
      atualizarItem(index, 'valor_unitario', item.valor)
    }
  }

  function calcularTotal() {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0)
  }

  function totalCategoria(cat: string) {
    return itens
      .filter(i => i.categoria === cat)
      .reduce((acc, i) => acc + i.quantidade * i.valor_unitario, 0)
  }

  async function salvar() {
    const empresa_id = localStorage.getItem('empresa_id')
    const total = calcularTotal()

    const { data: orcamento, error } = await supabase
      .from('orcamentos')
      .insert([{
        empresa_id,
        cliente_nome: clienteNome,
        cliente_whatsapp: whatsapp,
        cliente_email: email,
        descricao,
        memorial,
        valor_total: total,
        token: Math.random().toString(36).substring(2)
      }])
      .select()
      .single()

    if (error) {
      alert('Erro ao salvar')
      return
    }

    const itensFormatados = itens.map(item => ({
      orcamento_id: orcamento.id,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: item.quantidade * item.valor_unitario,
      categoria: item.categoria,
      codigo: item.codigo,
      unidade: item.unidade
    }))

    await supabase.from('orcamento_itens').insert(itensFormatados)

    alert('Orçamento salvo!')
    router.push('/orcamentos')
  }

  function gerarPDF() {
    const tabela = itens.map(i => `
      <tr>
        <td>${i.codigo}</td>
        <td>${i.descricao}</td>
        <td>${i.unidade}</td>
        <td>${i.quantidade}</td>
        <td>R$ ${i.valor_unitario}</td>
        <td>R$ ${(i.quantidade * i.valor_unitario).toFixed(2)}</td>
      </tr>
    `).join('')

    const conteudo = `
      <style>
        body { font-family: Arial; padding: 20px }
        table { width: 100%; border-collapse: collapse; margin-top: 20px }
        th, td { border: 1px solid #ddd; padding: 8px }
        th { background: #f3f4f6 }
      </style>

      <h1>ORÇAMENTO</h1>

      <p><strong>Cliente:</strong> ${clienteNome}</p>

      <h3>Descrição</h3>
      <p>${descricao}</p>

      <table>
        <tr>
          <th>Código</th>
          <th>Descrição</th>
          <th>Un</th>
          <th>Qtd</th>
          <th>Valor</th>
          <th>Total</th>
        </tr>
        ${tabela}
      </table>

      <h2>Total: R$ ${calcularTotal().toFixed(2)}</h2>

      <h3>Memorial</h3>
      <p>${memorial}</p>
    `

    const win = window.open('', '', 'width=900,height=700')
    win?.document.write(conteudo)
    win?.document.close()
    win?.print()
  }

  const categorias = [...new Set(itens.map(i => i.categoria))]
  const total = calcularTotal()

  return (
    <div style={container}>
      <h1 style={titulo}>📊 Novo Orçamento Profissional</h1>

      <div style={card}>
        <h3>Dados do Cliente</h3>
        <div style={grid}>
          <input placeholder="Nome" value={clienteNome} onChange={e => setClienteNome(e.target.value)} style={input}/>
          <input placeholder="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={input}/>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={input}/>
        </div>
      </div>

      <div style={card}>
        <h3>Descrição</h3>
        <textarea value={descricao} onChange={e => setDescricao(e.target.value)} style={textarea}/>
      </div>

      {categorias.map(cat => (
        <div key={cat} style={card}>
          <h3>{cat}</h3>

          <div style={header}>
            <span>Cód</span>
            <span>Descrição</span>
            <span>Un</span>
            <span>Qtd</span>
            <span>Valor</span>
            <span>Total</span>
            <span></span>
          </div>

          {itens
            .filter(i => i.categoria === cat)
            .map((item, index) => (
              <div key={index} style={linha}>
                <input value={item.codigo} onChange={e => atualizarItem(index, 'codigo', e.target.value)} style={inputPeq}/>

                <input
                  value={item.descricao}
                  onChange={e => {
                    atualizarItem(index, 'descricao', e.target.value)
                    buscarSinapi(e.target.value, index)
                  }}
                  style={input}
                />

                <input value={item.unidade} onChange={e => atualizarItem(index, 'unidade', e.target.value)} style={inputPeq}/>
                <input type="number" value={item.quantidade} onChange={e => atualizarItem(index, 'quantidade', Number(e.target.value))} style={inputPeq}/>
                <input type="number" value={item.valor_unitario} onChange={e => atualizarItem(index, 'valor_unitario', Number(e.target.value))} style={inputPeq}/>

                <strong style={{ color: '#111827' }}>
                  R$ {(item.quantidade * item.valor_unitario).toFixed(2)}
                </strong>

                <button onClick={() => removerItem(index)} style={btnRemover}>X</button>
              </div>
            ))}

          <div style={subtotal}>
            Subtotal: R$ {totalCategoria(cat).toFixed(2)}
          </div>
        </div>
      ))}

      <button onClick={adicionarItem} style={btnAdd}>+ Item</button>

      <div style={card}>
        <h3>Memorial</h3>
        <textarea value={memorial} onChange={e => setMemorial(e.target.value)} style={textarea}/>
      </div>

      <div style={totalBox}>💰 R$ {total.toFixed(2)}</div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={salvar} style={btnSalvar}>Salvar</button>
        <button onClick={gerarPDF} style={btnPDF}>Gerar PDF</button>
      </div>
    </div>
  )
}

/* ESTILO */

const container = { maxWidth: 1100, margin: '0 auto', padding: 20 }
const titulo = { fontSize: 28, marginBottom: 20 }

const card = { background: '#fff', padding: 20, borderRadius: 12, marginBottom: 20 }

const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }

const header = {
  display: 'grid',
  gridTemplateColumns: '80px 2fr 80px 80px 100px 120px 50px',
  fontWeight: 'bold',
  marginBottom: 10,
  color: '#0f172a',
  background: '#f1f5f9',
  padding: 8,
  borderRadius: 8
}

const linha = {
  display: 'grid',
  gridTemplateColumns: '80px 2fr 80px 80px 100px 120px 50px',
  gap: 8,
  marginBottom: 8,
  alignItems: 'center',
  color: '#111827'
}

const input = { padding: 10, border: '1px solid #ccc', borderRadius: 6, color: '#111827' }
const inputPeq = { padding: 10, border: '1px solid #ccc', borderRadius: 6, color: '#111827' }

const textarea = { width: '100%', height: 120, padding: 10, border: '1px solid #ccc', borderRadius: 6, color: '#111827' }

const subtotal = { textAlign: 'right', fontWeight: 'bold', marginTop: 10 }

const totalBox = { fontSize: 22, fontWeight: 'bold', color: '#16a34a' }

const btnAdd = { background: '#22c55e', color: '#fff', padding: 10, borderRadius: 6 }
const btnRemover = { background: '#ef4444', color: '#fff', padding: 6, borderRadius: 6 }

const btnSalvar = { background: '#2563eb', color: '#fff', padding: 12, borderRadius: 8 }
const btnPDF = { background: '#111827', color: '#fff', padding: 12, borderRadius: 8 }
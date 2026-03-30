'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'

export default function NovoOrcamento() {

  const [cliente, setCliente] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [descricao, setDescricao] = useState('')

  const [memorial, setMemorial] = useState({
    materiais: '',
    metodos: '',
    marcas: '',
    observacoes: ''
  })

  const [condicoes, setCondicoes] = useState({
    validade: '',
    pagamento: '',
    garantia: '',
    observacoes: ''
  })

  const [itens, setItens] = useState([
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

  function adicionarItem() {
    setItens([...itens, {
      categoria: 'Lista de Materiais',
      codigo: '',
      descricao: '',
      unidade: 'm²',
      quantidade: 1,
      material: 0,
      mao_obra: 0,
      equipamentos: 0
    }])
  }

  function removerItem(index:number){
    const novos=[...itens]
    novos.splice(index,1)
    setItens(novos)
  }

  function atualizarItem(index:number,campo:string,valor:any){
    const novos=[...itens]
    novos[index][campo]=valor
    setItens(novos)
  }

  function totalItem(item:any){
    return (item.material + item.mao_obra + item.equipamentos) * item.quantidade
  }

  function totalGeral(){
    return itens.reduce((acc,i)=>acc+totalItem(i),0)
  }

  const categorias=[...new Set(itens.map(i=>i.categoria))]

  async function salvar(){
    const empresa_id = localStorage.getItem('empresa_id')

    const { data: orcamento } = await supabase
      .from('orcamentos')
      .insert({
        empresa_id,
        cliente_nome: cliente,
        cliente_whatsapp: whatsapp,
        cliente_email: email,
        descricao,
        memorial,
        condicoes,
        valor_total: totalGeral()
      })
      .select()
      .single()

    const itensFormatados = itens.map(i => ({
      orcamento_id: orcamento?.id,
      ...i,
      valor_total: totalItem(i)
    }))

    await supabase.from('orcamento_itens').insert(itensFormatados)

    alert('Salvo!')
  }

  function gerarPDF(){

    const tabela = itens.map(i=>`
      <tr>
        <td>${i.codigo}</td>
        <td>${i.descricao}</td>
        <td>${i.unidade}</td>
        <td>${i.quantidade}</td>
        <td>R$ ${totalItem(i).toFixed(2)}</td>
      </tr>
    `).join('')

    const html = `
      <style>
        body{font-family:Arial;padding:40px}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#1e3a8a;color:#fff}
      </style>

      <h1>DudaBuild Engenharia</h1>
      <h2>Proposta Comercial</h2>
      <p><b>Cliente:</b> ${cliente}</p>

      <table>
        <tr><th>Código</th><th>Descrição</th><th>Un</th><th>Qtd</th><th>Total</th></tr>
        ${tabela}
      </table>

      <h2>Total: R$ ${totalGeral().toFixed(2)}</h2>
    `

    const w = window.open('')
    w?.document.write(html)
    w?.print()
  }

  return (
    <div style={container}>

      <h1 style={titulo}>📊 Orçamento Profissional</h1>

      <div style={card}>
        <h3>Cliente</h3>
        <input placeholder="Nome" onChange={e=>setCliente(e.target.value)} style={input}/>
        <input placeholder="WhatsApp" onChange={e=>setWhatsapp(e.target.value)} style={input}/>
        <input placeholder="Email" onChange={e=>setEmail(e.target.value)} style={input}/>
      </div>

      {categorias.map(cat=>(
        <div key={cat} style={card}>
          <h3>{cat}</h3>

          <TabelaOrcamento
            itens={itens.filter(i=>i.categoria===cat)}
            atualizarItem={atualizarItem}
            removerItem={removerItem}
            totalItem={totalItem}
          />
        </div>
      ))}

      <button onClick={adicionarItem} style={btnAdd}>+ Item</button>

      <div style={totalBox}>Total: R$ {totalGeral().toFixed(2)}</div>

      <button onClick={salvar} style={btnSalvar}>Salvar</button>
      <button onClick={gerarPDF} style={btnPDF}>PDF</button>

    </div>
  )
}

const container={maxWidth:1100,margin:'0 auto',padding:24,background:'#f8fafc'}
const titulo={fontSize:28,fontWeight:700}
const card={background:'#fff',padding:20,borderRadius:12,marginBottom:20}
const input={width:'100%',padding:8,marginTop:8}
const totalBox={fontSize:24,fontWeight:700}
const btnAdd={background:'green',color:'#fff',padding:10}
const btnSalvar={background:'blue',color:'#fff',padding:10}
const btnPDF={background:'black',color:'#fff',padding:10}
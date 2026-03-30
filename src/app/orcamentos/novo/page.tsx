'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'

export default function NovoOrcamento(){

  const [cliente,setCliente]=useState('')
  const [descricao,setDescricao]=useState('')

  const [memorial,setMemorial]=useState({materiais:'',metodos:'',marcas:''})
  const [condicoes,setCondicoes]=useState({pagamento:'',validade:''})

  const [itens,setItens]=useState([{
    categoria:'Lista de Materiais',
    codigo:'',
    descricao:'',
    unidade:'m²',
    quantidade:1,
    material:0,
    mao_obra:0,
    equipamentos:0
  }])

  function atualizarItem(index:number,campo:string,valor:any){
    const novos=[...itens]
    novos[index][campo]=valor
    setItens(novos)
  }

  function removerItem(index:number){
    const novos=[...itens]
    novos.splice(index,1)
    setItens(novos)
  }

  function adicionarItem(){
    setItens([...itens,{
      categoria:'Lista de Materiais',
      codigo:'',
      descricao:'',
      unidade:'m²',
      quantidade:1,
      material:0,
      mao_obra:0,
      equipamentos:0
    }])
  }

  function totalItem(i:any){
    return (i.material+i.mao_obra+i.equipamentos)*i.quantidade
  }

  function totalGeral(){
    return itens.reduce((acc,i)=>acc+totalItem(i),0)
  }

  async function salvar(){
    const empresa_id = localStorage.getItem('empresa_id')

    const {data:orc}=await supabase.from('orcamentos').insert({
      empresa_id,
      cliente_nome:cliente,
      descricao,
      memorial,
      condicoes,
      valor_total:totalGeral()
    }).select().single()

    await supabase.from('orcamento_itens').insert(
      itens.map(i=>({...i,orcamento_id:orc?.id,valor_total:totalItem(i)}))
    )

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
      body{font-family:Arial;margin:0}
      .capa{background:#1e3a8a;color:#fff;padding:60px;height:100vh}
      .conteudo{padding:40px}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{border:1px solid #ddd;padding:8px}
      th{background:#1e3a8a;color:#fff}
      .total{font-size:28px;color:#16a34a;font-weight:bold;margin-top:20px}
    </style>

    <div class="capa">
      <h1>DudaBuild Engenharia</h1>
      <h2>Proposta Comercial</h2>
      <p>Cliente: ${cliente}</p>
    </div>

    <div class="conteudo">
      <table>
        <tr><th>Cód</th><th>Descrição</th><th>Un</th><th>Qtd</th><th>Total</th></tr>
        ${tabela}
      </table>

      <div class="total">Total: R$ ${totalGeral().toFixed(2)}</div>
    </div>
    `

    const w=window.open('')
    w?.document.write(html)
    w?.print()
  }

  return(
    <div style={container}>

      <div style={topo}>
        <div>
          <h1 style={titulo}>Orçamento Profissional</h1>
          <p style={sub}>Proposta Comercial</p>
        </div>
        <div style={total}>R$ {totalGeral().toFixed(2)}</div>
      </div>

      <input placeholder="Cliente" onChange={e=>setCliente(e.target.value)} style={input}/>
      <textarea placeholder="Descrição" onChange={e=>setDescricao(e.target.value)} style={input}/>

      <TabelaOrcamento itens={itens} atualizarItem={atualizarItem} removerItem={removerItem} totalItem={totalItem}/>

      <button onClick={adicionarItem} style={btn}>+ Item</button>

      <button onClick={salvar} style={btnBlue}>Salvar</button>
      <button onClick={gerarPDF} style={btnBlack}>PDF</button>

    </div>
  )
}

const container={maxWidth:1100,margin:'0 auto',padding:24}
const topo={display:'flex',justifyContent:'space-between',marginBottom:20}
const titulo={fontSize:26,fontWeight:700}
const sub={color:'#64748b'}
const total={fontSize:24,color:'#16a34a',fontWeight:700}
const input={width:'100%',marginTop:10,padding:10}
const btn={marginTop:10}
const btnBlue={background:'blue',color:'#fff',marginTop:10}
const btnBlack={background:'black',color:'#fff',marginTop:10}
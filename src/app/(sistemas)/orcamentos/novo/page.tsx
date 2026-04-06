'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function NovoOrcamento() {

  const { empresaId } = useEmpresa()

  const [cliente, setCliente] = useState('')
  const [descricao, setDescricao] = useState('')
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [itens, setItens] = useState<any[]>([{
    categoria: 'Lista de Materiais',
    codigo: '',
    descricao: '',
    unidade: 'm²',
    quantidade: 1,
    material: 0,
    mao_obra: 0,
    equipamentos: 0
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
    return (Number(i.material||0)+Number(i.mao_obra||0)+Number(i.equipamentos||0))*Number(i.quantidade||0)
  }

  function totalGeral(){
    return itens.reduce((a,i)=>a+totalItem(i),0)
  }

  async function salvar(){

    if (!cliente) return alert('Informe o cliente')
    if (!empresaId) return alert('Erro empresa')

    setLoading(true)

    const { data: orc, error } = await supabase
      .from('orcamentos')
      .insert({
        empresa_id: empresaId,
        cliente_nome: cliente,
        descricao,
        valor_total: totalGeral()
      })
      .select()
      .single()

    if (error || !orc) {
      console.error(error)
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

    alert('Orçamento salvo!')
    setLoading(false)
  }

  function enviarWhatsApp() {

    if (!orcamentoId) return alert('Salve primeiro')

    const link = `${window.location.origin}/orcamentos/${orcamentoId}`
    const msg = `Olá! Segue sua proposta:\n${link}`

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`)
  }

  function gerarPDF() {

    const dataHoje = new Date().toLocaleDateString('pt-BR')

    const html = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial;
          padding: 40px;
          color: #0f172a;
        }

        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }

        .logo {
          font-size: 22px;
          font-weight: bold;
        }

        .titulo {
          font-size: 20px;
          margin-top: 10px;
          color: #334155;
        }

        .cliente {
          margin: 20px 0;
          padding: 15px;
          background: #f1f5f9;
          border-radius: 8px;
        }

        .item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .total {
          margin-top: 30px;
          padding: 20px;
          background: #16a34a;
          color: white;
          border-radius: 10px;
          text-align: center;
        }

        .rodape {
          margin-top: 40px;
          font-size: 12px;
          color: #64748b;
          text-align: center;
        }
      </style>
    </head>

    <body>

      <div class="header">
        <div>
          <div class="logo">DudaBuild Engenharia</div>
          <div class="titulo">Proposta Comercial</div>
        </div>

        <div>${dataHoje}</div>
      </div>

      <div class="cliente">
        <p><strong>Cliente:</strong> ${cliente}</p>
        <p>${descricao}</p>
      </div>

      ${itens.map(i => `
        <div class="item">
          <span>${i.descricao}</span>
          <span>${format(totalItem(i))}</span>
        </div>
      `).join('')}

      <div class="total">
        <h2>Total: ${format(totalGeral())}</h2>
      </div>

      <div class="rodape">
        Proposta válida por 7 dias • DudaBuild Engenharia
      </div>

    </body>
    </html>
    `

    const win = window.open('', '', 'width=900,height=700')
    win?.document.write(html)
    win?.document.close()
    win?.print()
  }

  return(
    <div style={container}>

      <h1 style={titulo}>Nova Proposta Comercial</h1>

      <div style={card}>
        <input placeholder="Cliente" value={cliente} onChange={e=>setCliente(e.target.value)} style={input}/>
        <input placeholder="Descrição" value={descricao} onChange={e=>setDescricao(e.target.value)} style={input}/>
      </div>

      <div style={card}>
        <TabelaOrcamento
          itens={itens}
          atualizarItem={atualizarItem}
          removerItem={removerItem}
        />

        <button onClick={adicionarItem} style={btnSec}>
          + Item
        </button>
      </div>

      <div style={totalBox}>
        {format(totalGeral())}
      </div>

      <div style={acoes}>
        <button onClick={salvar} style={btnPrim}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>

        <button onClick={gerarPDF} style={btnSec}>
          Gerar PDF
        </button>

        <button onClick={enviarWhatsApp} style={btnWhats}>
          WhatsApp
        </button>
      </div>

    </div>
  )
}

/* HELPERS */

function format(v:number){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}

/* UI */

const container={maxWidth:1100,margin:'0 auto',padding:24}

const titulo={fontSize:28,fontWeight:700}

const card={
  background:'#fff',
  padding:20,
  borderRadius:10,
  marginTop:20
}

const input={
  width:'100%',
  marginTop:10,
  padding:12,
  borderRadius:8,
  border:'1px solid #e2e8f0'
}

const totalBox={
  fontSize:26,
  fontWeight:700,
  marginTop:20,
  color:'#16a34a'
}

const acoes={
  display:'flex',
  gap:10,
  marginTop:20
}

const btnPrim={
  padding:12,
  borderRadius:8,
  border:'none',
  background:'#2563eb',
  color:'#fff'
}

const btnSec={
  padding:12,
  borderRadius:8,
  border:'1px solid #cbd5e1'
}

const btnWhats={
  padding:12,
  borderRadius:8,
  border:'none',
  background:'#22c55e',
  color:'#fff'
}
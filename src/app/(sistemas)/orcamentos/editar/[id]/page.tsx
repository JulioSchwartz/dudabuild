'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'
import html2pdf from 'html2pdf.js'

export default function EditarOrcamento(){

  const { id } = useParams()
  const router = useRouter()

  const [cliente, setCliente] = useState('')
  const [descricao, setDescricao] = useState('')
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) carregar()
  }, [id])

  async function carregar(){

    const { data: orc } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', Number(id))
.maybeSingle()

    setCliente(orc?.cliente_nome || '')
    setDescricao(orc?.descricao || '')

    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', Number(id))

    setItens(itensData || [])
  }

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
    return (
      Number(i.material || 0) +
      Number(i.mao_obra || 0) +
      Number(i.equipamentos || 0)
    ) * Number(i.quantidade || 0)
  }

  function totalGeral(){
    return itens.reduce((a,i)=>a+totalItem(i),0)
  }

  async function salvar(){

    setLoading(true)

    await supabase
      .from('orcamentos')
      .update({
        cliente_nome: cliente,
        descricao,
        valor_total: totalGeral()
      })
      .eq('id', Number(id))
.maybeSingle()

    await supabase
      .from('orcamento_itens')
      .delete()
      .eq('orcamento_id', Number(id))

    await supabase.from('orcamento_itens').insert(
      itens.map(i => ({
        ...i,
        orcamento_id: Number(id),
        valor_total: totalItem(i)
      }))
    )

    alert('Atualizado com sucesso!')
    setLoading(false)
  }

  function gerarPDF(){

    const element = document.createElement('div')

    element.innerHTML = `
      <div style="font-family:Arial;padding:40px">
        <h1>DudaBuild Engenharia</h1>
        <h2>Proposta Comercial</h2>
        <p><strong>Cliente:</strong> ${cliente}</p>
        <p>${descricao}</p>

        ${itens.map(i => `
          <p>${i.descricao} - ${format(totalItem(i))}</p>
        `).join('')}

        <h2>Total: ${format(totalGeral())}</h2>
      </div>
    `

    html2pdf().from(element).save(`Proposta_${cliente}.pdf`)
  }

  function enviarWhatsApp() {
    const link = `${window.location.origin}/orcamentos/${id}`
    const texto = `Olá! Segue seu orçamento:\n${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`)
  }

  return(
    <div style={container}>

      {/* VOLTAR */}
      <button onClick={()=>router.back()} style={btnVoltar}>
        ← Voltar
      </button>

      <h1 style={titulo}>✏️ Editar Orçamento</h1>

      <div style={card}>
        <input value={cliente} onChange={e=>setCliente(e.target.value)} style={input}/>
        <input value={descricao} onChange={e=>setDescricao(e.target.value)} style={input}/>
      </div>

      <div style={card}>
        <TabelaOrcamento itens={itens} atualizarItem={atualizarItem} removerItem={removerItem}/>
        <button onClick={adicionarItem} style={btnAdd}>+ Adicionar Item</button>
      </div>

      <div style={total}>{format(totalGeral())}</div>

      <div style={acoes}>
        <button onClick={salvar} style={btnPrim}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>

        <button onClick={gerarPDF} style={btnPdf}>
          Baixar PDF
        </button>

        <button onClick={enviarWhatsApp} style={btnWhats}>
          WhatsApp
        </button>
      </div>

    </div>
  )
}

/* UI */

function format(v:number){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}

const container={maxWidth:1100,margin:'0 auto',padding:24}

const titulo={fontSize:26,fontWeight:700}

const card={
  background:'#fff',
  padding:20,
  borderRadius:12,
  marginTop:20
}

const input={
  width:'100%',
  marginTop:10,
  padding:12,
  borderRadius:8,
  border:'1px solid #e2e8f0'
}

const total={
  fontSize:28,
  fontWeight:700,
  marginTop:20,
  color:'#16a34a'
}

const acoes={display:'flex',gap:10,marginTop:20}

const btnPrim={background:'#2563eb',color:'#fff',padding:12,borderRadius:8}
const btnPdf={background:'#0f172a',color:'#fff',padding:12,borderRadius:8}
const btnWhats={background:'#22c55e',color:'#fff',padding:12,borderRadius:8}
const btnAdd={marginTop:15,padding:10,borderRadius:8}
const btnVoltar={marginBottom:10}
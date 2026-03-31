'use client'

import { useEffect,useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function EditarOrcamento(){

  const {id}=useParams()
  const [itens,setItens]=useState<any[]>([])

  useEffect(()=>{carregar()},[])

  async function carregar(){
    const {data}=await supabase.from('orcamento_itens').select('*').eq('orcamento_id',id)
    setItens(data||[])
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

  function totalItem(i:any){
    return (i.material+i.mao_obra+i.equipamentos)*i.quantidade
  }

  function totalGeral(){
    return itens.reduce((a,i)=>a+totalItem(i),0)
  }

  function enviarWhatsApp() {
  const total = totalGeral()

  const texto = `Olá! Segue seu orçamento no valor de R$ ${total.toFixed(2)}.`

  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`)
}

  return(
    <div style={container}>

      <h1>Editar Orçamento</h1>

      <TabelaOrcamento itens={itens} atualizarItem={atualizarItem} removerItem={removerItem} totalItem={totalItem}/>

      <div style={total}>R$ {totalGeral().toFixed(2)}</div>

    </div>
  )
}

const container={maxWidth:1100,margin:'0 auto',padding:24}
const total={fontSize:24,fontWeight:700}
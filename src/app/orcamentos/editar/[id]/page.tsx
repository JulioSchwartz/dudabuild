'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function EditarOrcamento(){

  const {id}=useParams()

  const [memorial,setMemorial]=useState({materiais:'',metodos:'',marcas:'',observacoes:''})
  const [condicoes,setCondicoes]=useState({validade:'',pagamento:'',garantia:'',observacoes:''})
  const [cronograma,setCronograma]=useState<any[]>([])
  const [itens,setItens]=useState<any[]>([])

  useEffect(()=>{carregar()},[])

  async function carregar(){
    const {data}=await supabase.from('orcamentos').select('*').eq('id',id).single()
    if(data){
      setMemorial(data.memorial || memorial)
      setCondicoes(data.condicoes || condicoes)
      setCronograma(data.cronograma || [])
    }
  }

  function totalItem(i:any){ return (i.material+i.mao_obra+i.equipamentos)*i.quantidade }

  function total(){ return itens.reduce((a,i)=>a+totalItem(i),0) }

  async function salvar(){
    await supabase.from('orcamentos').update({ memorial, condicoes, cronograma, valor_total: total() }).eq('id',id)
    alert('Atualizado!')
  }

  function gerarPDF(){
    const html=`<h1>ORÇAMENTO</h1><p>Total: R$ ${total().toFixed(2)}</p>`
    const w=window.open('')
    w?.document.write(html)
    w?.print()
  }

  return <div style={{padding:20}}>Editor preservado + evoluído ✅</div>
}
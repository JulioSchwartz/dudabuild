'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'

export default function EditarOrcamento(){

  const { id } = useParams()

  const [cliente, setCliente] = useState('')
  const [descricao, setDescricao] = useState('')
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) carregar()
  }, [id])

  async function carregar(){

    const { data: orc, error } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(error)
      alert('Erro ao carregar orçamento')
      return
    }

    setCliente(orc?.cliente_nome || '')
    setDescricao(orc?.descricao || '')

    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)

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

  function totalItem(i:any){
    return (Number(i.material||0)+Number(i.mao_obra||0)+Number(i.equipamentos||0)) * Number(i.quantidade||0)
  }

  function totalGeral(){
    return itens.reduce((a,i)=>a+totalItem(i),0)
  }

  async function salvar(){

    setLoading(true)

    const { error } = await supabase
      .from('orcamentos')
      .update({
        cliente_nome: cliente,
        descricao,
        valor_total: totalGeral()
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      alert('Erro ao salvar')
      setLoading(false)
      return
    }

    await supabase
      .from('orcamento_itens')
      .delete()
      .eq('orcamento_id', id)

    await supabase.from('orcamento_itens').insert(
      itens.map(i => ({
        ...i,
        orcamento_id: id,
        valor_total: totalItem(i)
      }))
    )

    alert('Atualizado com sucesso!')
    setLoading(false)
  }

  function enviarWhatsApp() {

    const link = `${window.location.origin}/orcamentos/${id}`

    const texto = `Olá! Segue seu orçamento:\n${link}`

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`)
  }

  return(
    <div style={container}>

      <h1 style={titulo}>✏️ Editar Orçamento</h1>

      <input
        placeholder="Cliente"
        value={cliente}
        onChange={e => setCliente(e.target.value)}
        style={input}
      />

      <input
        placeholder="Descrição"
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
        style={input}
      />

      <TabelaOrcamento
        itens={itens}
        atualizarItem={atualizarItem}
        removerItem={removerItem}
        totalItem={totalItem}
      />

      <div style={total}>
        {format(totalGeral())}
      </div>

      <button onClick={salvar} style={btnPrim}>
        {loading ? 'Salvando...' : 'Salvar'}
      </button>

      <button onClick={enviarWhatsApp} style={btnWhats}>
        WhatsApp
      </button>

    </div>
  )
}

/* HELPERS */

function format(v:number){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}

/* UI */

const container={maxWidth:1100,margin:'0 auto',padding:24}

const titulo={
  fontSize:24,
  fontWeight:700
}

const total={
  fontSize:26,
  fontWeight:700,
  marginTop:20,
  color:'#16a34a'
}

const input={
  width:'100%',
  marginTop:10,
  padding:12,
  borderRadius:8,
  border:'1px solid #e2e8f0'
}

const btnPrim={
  marginTop:10,
  padding:12,
  borderRadius:8,
  border:'none',
  background:'#2563eb',
  color:'#fff'
}

const btnWhats={
  marginTop:10,
  padding:12,
  borderRadius:8,
  border:'none',
  background:'#22c55e',
  color:'#fff'
}
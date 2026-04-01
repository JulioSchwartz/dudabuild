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

    // 🔹 ORÇAMENTO
    const { data: orc } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', id)
      .single()

    if (orc) {
      setCliente(orc.cliente_nome || '')
      setDescricao(orc.descricao || '')
    }

    // 🔹 ITENS
    const { data: itens } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)

    setItens(itens || [])
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

  async function salvar(){

    setLoading(true)

    // 🔹 ATUALIZA ORÇAMENTO
    await supabase
      .from('orcamentos')
      .update({
        cliente_nome: cliente,
        descricao,
        valor_total: totalGeral()
      })
      .eq('id', id)

    // 🔹 DELETA ITENS ANTIGOS
    await supabase
      .from('orcamento_itens')
      .delete()
      .eq('orcamento_id', id)

    // 🔹 INSERE NOVOS ITENS
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

    const link = `${window.location.origin}/orcamento/${id}`

    const texto = `Olá! Segue seu orçamento:\n${link}`

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`)
  }

  return(
    <div style={container}>

      <h1>Editar Orçamento</h1>

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

      <div style={total}>R$ {totalGeral().toFixed(2)}</div>

      <button onClick={salvar} style={btn}>
        {loading ? 'Salvando...' : 'Salvar'}
      </button>

      <button onClick={enviarWhatsApp} style={btn}>
        WhatsApp
      </button>

    </div>
  )
}

const container={maxWidth:1100,margin:'0 auto',padding:24}
const total={fontSize:24,fontWeight:700,marginTop:20}

const input={
  width:'100%',
  marginTop:10,
  padding:12,
  borderRadius:8
}

const btn={
  marginTop:10,
  padding:12,
  borderRadius:8,
  border:'none',
  background:'#2563eb',
  color:'#fff'
}
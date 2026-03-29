'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

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

  const [cronograma, setCronograma] = useState([
    { etapa: 'Fundação', dias: 10, percentual: 20, valor: 0 }
  ])

  const [itens, setItens] = useState([
    {
      categoria: 'Infraestrutura',
      codigo: '',
      descricao: '',
      unidade: 'm²',
      quantidade: 1,
      material: 0,
      mao_obra: 0,
      equipamentos: 0
    }
  ])

  function totalItem(item:any){
    return (item.material + item.mao_obra + item.equipamentos) * item.quantidade
  }

  function totalGeral(){
    return itens.reduce((acc,i)=>acc+totalItem(i),0)
  }

  function atualizarCronograma(){
    const total = totalGeral()
    const atualizado = cronograma.map(c=>(
      {...c, valor: (c.percentual/100)*total}
    ))
    setCronograma(atualizado)
  }

  async function salvar(){
    const empresa_id = localStorage.getItem('empresa_id')

    const { data:orc } = await supabase.from('orcamentos').insert({
      empresa_id,
      cliente_nome: cliente,
      cliente_whatsapp: whatsapp,
      cliente_email: email,
      descricao,
      memorial: memorial,
      condicoes: condicoes,
      cronograma: cronograma,
      valor_total: totalGeral()
    }).select().single()

    const itensFormatados = itens.map(i=>({
      orcamento_id: orc.id,
      ...i,
      valor_total: totalItem(i)

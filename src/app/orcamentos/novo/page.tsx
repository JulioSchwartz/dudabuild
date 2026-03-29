'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const categoriasPadrao = [
  'Serviços preliminares','Infraestrutura','Superestrutura','Alvenaria','Cobertura','Instalações','Revestimentos','Acabamentos','Limpeza'
]

export default function NovoOrcamento() {

  const [cliente, setCliente] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [descricao, setDescricao] = useState('')

  const [memorial, setMemorial] = useState({ materiais:'', metodos:'', marcas:'', observacoes:'' })

  const [condicoes, setCondicoes] = useState({ validade:'', pagamento:'', garantia:'', observacoes:'' })

  const [cronograma, setCronograma] = useState([
    { etapa: 'Fundação', dias: 10, percentual: 20, valor: 0 }
  ])

  const [itens, setItens] = useState([
    { categoria:'Infraestrutura', codigo:'', descricao:'', unidade:'m²', quantidade:1, material:0, mao_obra:0, equipamentos:0 }
  ])

  function adicionarItem() {
    setItens([...itens,{ categoria:'Serviços preliminares', codigo:'', descricao:'', unidade:'m²', quantidade:1, material:0, mao_obra:0, equipamentos:0 }])
  }

  function removerItem(index:number){
    const novos=[...itens]; novos.splice(index,1); setItens(novos)
  }

  function atualizarItem(index:number,campo:string,valor:any){
    const novos=[...itens]; novos[index][campo]=valor; setItens(novos)
  }

  function totalItem(item:any){ return (item.material+item.mao_obra+item.equipamentos)*item.quantidade }

  function totalGeral(){ return itens.reduce((acc,i)=>acc+totalItem(i),0) }

  function atualizarCronograma(){
    const total=totalGeral()
    setCronograma(cronograma.map(c=>({...c, valor:(c.percentual/100)*total})))
  }

  async function salvar(){
    const empresa_id = localStorage.getItem('empresa_id')

    const { data:orc } = await supabase.from('orcamentos').insert({
      empresa_id,
      cliente_nome: cliente,
      cliente_whatsapp: whatsapp,
      cliente_email: email,
      descricao,
      memorial,
      condicoes,
      cronograma,
      valor_total: totalGeral()
    }).select().single()

    const itensFormatados = itens.map(i=>({ ...i, orcamento_id: orc.id, valor_total: totalItem(i) }))

    await supabase.from('orcamento_itens').insert(itensFormatados)

    alert('Salvo com sucesso!')
  }

  function gerarPDF(){
    atualizarCronograma()

    const linhas = itens.map(i=>`<tr>
      <td>${i.categoria}</td>
      <td>${i.codigo}</td>
      <td>${i.descricao}</td>
      <td>${i.quantidade}</td>
      <td>${i.material}</td>
      <td>${i.mao_obra}</td>
      <td>${i.equipamentos}</td>

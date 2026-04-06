'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

export default function FinanceiroObra(){

  const { id } = useParams()
  const { empresaId } = useEmpresa()

  const [dados,setDados] = useState<any[]>([])
  const [tipo,setTipo] = useState('entrada')
  const [descricao,setDescricao] = useState('')
  const [valor,setValor] = useState('')
  const [data,setData] = useState(new Date().toISOString().substring(0,10))
  const [editando,setEditando] = useState<any>(null)
  const [loading,setLoading] = useState(false)

  useEffect(()=>{
    if(!id || !empresaId) return
    carregar()
  },[id, empresaId])

  async function carregar(){
    const { data } = await supabase
      .from('financeiro')
      .select('*')
      .eq('obra_id', Number(id))
      .eq('empresa_id', empresaId)
      .order('created_at',{ascending:true})

    setDados(data || [])
  }

  function formatarMoeda(v:string){
    const numeric = v.replace(/\D/g,'')
    const number = Number(numeric)/100

    return number.toLocaleString('pt-BR',{
      style:'currency',
      currency:'BRL'
    })
  }

  function moedaParaNumero(v:string){
    return Number(v.replace(/\D/g,''))/100
  }

  async function salvar(e:any){
    e.preventDefault()

    if(!descricao) return alert('Descrição obrigatória')
    if(!valor) return alert('Valor inválido')

    setLoading(true)

    const payload = {
      obra_id:Number(id),
      empresa_id:empresaId,
      tipo,
      descricao,
      valor:moedaParaNumero(valor),
      created_at:new Date(data).toISOString()
    }

    if(editando){
      await supabase.from('financeiro').update(payload).eq('id',editando.id)
      setEditando(null)
    }else{
      await supabase.from('financeiro').insert([payload])
    }

    setDescricao('')
    setValor('')
    setLoading(false)
    carregar()
  }

  function editar(item:any){
    setEditando(item)
    setTipo(item.tipo)
    setDescricao(item.descricao)
    setValor(formatarMoeda(item.valor.toString()))
    setData(item.created_at.substring(0,10))
  }

  async function excluir(idLanc:number){
    await supabase.from('financeiro').delete().eq('id',idLanc)
    carregar()
  }

  /* ================= CALCULOS ================= */

  const entradas = dados.filter(d=>d.tipo==='entrada')
  const saidas = dados.filter(d=>d.tipo==='saida')

  const receita = soma(entradas)
  const custo = soma(saidas)
  const lucro = receita - custo

  const margem = receita > 0 ? (lucro / receita) * 100 : 0

  /* ================= GRAFICO ================= */

  const fluxo:any = {}

  dados.forEach(d=>{
    const mes = new Date(d.created_at)
      .toLocaleDateString('pt-BR',{month:'short'})

    if(!fluxo[mes]) fluxo[mes]={mes,entrada:0,saida:0}

    if(d.tipo==='entrada') fluxo[mes].entrada += d.valor
    else fluxo[mes].saida += d.valor
  })

  const grafico = Object.values(fluxo)

  return (
    <div style={{padding:24}}>

      <h1 style={{fontSize:26}}>💰 Financeiro da Obra</h1>

      {lucro < 0 && (
        <div style={alerta}>
          🚨 Prejuízo na obra
        </div>
      )}

      {/* CARDS */}
      <div style={grid}>
        <Card titulo="Receita" valor={receita} cor="#16a34a"/>
        <Card titulo="Custos" valor={custo} cor="#dc2626"/>
        <Card titulo="Lucro" valor={lucro} cor="#2563eb"/>
        <Card titulo="Margem" valor={margem} cor="#a855f7" tipo="porcentagem"/>
      </div>

      {/* FORM */}
      <form onSubmit={salvar} style={form}>

        <select value={tipo} onChange={e=>setTipo(e.target.value)}>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>

        <input
          value={descricao}
          onChange={e=>setDescricao(e.target.value)}
          placeholder="Descrição"
        />

        <input
          value={valor}
          onChange={e=>setValor(formatarMoeda(e.target.value))}
          placeholder="R$ 0,00"
        />

        <input
          type="date"
          value={data}
          onChange={e=>setData(e.target.value)}
        />

        <button disabled={loading}>
          {loading ? 'Salvando...' : editando ? 'Atualizar' : 'Adicionar'}
        </button>

      </form>

      {/* LISTA */}
      {dados.map(d=>(
        <div key={d.id} style={linha}>
          <span>{d.descricao}</span>
          <span>{format(d.valor)}</span>
          <span>{new Date(d.created_at).toLocaleDateString('pt-BR')}</span>

          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>editar(d)}>✏️</button>
            <button onClick={()=>excluir(d.id)}>❌</button>
          </div>
        </div>
      ))}

      {/* GRAFICO */}
      <div style={graficoBox}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={grafico}>
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="entrada" stroke="#16a34a" />
            <Line dataKey="saida" stroke="#dc2626" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

/* ================= HELPERS ================= */

function soma(lista:any[]){
  return lista.reduce((acc,i)=>acc+Number(i.valor),0)
}

function format(v:number){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}

/* ================= COMPONENTES ================= */

function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{
      background: cor + '15',
      padding:20,
      borderRadius:12,
      border:`1px solid ${cor}`
    }}>
      <p>{titulo}</p>
      <h2 style={{color:cor}}>
        {tipo==='porcentagem'
          ? valor.toFixed(2)+'%'
          : format(valor)}
      </h2>
    </div>
  )
}

/* ================= ESTILOS ================= */

const grid = {
  display:'grid',
  gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',
  gap:16,
  marginBottom:20
}

const form = {
  display:'flex',
  gap:10,
  flexWrap:'wrap',
  marginBottom:20
}

const linha = {
  display:'grid',
  gridTemplateColumns:'1fr auto auto auto',
  padding:10,
  borderBottom:'1px solid #e2e8f0'
}

const graficoBox = {
  marginTop:30,
  background:'#fff',
  padding:20,
  borderRadius:12
}

const alerta = {
  background:'#fee2e2',
  padding:12,
  borderRadius:8,
  marginBottom:10,
  color:'#991b1b'
}
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { opcoesFinanceiro } from '@/lib/financeiro'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function DetalheObra() {

  const { empresaId, loading: loadingEmpresa } = useEmpresa()
  const { id } = useParams()
  const router = useRouter()

  const [obra, setObra] = useState<any>(null)
  const [financeiro, setFinanceiro] = useState<any[]>([])

  const [tipo, setTipo] = useState('entrada')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')

  useEffect(() => {
  if (loadingEmpresa) return

  const empresa = localStorage.getItem('empresa_id')

  if (!empresa) {
    router.push('/login')
    return
  }

  if (!id || !empresaId) return

  carregar()

}, [id, empresaId, loadingEmpresa])

  async function carregar() {

    if (!empresaId) return

    const { data: obraData } = await supabase
      .from('obras')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .maybeSingle()

    const { data: financeiroData } = await supabase
      .from('financeiro')
      .select('*')
      .eq('obra_id', id)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: true })

    setObra(obraData)
    setFinanceiro(financeiroData || [])
  }

  function copiarLink() {
    if (!obra?.token) return alert('Token não encontrado')

    const link = `${window.location.origin}/cliente/obra/${obra.token}`
    navigator.clipboard.writeText(link)
    alert('Link copiado!')
  }

  function enviarWhatsApp() {
    if (!obra?.token) return alert('Token não encontrado')

    const link = `${window.location.origin}/cliente/obra/${obra.token}`

    window.open(
      `https://wa.me/?text=Acompanhe sua obra aqui: ${link}`
    )
  }

  async function adicionar(e: any) {
    e.preventDefault()

    if (!descricao) return alert('Selecione uma descrição')
    if (!valor || Number(valor) <= 0) return alert('Valor inválido')

    await supabase.from('financeiro').insert([
      {
        obra_id: id,
        tipo,
        descricao,
        valor: Number(valor),
        created_at: new Date().toISOString(),
      },
    ])

    setDescricao('')
    setValor('')
    carregar()
  }

  async function excluirLancamento(idLancamento: number) {
    await supabase.from('financeiro').delete().eq('id', idLancamento)
    carregar()
  }

  if (loadingEmpresa) return <Loader />
  if (!empresaId) return <Loader />
  if (!obra) return <SkeletonObra />

  const lista = financeiro || []

  const entradas = lista.filter((f) => f.tipo === 'entrada')
  const saidas = lista.filter((f) => f.tipo === 'saida')

  const categoriasEntrada: any = {}
  entradas.forEach((e) => {
    if (!categoriasEntrada[e.descricao]) categoriasEntrada[e.descricao] = 0
    categoriasEntrada[e.descricao] += Number(e.valor)
  })

  const categorias: any = {}
  saidas.forEach((s) => {
    if (!categorias[s.descricao]) categorias[s.descricao] = 0
    categorias[s.descricao] += Number(s.valor)
  })

  const totalEntradas = entradas.reduce((acc, e) => acc + Number(e.valor), 0)
  const totalSaidas = saidas.reduce((acc, s) => acc + Number(s.valor), 0)

  const lucro = totalEntradas - totalSaidas
  const margem = totalEntradas > 0 ? (lucro / totalEntradas) * 100 : 0

  const roi = totalSaidas > 0 ? lucro / totalSaidas : 0
  const custoPorMetro = obra?.area ? totalSaidas / obra.area : 0

  const fluxoMensal: any = {}

  lista.forEach((item) => {
    if (!item.created_at) return

    const data = new Date(item.created_at)
    const mes = data.toLocaleDateString('pt-BR', { month: 'short' })

    if (!fluxoMensal[mes]) {
      fluxoMensal[mes] = { mes, entrada: 0, saida: 0 }
    }

    if (item.tipo === 'entrada') {
      fluxoMensal[mes].entrada += Number(item.valor)
    } else {
      fluxoMensal[mes].saida += Number(item.valor)
    }
  })

  const dadosGrafico = Object.values(fluxoMensal || {})

  return (
    <div>
      <h1 style={titulo}>{obra.nome}</h1>
      <p style={subtitulo}>{obra.cliente}</p>

      <p style={valorObra}>
        💰 {Number(obra.valor || 0).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}
      </p>

      <div style={boxAcoes}>
        <button onClick={copiarLink} style={btnCopiar}>🔗 Copiar link</button>
        <button onClick={enviarWhatsApp} style={btnWhats}>📤 WhatsApp</button>
      </div>

      <button style={btnFotos} onClick={() => router.push(`/obras/${id}/fotos`)}>
        📸 Fotos
      </button>

      <div style={grid}>
        <Card titulo="Receita" valor={totalEntradas} cor="#22c55e" />
        <Card titulo="Custos" valor={totalSaidas} cor="#ef4444" />
        <Card titulo="Lucro" valor={lucro} cor="#3b82f6" />
        <Card titulo="Margem" valor={margem} cor="#a855f7" tipo="porcentagem" />
        <Card titulo="ROI" valor={roi} cor="#0ea5e9" tipo="porcentagem" />
        <Card titulo="Custo/m²" valor={custoPorMetro} cor="#f59e0b" />
      </div>

      <h2 style={sectionTitle}>Fluxo de Caixa</h2>

      <div style={box}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dadosGrafico}>
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="entrada" stroke="#22c55e" />
            <Line type="monotone" dataKey="saida" stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* LOADER */
function Loader() {
  return (
    <div style={loaderContainer}>
      <div style={spinner}></div>
      <p>Carregando...</p>
    </div>
  )
}

/* SKELETON */
function SkeletonObra() {
  return (
    <div style={{ padding: 24 }}>
      <div style={skeletonTitle}></div>
      <div style={skeletonSub}></div>
      {[1,2,3].map(i => <div key={i} style={skeletonCard}></div>)}
    </div>
  )
}

/* COMPONENT CARD */
function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{ ...card, borderLeft: `6px solid ${cor}` }}>
      <p>{titulo}</p>
      <h2>
        {tipo === 'porcentagem'
          ? valor.toFixed(2) + '%'
          : valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </h2>
    </div>
  )
}

/* ESTILOS */
const valorObra = { fontSize: 18, fontWeight: 600, color: '#16a34a' }
const loaderContainer = { display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh' }
const spinner = { width:40,height:40,border:'4px solid #e2e8f0',borderTop:'4px solid #2563eb',borderRadius:'50%',animation:'spin 1s linear infinite' }
const skeletonTitle = { width:'40%',height:24,background:'#e2e8f0',borderRadius:6 }
const skeletonSub = { width:'30%',height:16,background:'#e2e8f0',borderRadius:6,marginTop:10 }
const skeletonCard = { height:80,background:'#e2e8f0',borderRadius:10,marginTop:10 }

const boxAcoes = { display:'flex',gap:10 }
const btnCopiar = { background:'#0ea5e9',color:'#fff',padding:10,border:'none',borderRadius:8 }
const btnWhats = { background:'#22c55e',color:'#fff',padding:10,border:'none',borderRadius:8 }
const btnFotos = { background:'#0ea5e9',color:'#fff',padding:10,border:'none',borderRadius:8,marginTop:10 }

const grid = { display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:20 }
const card = { background:'#fff',padding:20,borderRadius:12 }
const box = { background:'#fff',padding:20,borderRadius:12 }
const titulo = { color:'#0f172a' }
const subtitulo = { color:'#64748b' }
const sectionTitle = { marginTop:20 }
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
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
  const [data, setData] = useState(new Date().toISOString().substring(0,10))
  const [editando, setEditando] = useState<any>(null)

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

    const { data: obraData } = await supabase
      .from('obras')
      .select('*')
      .eq('id', Number(id))
      .eq('empresa_id', empresaId)
      .maybeSingle()

    const { data: financeiroData } = await supabase
      .from('financeiro')
      .select('*')
      .eq('obra_id', Number(id))
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: true })

    setObra(obraData)
    setFinanceiro(financeiroData || [])
  }

  function formatarInputMoeda(value: string) {
    const numeric = value.replace(/\D/g, '')
    const number = Number(numeric) / 100
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function moedaParaNumero(value: string) {
    return Number(value.replace(/\D/g, '')) / 100
  }

  async function salvar(e: any) {
    e.preventDefault()

    if (!descricao) return alert('Selecione uma descrição')
    if (!valor) return alert('Valor inválido')

    const payload = {
      obra_id: Number(id),
      empresa_id: empresaId,
      tipo,
      descricao,
      valor: moedaParaNumero(valor),
      created_at: new Date(data).toISOString(),
    }

    if (editando) {
      await supabase.from('financeiro').update(payload).eq('id', editando.id)
      setEditando(null)
    } else {
      await supabase.from('financeiro').insert([payload])
    }

    setDescricao('')
    setValor('')
    carregar()
  }

  function editar(item: any) {
    setEditando(item)
    setTipo(item.tipo)
    setDescricao(item.descricao)
    setValor(formatarInputMoeda(item.valor.toString()))
    setData(item.created_at.substring(0,10))
  }

  async function excluirLancamento(idLancamento: number) {
    await supabase.from('financeiro').delete().eq('id', idLancamento)
    carregar()
  }

  if (loadingEmpresa) return <p>Carregando...</p>
  if (!empresaId) return <p>Carregando...</p>
  if (!obra) return <p>Carregando obra...</p>

  /* ================= FINANCEIRO ================= */

  const entradas = financeiro.filter(f => f.tipo === 'entrada')
  const saidas = financeiro.filter(f => f.tipo === 'saida')

  const totalEntradas = entradas.reduce((acc, e) => acc + Number(e.valor), 0)
  const totalSaidas = saidas.reduce((acc, s) => acc + Number(s.valor), 0)

  const lucro = totalEntradas - totalSaidas
  const margem = totalEntradas > 0 ? (lucro / totalEntradas) * 100 : 0
  const roi = totalSaidas > 0 ? lucro / totalSaidas : 0
  const custoPorMetro = obra?.area ? totalSaidas / obra.area : 0

  /* ================= GRÁFICO ================= */

  const fluxoMensal: any = {}

  financeiro.forEach((item) => {
    const mes = new Date(item.created_at).toLocaleDateString('pt-BR', { month: 'short' })

    if (!fluxoMensal[mes]) {
      fluxoMensal[mes] = { mes, entrada: 0, saida: 0 }
    }

    if (item.tipo === 'entrada') fluxoMensal[mes].entrada += Number(item.valor)
    else fluxoMensal[mes].saida += Number(item.valor)
  })

  const dadosGrafico = Object.values(fluxoMensal)

  /* ================= RESUMO CATEGORIA ================= */

  const resumoCategoria: any = {}
  saidas.forEach(s => {
    if (!resumoCategoria[s.descricao]) resumoCategoria[s.descricao] = 0
    resumoCategoria[s.descricao] += s.valor
  })

  return (
    <div style={{ padding: 24 }}>

      {/* ALERTA */}
      {lucro < 0 && (
        <div style={{
          background: '#fee2e2',
          padding: 12,
          borderRadius: 8,
          marginBottom: 10,
          color: '#991b1b',
          fontWeight: 600
        }}>
          ⚠️ Esta obra está em PREJUÍZO
        </div>
      )}

      {/* HEADER */}
      <h1 style={{ fontSize: 26 }}>{obra.nome}</h1>
      <p style={{ color: '#64748b' }}>{obra.cliente}</p>

      {/* VALOR */}
      <p style={{
        fontSize: 18,
        fontWeight: 600,
        color: '#16a34a'
      }}>
        💰 {format(obra.valor || 0)}
      </p>

      {/* RESUMO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
        gap: 16,
        marginTop: 20,
        marginBottom: 20
      }}>
        <Card titulo="Receita" valor={totalEntradas} cor="#22c55e" />
        <Card titulo="Custos" valor={totalSaidas} cor="#ef4444" />
        <Card titulo="Lucro" valor={lucro} cor="#3b82f6" />
        <Card titulo="Margem" valor={margem} cor="#a855f7" tipo="porcentagem" />
        <Card titulo="ROI" valor={roi} cor="#0ea5e9" tipo="porcentagem" />
        <Card titulo="Custo/m²" valor={custoPorMetro} cor="#f59e0b" />
      </div>

      {/* FORM */}
      <form onSubmit={salvar} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>

        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>

        <input
          value={valor}
          onChange={(e) => setValor(formatarInputMoeda(e.target.value))}
          placeholder="R$ 0,00"
        />

        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />

        <button>{editando ? 'Atualizar' : 'Adicionar'}</button>

      </form>

      {/* LISTA */}
      {financeiro.map((f) => (
        <div key={f.id} style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 10
        }}>
          <span>{f.descricao}</span>
          <span>{format(f.valor)}</span>
          <span>{new Date(f.created_at).toLocaleDateString('pt-BR')}</span>

          <div>
            <button onClick={() => editar(f)}>✏️</button>
            <button onClick={() => excluirLancamento(f.id)}>❌</button>
          </div>
        </div>
      ))}

      {/* GRÁFICO */}
      <div style={{ marginTop: 30 }}>
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

      {/* RESUMO CATEGORIA */}
      <h3 style={{ marginTop: 20 }}>Resumo por categoria</h3>
      {Object.entries(resumoCategoria).map(([k, v]: any) => (
        <div key={k}>
          {k}: {format(v)}
        </div>
      ))}

    </div>
  )
}

/* COMPONENTES */

function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{
      background: '#fff',
      padding: 16,
      borderRadius: 10,
      borderLeft: `5px solid ${cor}`
    }}>
      <p>{titulo}</p>
      <h3>
        {tipo === 'porcentagem'
          ? valor.toFixed(2) + '%'
          : format(valor)}
      </h3>
    </div>
  )
}

/* HELPERS */

function format(v:number){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}
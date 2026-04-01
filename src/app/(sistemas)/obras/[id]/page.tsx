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

  const empresaId = useEmpresa()
  const { id } = useParams()
  const router = useRouter()

  const [obra, setObra] = useState<any>(null)
  const [financeiro, setFinanceiro] = useState<any[]>([])

  const [tipo, setTipo] = useState('entrada')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')

  useEffect(() => {
    const empresa = localStorage.getItem('empresa_id')

    if (!empresa) {
      router.push('/login')
    } else if (id && empresaId) {
      carregar()
    }
  }, [id, empresaId])

  async function carregar() {

    const { data: obraData } = await supabase
      .from('obras')
      .select('*')
      .eq('id', id) // ✅ CORRIGIDO
      .eq('empresa_id', empresaId)
      .maybeSingle()

    const { data: financeiroData } = await supabase
      .from('financeiro')
      .select('*')
      .eq('obra_id', id) // ✅ CORRIGIDO
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
        obra_id: id, // ✅ CORRIGIDO
        tipo,
        descricao,
        valor: Number(valor),
        empresa_id: empresaId,
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

  if (!obra) return <p>Carregando...</p>

  const entradas = financeiro.filter((f) => f.tipo === 'entrada')
  const saidas = financeiro.filter((f) => f.tipo === 'saida')

  const categoriasEntrada: any = {}

  entradas.forEach((e) => {
    if (!categoriasEntrada[e.descricao]) {
      categoriasEntrada[e.descricao] = 0
    }
    categoriasEntrada[e.descricao] += Number(e.valor)
  })

  const categorias: any = {}

  saidas.forEach((s) => {
    if (!categorias[s.descricao]) {
      categorias[s.descricao] = 0
    }
    categorias[s.descricao] += Number(s.valor)
  })

  const totalEntradas = entradas.reduce((acc, e) => acc + Number(e.valor), 0)
  const totalSaidas = saidas.reduce((acc, s) => acc + Number(s.valor), 0)

  const lucro = totalEntradas - totalSaidas
  const margem = totalEntradas > 0 ? (lucro / totalEntradas) * 100 : 0

  const roi = totalSaidas > 0 ? lucro / totalSaidas : 0
  const custoPorMetro = obra?.area ? totalSaidas / obra.area : 0

  const fluxoMensal: any = {}

  financeiro.forEach((item) => {
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

  const dadosGrafico = Object.values(fluxoMensal)

  return (
    <div>
      <h1 style={titulo}>{obra.nome}</h1>
      <p style={subtitulo}>{obra.cliente}</p>

      <div style={boxAcoes}>
        <button onClick={copiarLink} style={btnCopiar}>
          🔗 Copiar link do cliente
        </button>

        <button onClick={enviarWhatsApp} style={btnWhats}>
          📤 Enviar no WhatsApp
        </button>
      </div>

      <button
        style={btnFotos}
        onClick={() => router.push(`/obras/${id}/fotos`)}
      >
        📸 Fotos da Obra
      </button>

      <div style={grid}>
        <Card titulo="Receita" valor={totalEntradas} cor="#22c55e" />
        <Card titulo="Custos" valor={totalSaidas} cor="#ef4444" />
        <Card titulo="Lucro" valor={lucro} cor="#3b82f6" />
        <Card titulo="Margem" valor={margem} cor="#a855f7" tipo="porcentagem" />
        <Card titulo="ROI" valor={roi} cor="#0ea5e9" tipo="porcentagem" />
        <Card titulo="Custo/m²" valor={custoPorMetro} cor="#f59e0b" />
      </div>

      <h2 style={sectionTitle}>Fluxo de Caixa Mensal</h2>

      <div style={box}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dadosGrafico}>
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="entrada" stroke="#22c55e" name="Entradas" />
            <Line type="monotone" dataKey="saida" stroke="#ef4444" name="Saídas" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 style={sectionTitle}>Adicionar lançamento</h3>

      <form onSubmit={adicionar} style={form}>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={input}>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>

        <select value={descricao} onChange={(e) => setDescricao(e.target.value)} style={input}>
          <option value="">Selecione...</option>
          {(tipo === 'entrada'
            ? opcoesFinanceiro.entrada
            : opcoesFinanceiro.saida
          ).map((item, i) => (
            <option key={i}>{item}</option>
          ))}
        </select>

        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={input}
        />

        <button style={btnAdicionar}>Adicionar</button>
      </form>

      <h2 style={sectionTitle}>Receitas por categoria</h2>

      <div style={box}>
        {Object.entries(categoriasEntrada).map(([nome, valor]: any) => (
          <div key={nome} style={linha}>
            <span>{nome}</span>
            <strong style={{ color: '#22c55e' }}>
              {Number(valor).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>
        ))}
      </div>

      <h2 style={sectionTitle}>Custos por categoria</h2>

      <div style={box}>
        {Object.entries(categorias).map(([nome, valor]: any) => (
          <div key={nome} style={linha}>
            <span>{nome}</span>
            <strong>
              {Number(valor).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>
        ))}
      </div>

      <h3 style={sectionTitle}>Entradas</h3>

      <div style={box}>
        {entradas.map((item) => (
          <div key={item.id} style={linhaLancamento}>
            <div>
              <strong style={{ color: '#22c55e' }}>{item.descricao}</strong><br />
              <span style={data}>
                {new Date(item.created_at).toLocaleDateString('pt-BR')}
              </span><br />
              <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                {Number(item.valor).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            <button onClick={() => excluirLancamento(item.id)} style={btnExcluir}>
              Excluir
            </button>
          </div>
        ))}
      </div>

      <h3 style={sectionTitle}>Saídas</h3>

      <div style={box}>
        {saidas.map((item) => (
          <div key={item.id} style={linhaLancamento}>
            <div>
              <strong style={{ color: '#ef4444' }}>{item.descricao}</strong><br />
              <span style={data}>
                {new Date(item.created_at).toLocaleDateString('pt-BR')}
              </span><br />
              <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                {Number(item.valor).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            <button onClick={() => excluirLancamento(item.id)} style={btnExcluir}>
              Excluir
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* COMPONENTE CARD */

function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{ ...card, borderLeft: `6px solid ${cor}` }}>
      <p style={{ color: '#64748b' }}>{titulo}</p>
      <h2 style={{ color: '#0f172a' }}>
        {tipo === 'porcentagem'
          ? valor.toFixed(2) + '%'
          : Number(valor).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
      </h2>
    </div>
  )
}

/* ESTILOS NOVOS */

const boxAcoes = {
  display: 'flex',
  gap: '10px',
  marginTop: '10px',
}

const btnCopiar = {
  background: '#0ea5e9',
  color: '#fff',
  padding: '10px 14px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
}

const btnWhats = {
  background: '#22c55e',
  color: '#fff',
  padding: '10px 14px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
}

/* RESTO ORIGINAL */

const btnFotos = {
  background: '#0ea5e9',
  color: '#fff',
  padding: '10px 14px',
  border: 'none',
  borderRadius: '8px',
  marginTop: '10px',
  cursor: 'pointer',
}

const form = {
  display: 'grid',
  gridTemplateColumns: '1fr 2fr 1fr auto',
  gap: '10px',
  background: '#fff',
  padding: '20px',
  borderRadius: '12px',
  marginTop: '10px',
}

const linhaLancamento = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  padding: '10px',
  borderRadius: '8px',
  background: '#f8fafc',
}

const data = {
  fontSize: '12px',
  color: '#64748b',
}

const titulo = { color: '#0f172a' }
const subtitulo = { color: '#64748b' }

const sectionTitle = {
  marginTop: '30px',
  marginBottom: '10px',
  color: '#0f172a',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px',
  marginTop: '20px',
}

const card = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
}

const box = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  marginTop: '10px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
}

const linha = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '10px',
  color: '#1e293b',
}

const input = {
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #cbd5f5',
}

const btnAdicionar = {
  background: '#2563eb',
  color: '#fff',
  padding: '10px 15px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}

const btnExcluir = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  padding: '6px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
}
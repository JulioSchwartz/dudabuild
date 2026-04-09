'use client'
 
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
 
export default function NovaObra() {
 
  const { empresaId } = useEmpresa()
  const router = useRouter()
 
  const [nome,                setNome]               = useState('')
  const [cliente,             setCliente]             = useState('')
  const [valor,               setValor]               = useState('')
  const [orcamentoCusto,      setOrcamentoCusto]      = useState('')
  const [area,                setArea]                = useState('')
  const [endereco,            setEndereco]            = useState('')
  const [dataInicio,          setDataInicio]          = useState('')
  const [dataPrevisao,        setDataPrevisao]        = useState('')
  const [percentualConcluido, setPercentualConcluido] = useState('0')
  const [loading,             setLoading]             = useState(false)
 
  async function salvar(e: React.FormEvent) {
    e.preventDefault()
 
    if (!empresaId)                    return alert('Erro: empresa não identificada')
    if (!nome.trim())                  return alert('Informe o nome da obra')
    if (!cliente.trim())               return alert('Informe o nome do cliente')
    if (!valor || Number(valor) <= 0)  return alert('Informe um valor de contrato válido')
 
    setLoading(true)
 
    const { error } = await supabase.from('obras').insert({
      nome:                  nome.trim(),
      cliente:               cliente.trim(),
      valor:                 Number(valor),
      orcamento_custo:       orcamentoCusto ? Number(orcamentoCusto) : null,
      area:                  area ? Number(area) : null,
      endereco:              endereco.trim() || null,
      data_inicio:           dataInicio || null,
      data_previsao:         dataPrevisao || null,
      percentual_concluido:  Number(percentualConcluido || 0),
      empresa_id:            empresaId,
    })
 
    if (error) {
      console.error(error)
      alert('Erro ao salvar obra')
      setLoading(false)
      return
    }
 
    router.push('/obras')
  }
 
  return (
    <div style={container}>
      <div style={card}>
 
        <button onClick={() => router.back()} style={btnVoltar}>← Voltar</button>
        <h1 style={titulo}>🏗️ Nova Obra</h1>
 
        <form onSubmit={salvar} style={form}>
 
          <Secao titulo="Informações Básicas">
            <Campo label="Nome da Obra *">
              <input value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Ex: Residência Silva" style={input} required />
            </Campo>
            <Campo label="Cliente *">
              <input value={cliente} onChange={e => setCliente(e.target.value)}
                placeholder="Ex: João Silva" style={input} required />
            </Campo>
            <Campo label="Endereço">
              <input value={endereco} onChange={e => setEndereco(e.target.value)}
                placeholder="Ex: Rua das Flores, 123 - Joaçaba/SC" style={input} />
            </Campo>
          </Secao>
 
          <Secao titulo="Valores">
            <Campo label="Valor do Contrato (R$) *" dica="Receita total prevista da obra">
              <input type="number" value={valor} onChange={e => setValor(e.target.value)}
                placeholder="Ex: 250000" style={input} min="0" step="0.01" required />
            </Campo>
            <Campo label="Orçamento de Custo (R$)" dica="Quanto você prevê gastar para executar a obra">
              <input type="number" value={orcamentoCusto} onChange={e => setOrcamentoCusto(e.target.value)}
                placeholder="Ex: 180000" style={input} min="0" step="0.01" />
            </Campo>
            <Campo label="Área Total (m²)" dica="Usado para calcular custo por m²">
              <input type="number" value={area} onChange={e => setArea(e.target.value)}
                placeholder="Ex: 120" style={input} min="0" step="0.01" />
            </Campo>
          </Secao>
 
          <Secao titulo="Cronograma">
            <div style={doisCols}>
              <Campo label="Data de Início">
                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={input} />
              </Campo>
              <Campo label="Previsão de Término">
                <input type="date" value={dataPrevisao} onChange={e => setDataPrevisao(e.target.value)} style={input} />
              </Campo>
            </div>
            <Campo label={`% Concluído — ${percentualConcluido}%`} dica="Progresso físico atual da obra">
              <input type="range" value={percentualConcluido}
                onChange={e => setPercentualConcluido(e.target.value)}
                min="0" max="100" step="1" style={{ width: '100%', accentColor: '#2563eb' }} />
              <BarraProgresso perc={Number(percentualConcluido)} />
            </Campo>
          </Secao>
 
          <button type="submit" style={botao} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Obra'}
          </button>
 
        </form>
      </div>
    </div>
  )
}
 
function Secao({ titulo, children }: any) {
  return (
    <div style={secaoBox}>
      <p style={secaoTitulo}>{titulo}</p>
      {children}
    </div>
  )
}
 
function Campo({ label, dica, children }: any) {
  return (
    <div style={grupo}>
      <label style={labelStyle}>{label}</label>
      {children}
      {dica && <span style={dicaStyle}>{dica}</span>}
    </div>
  )
}
 
function BarraProgresso({ perc }: { perc: number }) {
  const cor = perc < 30 ? '#ef4444' : perc < 70 ? '#f59e0b' : '#22c55e'
  return (
    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, marginTop: 6 }}>
      <div style={{ height: '100%', width: `${perc}%`, background: cor, borderRadius: 999, transition: 'width 0.2s' }} />
    </div>
  )
}
 
const container: React.CSSProperties = { background: '#f1f5f9', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px' }
const card: React.CSSProperties      = { background: '#fff', padding: 32, borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }
const btnVoltar: React.CSSProperties = { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16 }
const titulo: React.CSSProperties    = { fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 24 }
const form: React.CSSProperties      = { display: 'flex', flexDirection: 'column', gap: 20 }
const secaoBox: React.CSSProperties  = { display: 'flex', flexDirection: 'column', gap: 14, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }
const secaoTitulo: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }
const grupo: React.CSSProperties     = { display: 'flex', flexDirection: 'column', gap: 4 }
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151' }
const input: React.CSSProperties     = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#fff' }
const dicaStyle: React.CSSProperties = { fontSize: 11, color: '#94a3b8' }
const doisCols: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const botao: React.CSSProperties     = { background: '#2563eb', color: '#fff', padding: 13, borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15 }
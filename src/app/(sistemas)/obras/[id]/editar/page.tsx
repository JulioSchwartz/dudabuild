'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function EditarObra() {

  const { empresaId } = useEmpresa()
  const { id }        = useParams<{ id: string }>()
  const router        = useRouter()

  const [nome,     setNome]     = useState('')
  const [cliente,  setCliente]  = useState('')
  const [valor,    setValor]    = useState('')
  const [area,     setArea]     = useState('')
  const [endereco, setEndereco] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!empresaId || !id) return
    buscar()
  }, [empresaId, id])

  async function buscar() {
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .eq('id', Number(id))
        .eq('empresa_id', empresaId)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        alert('Obra não encontrada')
        router.push('/obras')
        return
      }

      setNome(data.nome     || '')
      setCliente(data.cliente  || '')
      setValor(String(data.valor || ''))
      setArea(data.area ? String(data.area) : '')
      setEndereco(data.endereco || '')

    } catch (err) {
      console.error(err)
      alert('Erro ao carregar obra')
    } finally {
      setLoadingData(false)
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()

    if (!nome.trim())             return alert('Informe o nome da obra')
    if (!cliente.trim())          return alert('Informe o nome do cliente')
    if (!valor || Number(valor) <= 0) return alert('Informe um valor válido')

    setLoading(true)

    const { error } = await supabase
      .from('obras')
      .update({
        nome:     nome.trim(),
        cliente:  cliente.trim(),
        valor:    Number(valor),
        area:     area ? Number(area) : null,
        endereco: endereco.trim() || null,
      })
      .eq('id', Number(id))
      .eq('empresa_id', empresaId)

    if (error) {
      console.error(error)
      alert('Erro ao salvar')
      setLoading(false)
      return
    }

    router.push(`/obras/${id}`)
  }

  if (loadingData) return <p style={{ padding: 24 }}>Carregando...</p>

  return (
    <div style={container}>
      <div style={card}>

        <button onClick={() => router.back()} style={btnVoltar}>← Voltar</button>

        <h1 style={titulo}>✏️ Editar Obra</h1>

        <form onSubmit={salvar} style={form}>

          <div style={grupo}>
            <label style={label}>Nome da Obra *</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Residência Silva"
              style={input}
              required
            />
          </div>

          <div style={grupo}>
            <label style={label}>Cliente *</label>
            <input
              value={cliente}
              onChange={e => setCliente(e.target.value)}
              placeholder="Ex: João Silva"
              style={input}
              required
            />
          </div>

          <div style={grupo}>
            <label style={label}>Valor do Contrato (R$) *</label>
            <input
              type="number"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="Ex: 250000"
              style={input}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div style={grupo}>
            <label style={label}>Área Total (m²)</label>
            <input
              type="number"
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder="Ex: 120"
              style={input}
              min="0"
              step="0.01"
            />
            <span style={dica}>Usado para calcular o custo por m²</span>
          </div>

          <div style={grupo}>
            <label style={label}>Endereço</label>
            <input
              value={endereco}
              onChange={e => setEndereco(e.target.value)}
              placeholder="Ex: Rua das Flores, 123 - Joaçaba/SC"
              style={input}
            />
          </div>

          <button type="submit" style={botao} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>

        </form>

      </div>
    </div>
  )
}

/* ── ESTILOS ── */

const container: React.CSSProperties = {
  background: '#f1f5f9',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
}

const card: React.CSSProperties = {
  background: '#fff',
  padding: 32,
  borderRadius: 16,
  width: '100%',
  maxWidth: 480,
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
}

const btnVoltar: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  fontSize: 14,
  padding: 0,
  marginBottom: 16,
}

const titulo: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: '#0f172a',
  marginBottom: 24,
}

const form: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const grupo: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const label: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
}

const input: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 14,
  background: '#f8fafc',
}

const dica: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
}

const botao: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  padding: 13,
  borderRadius: 8,
  border: 'none',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 15,
  marginTop: 4,
}
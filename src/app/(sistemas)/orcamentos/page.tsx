'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

type Orcamento = {
  id: string
  cliente_nome: string
  valor_total: number
  status?: string
  created_at: string
}

export default function OrcamentosPage() {
  
  const empresaId = useEmpresa()
  const [lista, setLista] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    carregar()
  }, [])


  await supabase.from('orcamentos').insert({
  cliente_nome,
  descricao,
  valor_total,
  empresa_id: empresaId
})

  async function carregar() {
    
   const { data } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('empresa_id', empresaId)

    if (!error && data) {
      setLista(data)
    }

    setLoading(false)
  }

  function formatarMoeda(valor: number) {
    return valor?.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  return (
    <div style={container}>

      <div style={header}>
        <h1>Orçamentos</h1>

        <button style={btnNovo} onClick={() => router.push('/orcamentos/novo')}>
          + Novo Orçamento
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <table style={tabela}>

          <thead>
            <tr>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {lista.map(o => (
              <tr key={o.id} style={linha}>

                <td>{o.cliente_nome}</td>

                <td>{formatarMoeda(o.valor_total)}</td>

                <td>
                  <span style={status(o.status)}>
                    {o.status || 'pendente'}
                  </span>
                </td>

                <td>
                  {new Date(o.created_at).toLocaleDateString()}
                </td>

                <td style={{ display: 'flex', gap: 6 }}>

                  <button
                    style={btn}
                    onClick={() => router.push(`/orcamentos/editar/${o.id}`)}
                  >
                    Editar
                  </button>

                  <button
                    style={btn}
                    onClick={() => router.push(`/orcamento/${o.id}`)}
                  >
                    Ver
                  </button>

                  <button onClick={() => enviarCliente(o.id, o.telefone)}>
 		   Enviar WhatsApp
		  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      )}

    </div>
  )
}

/* 🎨 ESTILO */

const container = { padding: 24 }

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const tabela = {
  width: '100%',
  marginTop: 20,
  borderCollapse: 'collapse'
}

const linha = {
  borderBottom: '1px solid #e2e8f0'
}

const btnNovo = {
  background: '#2563eb',
  color: '#fff',
  padding: '10px 14px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer'
}

const btn = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  cursor: 'pointer'
}

function status(s?: string) {
  if (s === 'aprovado') return { color: '#16a34a', fontWeight: 600 }
  if (s === 'recusado') return { color: '#dc2626', fontWeight: 600 }
  return { color: '#f59e0b', fontWeight: 600 }
}

function enviarCliente(id: string, telefone: string) {

  const link = `${window.location.origin}/orcamento/${id}`

  const texto = `Olá! Segue seu orçamento:\n${link}`

  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`

  window.open(url)
}

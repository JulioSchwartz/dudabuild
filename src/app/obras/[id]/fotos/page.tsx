'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function FotosObra() {
  const { id } = useParams()
  const router = useRouter()

  const [fotos, setFotos] = useState<any[]>([])
  const [tipo, setTipo] = useState('fachada')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const empresa_id = localStorage.getItem('empresa_id')

    const { data } = await supabase
      .from('obra_fotos')
      .select('*')
      .eq('obra_id', Number(id))
      .eq('empresa_id', empresa_id)
      .order('created_at', { ascending: false })

    setFotos(data || [])
  }

  async function uploadImagem(e: any) {
    const file = e.target.files[0]
    if (!file) return

    const empresa_id = localStorage.getItem('empresa_id')

    setLoading(true)

    const nomeArquivo = `${id}/${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from('obras')
      .upload(nomeArquivo, file, {
        upsert: true,
      })

    if (error) {
      alert('Erro ao enviar imagem: ' + error.message)
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('obras')
      .getPublicUrl(nomeArquivo)

    await supabase.from('obra_fotos').insert([
      {
        obra_id: Number(id),
        empresa_id,
        url: urlData.publicUrl,
        tipo,
      },
    ])

    setLoading(false)
    carregar()
  }

  const fachada = fotos.filter((f) => f.tipo === 'fachada')
  const interior = fotos.filter((f) => f.tipo === 'interior')

  return (
    <div style={container}>
      <h1 style={titulo}>📸 Fotos da Obra</h1>

      <button onClick={() => router.back()} style={btnVoltar}>
        ← Voltar
      </button>

      {/* UPLOAD */}
      <div style={uploadBox}>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={input}>
          <option value="fachada">Fachada</option>
          <option value="interior">Interior</option>
        </select>

        <input type="file" onChange={uploadImagem} />

        {loading && <p style={{ color: '#334155' }}>Enviando...</p>}
      </div>

      {/* FACHADA */}
      <h2 style={sectionTitle}>🏠 Fachada</h2>

      <div style={grid}>
        {fachada.length === 0 && <p style={empty}>Nenhuma foto ainda</p>}

        {fachada.map((foto) => (
          <img key={foto.id} src={foto.url} style={imagem} />
        ))}
      </div>

      {/* INTERIOR */}
      <h2 style={sectionTitle}>🛋️ Interior</h2>

      <div style={grid}>
        {interior.length === 0 && <p style={empty}>Nenhuma foto ainda</p>}

        {interior.map((foto) => (
          <img key={foto.id} src={foto.url} style={imagem} />
        ))}
      </div>
    </div>
  )
}

/* 🎨 ESTILO PROFISSIONAL */

const container = {
  padding: '20px',
  background: '#f1f5f9',
  minHeight: '100vh',
}

const titulo = {
  fontSize: '26px',
  marginBottom: '10px',
  color: '#0f172a',
  fontWeight: '600',
}

const btnVoltar = {
  marginBottom: '20px',
  padding: '8px 12px',
  borderRadius: '6px',
  border: 'none',
  background: '#cbd5e1',
  cursor: 'pointer',
}

const uploadBox = {
  display: 'flex',
  gap: '10px',
  marginBottom: '20px',
  background: '#ffffff',
  padding: '15px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
}

const input = {
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #94a3b8',
}

const sectionTitle = {
  marginTop: '20px',
  marginBottom: '10px',
  color: '#0f172a',
  fontWeight: '600',
}

const empty = {
  color: '#475569',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '12px',
}

const imagem = {
  width: '100%',
  height: '180px',
  objectFit: 'cover' as const,
  borderRadius: '10px',
  cursor: 'pointer',
  transition: '0.3s',
}
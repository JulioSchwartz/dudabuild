'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ClienteObra() {
  const { id } = useParams()

  const [fotos, setFotos] = useState<any[]>([])
  const [obra, setObra] = useState<any>(null)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data: obraData } = await supabase
      .from('obras')
      .select('*')
      .eq('id', Number(id))
      .single()

    const { data: fotosData } = await supabase
      .from('obra_fotos')
      .select('*')
      .eq('obra_id', Number(id))
      .order('created_at', { ascending: false })

    setObra(obraData)
    setFotos(fotosData || [])
  }

  const fachada = fotos.filter((f) => f.tipo === 'fachada')
  const interior = fotos.filter((f) => f.tipo === 'interior')

  return (
    <div style={container}>
      <h1 style={titulo}>
        📸 Acompanhamento da Obra
      </h1>

      <p style={subtitulo}>
        {obra?.nome} - {obra?.cliente}
      </p>

      {/* FACHADA */}
      <h2 style={sectionTitle}>Fachada</h2>

      <div style={grid}>
        {fachada.length === 0 && <p>Nenhuma foto ainda</p>}

        {fachada.map((foto) => (
          <img key={foto.id} src={foto.url} style={imagem} />
        ))}
      </div>

      {/* INTERIOR */}
      <h2 style={sectionTitle}>Interior</h2>

      <div style={grid}>
        {interior.length === 0 && <p>Nenhuma foto ainda</p>}

        {interior.map((foto) => (
          <img key={foto.id} src={foto.url} style={imagem} />
        ))}
      </div>
    </div>
  )
}

/* 🎨 ESTILO (CLIENTE - BONITO) */

const container = {
  minHeight: '100vh',
  padding: '30px',
  background: '#f1f5f9',
}

const titulo = {
  fontSize: '28px',
  color: '#0f172a',
  marginBottom: '5px',
}

const subtitulo = {
  color: '#64748b',
  marginBottom: '20px',
}

const sectionTitle = {
  marginTop: '20px',
  marginBottom: '10px',
  color: '#0f172a',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '15px',
}

const imagem = {
  width: '100%',
  height: '220px',
  objectFit: 'cover' as const,
  borderRadius: '12px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
}
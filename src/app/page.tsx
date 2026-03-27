'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div style={container}>
      <div style={overlay}>
        <div style={content}>
          <h1 style={titulo}>🏗️ DudaBuild</h1>

          <p style={subtitulo}>
            Gestão profissional de obras, financeiro e acompanhamento em tempo real
          </p>

          <button
            style={botao}
            onClick={() => router.push('/dashboard')}
          >
            Entrar no sistema →
          </button>
        </div>
      </div>
    </div>
  )
}

/* 🎨 ESTILO PREMIUM */

const container = {
  height: '100vh',
  backgroundImage:
    'url(https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1400)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

const overlay = {
  width: '100%',
  height: '100%',
  background: 'rgba(15, 23, 42, 0.75)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

const content = {
  textAlign: 'center' as const,
  color: '#fff',
  maxWidth: '500px',
  padding: '20px',
}

const titulo = {
  fontSize: '42px',
  marginBottom: '10px',
}

const subtitulo = {
  fontSize: '16px',
  marginBottom: '30px',
  color: '#cbd5f5',
}

const botao = {
  background: '#2563eb',
  padding: '14px 24px',
  borderRadius: '10px',
  border: 'none',
  color: '#fff',
  fontSize: '16px',
  cursor: 'pointer',
  fontWeight: 'bold',
}
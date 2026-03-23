'use client'

import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body style={body}>

        <div style={container}>
          
          {/* MENU LATERAL */}
          <aside style={sidebar}>
            <h2 style={logo}>DudaBuild</h2>

            <button style={btn} onClick={() => window.location.href = '/'}>
              Dashboard
            </button>

            <button style={btn} onClick={() => window.location.href = '/obras'}>
              Obras
            </button>

            <button style={btn} onClick={() => window.location.href = '/financeiro'}>
              Financeiro
            </button>
          </aside>

          {/* CONTEÚDO */}
          <main style={content}>
            {children}
          </main>

        </div>

      </body>
    </html>
  )
}

/* =========================
   🎨 ESTILO (mantendo padrão antigo)
========================= */

const body: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Arial, sans-serif',
  background: '#e5e7eb', // cinza claro (igual antes)
}

const container: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
}

const sidebar: React.CSSProperties = {
  width: '220px',
  background: '#1e293b', // azul escuro
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  padding: '20px',
  gap: '10px',
}

const logo: React.CSSProperties = {
  marginBottom: '20px',
}

const btn: React.CSSProperties = {
  background: '#334155',
  color: '#fff',
  border: 'none',
  padding: '10px',
  borderRadius: '6px',
  textAlign: 'left',
  cursor: 'pointer',
}

const content: React.CSSProperties = {
  flex: 1,
  padding: '20px',
  background: '#f5f5f5',
}

const content: React.CSSProperties = {
  flex: 1,
  padding: '20px',
  background: '#f1f5f9', // 🔥 antes estava claro demais
}
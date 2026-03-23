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
        
        {/* MENU SUPERIOR */}
        <header style={menu}>
          <div style={logo}>
            DudaBuild
          </div>

          <nav style={nav}>
            <button
              style={btn}
              onClick={() => window.location.href = '/'}
            >
              Dashboard
            </button>

            <button
              style={btn}
              onClick={() => window.location.href = '/obras'}
            >
              Obras
            </button>

            <button
              style={btn}
              onClick={() => window.location.href = '/financeiro'}
            >
              Financeiro
            </button>
          </nav>
        </header>

        {/* CONTEÚDO */}
        <main style={conteudo}>
          {children}
        </main>

      </body>
    </html>
  )
}

const body = {
  margin: 0,
  fontFamily: 'Arial, sans-serif',
  background: '#f1f5f9',
}

const menu = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px 25px',
  background: '#1e293b',
  color: '#fff',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
}

const logo = {
  fontSize: '18px',
  fontWeight: 'bold',
}

const nav = {
  display: 'flex',
  gap: '10px',
}

const btn = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: '0.2s',
}

const conteudo = {
  padding: '20px',
}
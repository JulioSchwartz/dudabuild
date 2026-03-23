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

        {/* HEADER / MENU */}
        <header style={header}>
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

        {/* CONTEÚDO PRINCIPAL */}
        <main style={main}>
          {children}
        </main>

      </body>
    </html>
  )
}

/* =========================
   🎨 ESTILOS
========================= */

const body: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Arial, sans-serif',
  background: '#f1f5f9',
}

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px 25px',
  background: '#1e293b',
  color: '#fff',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
}

const logo: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
}

const nav: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
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

const main: React.CSSProperties = {
  padding: '20px',
}
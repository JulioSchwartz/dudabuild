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
   🎨 ESTILOS (CORRIGIDOS)
========================= */

const body = {
  margin: 0,
  fontFamily: 'Arial, sans-serif',
  background: '#f1f5f9', // fundo suave
  color: '#0f172a', // 🔥 garante contraste global
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px 25px',
  background: '#1e293b',
  color: '#ffffff',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
}

const logo = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ffffff', // 🔥 força branco forte
}

const nav = {
  display: 'flex',
  gap: '10px',
}

const btn = {
  background: '#334155',
  color: '#ffffff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '6px',
  textAlign: 'left',
  cursor: 'pointer',
  fontWeight: '500',
}

const main = {
  padding: '20px',
  background: '#f1f5f9', // 🔥 melhora contraste com cards brancos
}
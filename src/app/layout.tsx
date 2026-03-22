'use client'

import { useRouter } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  function sair() {
    localStorage.removeItem('empresa_id')
    router.push('/login')
  }

  return (
    <html lang="pt-br">
      <body style={{ margin: 0, fontFamily: 'Arial' }}>
        <div style={{ display: 'flex' }}>
          
          {/* SIDEBAR */}
          <div style={sidebar}>
            <h2>DudaBuild</h2>

            <a href="/" style={link}>Dashboard</a>
            <a href="/obras" style={link}>Obras</a>

            <button onClick={sair} style={btnLogout}>
              Sair
            </button>
          </div>

          {/* CONTEÚDO */}
          <div style={{ flex: 1, padding: '20px', background: '#f5f5f5' }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}

const sidebar = {
  width: '200px',
  background: '#1e293b',
  color: '#fff',
  minHeight: '100vh',
  padding: '20px',
}

const link = {
  display: 'block',
  marginTop: '10px',
  color: '#fff',
  textDecoration: 'none',
}

const btnLogout = {
  marginTop: '20px',
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  padding: '10px',
  borderRadius: '6px',
  cursor: 'pointer',
}
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
  
  {/* MENU SUPERIOR */}
  <div style={{
    display: 'flex',
    gap: '10px',
    padding: '15px',
    background: '#1e293b',
  }}>
    
    <button
      onClick={() => window.location.href = '/'}
      style={btn}
    >
      Dashboard
    </button>

    <button
      onClick={() => window.location.href = '/obras'}
      style={btn}
    >
      Obras
    </button>

    <button
      onClick={() => window.location.href = '/financeiro'}
      style={btn}
    >
      Financeiro
    </button>

  </div>

  {/* CONTEÚDO ORIGINAL */}
  <div style={{ padding: '20px' }}>
    {children}
  </div>

</body>

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

const btn = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '10px 15px',
  borderRadius: '6px',
  cursor: 'pointer',
}
'use client'

import './globals.css'
import { usePathname } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <html lang="pt-BR">
      <body style={body}>
        <div style={container}>

          {/* SIDEBAR */}
          <aside style={sidebar}>
            <div style={logo}>DudaBuild</div>

            <NavItem
              label="Dashboard"
              path="/"
              active={pathname === '/'}
            />

            <NavItem
              label="Obras"
              path="/obras"
              active={pathname.startsWith('/obras')}
            />

            <NavItem
              label="Financeiro"
              path="/financeiro"
              active={pathname.startsWith('/financeiro')}
            />
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
   🧩 COMPONENTE MENU
========================= */

function NavItem({ label, path, active }: any) {
  return (
    <button
      onClick={() => window.location.href = path}
      style={{
        ...navItem,
        background: active ? '#2563eb' : 'transparent',
        color: active ? '#fff' : '#cbd5f5',
      }}
    >
      {label}
    </button>
  )
}

/* =========================
   🎨 ESTILO PREMIUM
========================= */

const body = {
  margin: 0,
  fontFamily: 'Inter, Arial, sans-serif',
  background: '#f1f5f9',
}

const container = {
  display: 'flex',
  minHeight: '100vh',
}

const sidebar = {
  width: '240px',
  background: '#0f172a',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  padding: '25px 15px',
  gap: '8px',
}

const logo = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '20px',
  color: '#fff',
}

const navItem = {
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '14px',
  transition: '0.2s',
}

const content = {
  flex: 1,
  padding: '25px',
  background: '#f8fafc',
}
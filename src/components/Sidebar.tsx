'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {

  const path = usePathname()

  function Item({ href, label }: any) {
    const ativo = path === href

    return (
      <Link href={href}>
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: ativo ? '#2563eb' : 'transparent',
          color: ativo ? '#fff' : '#334155',
          cursor: 'pointer',
          marginBottom: 6
        }}>
          {label}
        </div>
      </Link>
    )
  }

  return (
    <div style={{
      width: 220,
      background: '#fff',
      padding: 20,
      borderRight: '1px solid #e2e8f0'
    }}>
      <h2 style={{ marginBottom: 20 }}>🏗️ SaaS Obras</h2>

      <Item href="/dashboard" label="Dashboard" />
      <Item href="/financeiro" label="Financeiro" />
      <Item href="/obras" label="Obras" />
      <Item href="/orcamentos" label="Orçamentos" />

    </div>
  )
}
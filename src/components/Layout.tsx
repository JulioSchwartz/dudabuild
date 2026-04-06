'use client'

import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }: any) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Header />

        <div style={{ padding: 24 }}>
          {children}
        </div>
      </div>

    </div>
  )
}
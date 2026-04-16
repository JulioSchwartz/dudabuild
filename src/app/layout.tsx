import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zynplan — Planejamento Inteligente',
  description: 'Sistema de Gestão para Construção Civil',
  manifest: '/manifest.json',
  themeColor: '#0a0a0a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zynplan',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
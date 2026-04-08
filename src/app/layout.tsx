import type { Metadata } from 'next'
import './globals.css'
 
export const metadata: Metadata = {
  title: 'DudaBuild',
  description: 'Sistema de Gestão para Construção Civil',
}
 
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  )
}
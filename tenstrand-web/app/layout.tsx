import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ten Strands — Climate Learning Exchange',
  description: 'Connect teachers with environmental education programs and partners.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  )
}

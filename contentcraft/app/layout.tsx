import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ContentCraft AI Engine',
  description: 'K-12 AI-Powered Content Development Generator for Pakistan National Curriculum',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

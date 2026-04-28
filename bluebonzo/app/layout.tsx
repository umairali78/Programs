import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'BlueBonzo AI — Seaweed Market Intelligence',
  description: 'AI-powered market intelligence platform for the global seaweed industry. Real-time pricing, trade flows, regulatory monitoring, and expert analysis.',
  keywords: 'seaweed, carrageenan, agar, alginate, market intelligence, BlueBonzo, marine industry',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

'use client'
import dynamic from 'next/dynamic'

const App = dynamic(() => import('@/views/App'), { ssr: false, loading: () => null })

export default function Home() {
  return <App />
}

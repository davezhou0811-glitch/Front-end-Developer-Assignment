import { Head } from './head'

import { Navbar } from '@/components/navbar'

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col">
      <Head />
      <Navbar />
      <main className="px-6 flex-grow" style={{ backgroundColor: '#1B1A21' }}>
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-3" />
    </div>
  )
}

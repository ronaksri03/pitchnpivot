import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import NavBar from '@/components/NavBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "pitchNpivot — CV's & Resumes DON'T GO VIRAL. YOU DO.",
  description: 'Gen Z video-first professional networking. Show your work, not your resume.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#0a0a0a', color: '#f0ece4', margin: 0, minHeight: '100vh' }}>
        <AuthProvider>
          <NavBar />
          <main style={{ paddingTop: '56px' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}

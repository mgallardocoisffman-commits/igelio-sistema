'use client'
import { SessionProvider } from 'next-auth/react'

export default function SistemaLayout({ children }) {
  return <SessionProvider>{children}</SessionProvider>
}

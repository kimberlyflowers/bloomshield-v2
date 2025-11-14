import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BloomShield - File Protection',
  description: 'Protect your creative work with blockchain timestamping',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}

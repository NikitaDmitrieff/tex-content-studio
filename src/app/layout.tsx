import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Tex Content Studio — Content Distribution Pipeline',
  description: 'Automated content distribution pipeline for Tex Fitness. Generate UGC-style TikTok carousel stories with AI characters, images, captions, and hashtags — ready to post.',
  openGraph: {
    title: 'Tex Content Studio',
    description: 'AI-powered content distribution pipeline. Generate scroll-stopping TikTok carousels from fictional character transformation stories.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-[#0a0a0a] text-white min-h-screen`}>
        <Navigation />
        {children}
      </body>
    </html>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Film, Users, BarChart2 } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white mr-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
            <Film className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          Tex Content Studio
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              pathname === '/'
                ? 'bg-white/[0.08] text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Stories
          </Link>
          <Link
            href="/intelligence"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              pathname.startsWith('/intelligence')
                ? 'bg-white/[0.08] text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Intelligence
          </Link>
          <Link
            href="/characters"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              pathname.startsWith('/characters')
                ? 'bg-white/[0.08] text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Characters
          </Link>
        </div>
      </div>
    </nav>
  )
}

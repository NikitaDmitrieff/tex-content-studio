'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Film, Users, BarChart2 } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Stories', icon: Film, exact: true },
  { href: '/intelligence', label: 'Intelligence', icon: BarChart2, exact: false },
  { href: '/characters', label: 'Characters', icon: Users, exact: false },
]

export function Navigation() {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <nav className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold text-white mr-3 group">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center group-hover:bg-[var(--accent)]/25 transition-colors">
            <Film className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <span className="hidden sm:inline">Tex Content Studio</span>
        </Link>

        <div className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {active && (
                  <span className="absolute -bottom-[0.6rem] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[var(--accent)] rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
      {/* Gradient border line */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </nav>
  )
}

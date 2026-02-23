'use client'

import { useState } from 'react'
import { TrendingSong, TrendingMusicResult } from '@/lib/types'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Radio,
  Disc3,
  BadgeCheck,
  ExternalLink,
  Flame,
} from 'lucide-react'

const COUNTRIES = [
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'US', label: '🇺🇸 USA' },
  { code: 'GB', label: '🇬🇧 UK' },
  { code: 'DE', label: '🇩🇪 Germany' },
  { code: 'BR', label: '🇧🇷 Brazil' },
  { code: 'JP', label: '🇯🇵 Japan' },
]

// Rank badge colors for top 3
function rankStyle(rank: number): string {
  if (rank === 1) return 'text-amber-300 bg-amber-400/10 border-amber-400/20'
  if (rank === 2) return 'text-zinc-300 bg-zinc-400/10 border-zinc-400/20'
  if (rank === 3) return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
  return 'text-zinc-500 bg-transparent border-transparent'
}

function RankDiff({ diff }: { diff: number | null }) {
  if (diff === null || diff === 0) {
    return <Minus className="w-3 h-3 text-zinc-700" />
  }
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400">
        <TrendingUp className="w-3 h-3" />
        <span className="text-[10px] font-medium">+{diff}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-red-400">
      <TrendingDown className="w-3 h-3" />
      <span className="text-[10px] font-medium">{diff}</span>
    </span>
  )
}

// TikTok SVG icon (inline to avoid external dependency)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.15a8.17 8.17 0 0 0 4.77 1.52V7.24a4.85 4.85 0 0 1-1-.55z" />
    </svg>
  )
}

// Spotify SVG icon
function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

export function TrendingMusicPanel() {
  const [result, setResult] = useState<TrendingMusicResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [country, setCountry] = useState('FR')
  const [rankType, setRankType] = useState<'popular' | 'surging'>('popular')
  const [period, setPeriod] = useState<7 | 30>(7)

  async function fetchTrending() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        country,
        period: period.toString(),
        rankType,
      })
      const res = await fetch(`/api/trending-music?${params}`)
      const data = await res.json()
      if (data.songs) {
        setResult(data)
      }
    } catch (err) {
      console.error('Failed to fetch trending music:', err)
    } finally {
      setLoading(false)
    }
  }

  const timeAgo = result?.fetched_at
    ? `${Math.max(0, Math.round((Date.now() - new Date(result.fetched_at).getTime()) / 60000))}m ago`
    : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <span className="text-sm font-medium text-zinc-200">Trending TikTok Sounds</span>
          {result?.demo && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-zinc-500">
              Demo
            </span>
          )}
          {timeAgo && !result?.demo && (
            <span className="text-xs text-zinc-600">Updated {timeAgo}</span>
          )}
        </div>
        <button
          onClick={fetchTrending}
          disabled={loading}
          className="btn-accent flex items-center gap-2 text-xs py-1.5 px-3"
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{result ? 'Refresh' : 'Load Trending'}</span>
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Country */}
        <select
          value={country}
          onChange={e => { setCountry(e.target.value); setResult(null) }}
          className="input-dark text-xs py-1.5 px-2.5 w-auto"
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>

        {/* Rank type */}
        <div className="flex rounded-lg border border-white/[0.06] overflow-hidden">
          <button
            onClick={() => { setRankType('popular'); setResult(null) }}
            className={`text-xs px-3 py-1.5 transition-all ${
              rankType === 'popular'
                ? 'bg-pink-500/15 text-pink-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Popular
          </button>
          <button
            onClick={() => { setRankType('surging'); setResult(null) }}
            className={`text-xs px-3 py-1.5 transition-all flex items-center gap-1 ${
              rankType === 'surging'
                ? 'bg-pink-500/15 text-pink-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Surging <Flame className="w-3 h-3" />
          </button>
        </div>

        {/* Period */}
        <div className="flex rounded-lg border border-white/[0.06] overflow-hidden">
          <button
            onClick={() => { setPeriod(7); setResult(null) }}
            className={`text-xs px-3 py-1.5 transition-all ${
              period === 7 ? 'bg-white/[0.06] text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => { setPeriod(30); setResult(null) }}
            className={`text-xs px-3 py-1.5 transition-all ${
              period === 30 ? 'bg-white/[0.06] text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            30 days
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!result && !loading && (
        <div className="glass-card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/5 border border-pink-500/10 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-7 h-7 text-pink-400/40" />
          </div>
          <p className="text-sm text-zinc-400 mb-1">
            See what&apos;s trending on TikTok right now
          </p>
          <p className="text-xs text-zinc-600">
            Real-time viral sounds to pair with your carousel for maximum reach
          </p>
          <p className="text-[10px] text-zinc-700 mt-3">
            Requires SOCIAVAULT_API_KEY · Free: 50 credits · $29 for 6,000 calls
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card p-3.5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/[0.04] rounded-lg" />
                <div className="w-10 h-10 bg-white/[0.03] rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-white/[0.06] rounded w-2/5 mb-1.5" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Song list */}
      {result && !loading && (
        <div className="space-y-1.5">
          {result.songs.map((song, i) => (
            <SongRow key={i} song={song} />
          ))}

          {result.songs.length === 0 && (
            <div className="glass-card p-8 text-center">
              <p className="text-sm text-zinc-500">No trending songs found for this filter</p>
            </div>
          )}
        </div>
      )}

      {/* Demo notice */}
      {result?.demo && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-pink-500/5 border border-pink-500/10">
          <Radio className="w-4 h-4 text-pink-400/60 mt-0.5 shrink-0" />
          <p className="text-xs text-pink-400/60 leading-relaxed">
            Demo data — add <code className="text-pink-300/80 font-mono">SOCIAVAULT_API_KEY</code> for
            real-time TikTok trending charts. Free trial: 50 API credits.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Song row component ──────────────────────────────────────────────────────

function SongRow({ song }: { song: TrendingSong }) {
  return (
    <div className="glass-card p-3.5 group hover:border-white/[0.12] transition-all">
      <div className="flex items-center gap-3">
        {/* Rank badge */}
        <div className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold ${rankStyle(song.rank)}`}>
          {song.rank}
        </div>

        {/* Cover art */}
        {song.cover_url ? (
          <img
            src={song.cover_url}
            alt={song.title}
            className="shrink-0 w-10 h-10 rounded-lg object-cover border border-white/[0.06]"
          />
        ) : (
          <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-white/[0.06] flex items-center justify-center">
            <Disc3 className="w-5 h-5 text-pink-400/30" />
          </div>
        )}

        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{song.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-400 truncate">{song.author}</span>
            {song.is_commercial && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400/70">
                <BadgeCheck className="w-3 h-3" />
                <span className="hidden sm:inline">Licensed</span>
              </span>
            )}
          </div>
        </div>

        {/* Rank change */}
        <div className="shrink-0 w-10 text-right">
          <RankDiff diff={song.rank_diff} />
        </div>

        {/* Action links — hover reveal */}
        <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={song.tiktok_link || `https://www.tiktok.com/search?q=${encodeURIComponent(song.title + ' ' + song.author)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Search on TikTok"
          >
            <TikTokIcon className="w-3.5 h-3.5" />
          </a>
          <a
            href={`https://open.spotify.com/search/${encodeURIComponent(song.title + ' ' + song.author)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-[#1DB954] hover:bg-white/[0.08] transition-all"
            title="Find on Spotify"
          >
            <SpotifyIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

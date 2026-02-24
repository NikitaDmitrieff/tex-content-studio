import { NextRequest, NextResponse } from 'next/server'
import { TrendingSong } from '@/lib/types'

// ── SociaVault TikTok Trending Music API ────────────────────────────────────
// Env vars:
//   SOCIAVAULT_API_KEY — API key from sociavault.com

function getDemoTrendingSongs(): TrendingSong[] {
  return [
    { rank: 1, title: 'Die With A Smile', author: 'Lady Gaga & Bruno Mars', cover_url: null, tiktok_link: null, rank_diff: 2, is_commercial: true },
    { rank: 2, title: 'APT.', author: 'ROSÉ & Bruno Mars', cover_url: null, tiktok_link: null, rank_diff: -1, is_commercial: true },
    { rank: 3, title: 'Espresso', author: 'Sabrina Carpenter', cover_url: null, tiktok_link: null, rank_diff: 0, is_commercial: true },
    { rank: 4, title: 'Birds of a Feather', author: 'Billie Eilish', cover_url: null, tiktok_link: null, rank_diff: 3, is_commercial: true },
    { rank: 5, title: 'LUNCH', author: 'Billie Eilish', cover_url: null, tiktok_link: null, rank_diff: -2, is_commercial: true },
    { rank: 6, title: 'Beautiful Things', author: 'Benson Boone', cover_url: null, tiktok_link: null, rank_diff: 1, is_commercial: true },
    { rank: 7, title: 'Nasty', author: 'Tinashe', cover_url: null, tiktok_link: null, rank_diff: 5, is_commercial: true },
    { rank: 8, title: 'Not Like Us', author: 'Kendrick Lamar', cover_url: null, tiktok_link: null, rank_diff: -1, is_commercial: false },
    { rank: 9, title: 'MILLION DOLLAR BABY', author: 'Tommy Richman', cover_url: null, tiktok_link: null, rank_diff: 0, is_commercial: true },
    { rank: 10, title: 'Gata Only', author: 'FloyyMenor & Cris MJ', cover_url: null, tiktok_link: null, rank_diff: -3, is_commercial: true },
    { rank: 11, title: 'Sympathy is a knife', author: 'Charli XCX', cover_url: null, tiktok_link: null, rank_diff: 4, is_commercial: true },
    { rank: 12, title: 'Saturn', author: 'SZA', cover_url: null, tiktok_link: null, rank_diff: 2, is_commercial: true },
    { rank: 13, title: 'A Bar Song (Tipsy)', author: 'Shaboozey', cover_url: null, tiktok_link: null, rank_diff: -2, is_commercial: true },
    { rank: 14, title: 'we can\'t be friends', author: 'Ariana Grande', cover_url: null, tiktok_link: null, rank_diff: 1, is_commercial: true },
    { rank: 15, title: 'Pookie', author: 'Aya Nakamura', cover_url: null, tiktok_link: null, rank_diff: 6, is_commercial: true },
  ]
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.SOCIAVAULT_API_KEY

  const { searchParams } = new URL(request.url)
  const country = searchParams.get('country') || 'FR'
  const period = searchParams.get('period') || '7'
  const rankType = searchParams.get('rankType') || 'popular'

  // Demo mode when no API key
  if (!apiKey) {
    return NextResponse.json({
      songs: getDemoTrendingSongs(),
      country,
      rank_type: rankType,
      time_period: parseInt(period),
      fetched_at: new Date().toISOString(),
      demo: true,
    })
  }

  try {
    const url = new URL('https://api.sociavault.com/v1/scrape/tiktok/music/popular')
    url.searchParams.set('countryCode', country)
    url.searchParams.set('timePeriod', period)
    url.searchParams.set('rankType', rankType)

    const res = await fetch(url.toString(), {
      headers: {
        'x-api-key': apiKey,
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('SociaVault API error:', res.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch trending music', details: errorText },
        { status: 502 }
      )
    }

    const data = await res.json()

    // Normalize SociaVault response shape
    // API returns: { data: { sound_list: { "0": {...}, "1": {...}, ... } } }
    const soundList = data?.data?.sound_list || data?.sound_list || {}
    const rawSongs = Array.isArray(soundList)
      ? soundList
      : Object.values(soundList)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const songs: TrendingSong[] = (rawSongs as any[]).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any, i: number) => ({
        rank: item.rank ?? i + 1,
        title: item.title || 'Unknown',
        author: item.author || 'Unknown',
        cover_url: item.cover || null,
        tiktok_link: item.link || null,
        rank_diff: item.rank_diff ?? null,
        is_commercial: item.if_cml ?? false,
      })
    )

    return NextResponse.json({
      songs,
      country,
      rank_type: rankType,
      time_period: parseInt(period),
      fetched_at: new Date().toISOString(),
      demo: false,
    })
  } catch (err) {
    console.error('Trending music fetch error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch trending music', details: String(err) },
      { status: 500 }
    )
  }
}

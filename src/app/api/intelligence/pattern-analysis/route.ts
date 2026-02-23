import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type {
  EmotionalTone,
  CharacterArchetype,
  MatrixCell,
  ProvenFormula,
  IntelligenceReport,
  HookTriggerType,
} from '@/lib/types'

const EMOTIONAL_TONES: EmotionalTone[] = [
  'comeback',
  'revenge',
  'quiet_transformation',
  'rock_bottom',
  'against_all_odds',
]

const ARCHETYPES: CharacterArchetype[] = [
  'blue_collar_worker',
  'healthcare',
  'service_industry',
  'transport',
  'retired',
  'parent',
  'tradesperson',
  'office_worker',
  'creative',
  'food_service',
]

// Maps character job keywords to archetypes
function jobToArchetype(job: string): CharacterArchetype {
  const j = job.toLowerCase()
  if (/nurs|doctor|hospital|medical|health|physio|para/.test(j)) return 'healthcare'
  if (/truck|driver|postal|delivery|courier|transport|bus|taxi|uber/.test(j)) return 'transport'
  if (/retir|pension/.test(j)) return 'retired'
  if (/parent|mother|father|mom|dad|stay.at.home/.test(j)) return 'parent'
  if (/plumb|electr|carpenter|builder|construct|welder|mason|roofer|tile/.test(j)) return 'tradesperson'
  if (/office|admin|account|manag|finance|banker|insurance|clerk/.test(j)) return 'office_worker'
  if (/artist|design|writer|musician|photog|creative|actor|filmmaker/.test(j)) return 'creative'
  if (/cook|chef|baker|food|restaurant|kitchen|cafeteria|lunch|waiter|waitress|barista/.test(j)) return 'food_service'
  if (/server|bartend|retail|cashier|store|shop|sales|service/.test(j)) return 'service_industry'
  return 'blue_collar_worker'
}

function getWeekLabel(date: Date): string {
  const year = date.getFullYear()
  const start = new Date(year, 0, 1)
  const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
  return `W${week} ${year}`
}

const MOCK_REPORT: IntelligenceReport = {
  matrix: EMOTIONAL_TONES.map((tone) =>
    ARCHETYPES.map((archetype) => {
      // Seed pseudo-random but deterministic scores per cell
      const toneIdx = EMOTIONAL_TONES.indexOf(tone)
      const archIdx = ARCHETYPES.indexOf(archetype)
      const seed = (toneIdx * 3 + archIdx * 7) % 17
      // Some cells unexplored (null)
      if (seed % 5 === 0) {
        return { tone, archetype, avgScore: null, storyCount: 0, topStoryId: null, isDeadZone: false }
      }
      const score = 3 + ((seed * 13 + toneIdx * 2 + archIdx) % 70) / 10
      const count = 1 + (seed % 4)
      return {
        tone,
        archetype,
        avgScore: Math.min(10, parseFloat(score.toFixed(1))),
        storyCount: count,
        topStoryId: `demo-${toneIdx}-${archIdx}`,
        isDeadZone: score < 4 && count >= 2,
      }
    })
  ),
  topFormulas: [
    {
      rank: 1,
      tone: 'comeback',
      archetype: 'transport',
      format: '30j_defi',
      hookType: 'shock_stat',
      compositeScore: 9.2,
      storyCount: 4,
      topStoryIds: ['demo-0-3'],
      rationale: "Transport workers resonate deeply with comeback arcs — their job demands physical endurance, and audiences mirror that struggle directly onto their own lives. Shock stat hooks amplify the transformation's scale.",
    },
    {
      rank: 2,
      tone: 'against_all_odds',
      archetype: 'healthcare',
      format: 'pov_coach',
      hookType: 'curiosity_gap',
      compositeScore: 8.8,
      storyCount: 3,
      topStoryIds: ['demo-4-1'],
      rationale: 'Healthcare archetypes carry instant credibility. Curiosity gaps about their "hidden" transformation trigger massive completion rates because viewers trust the source.',
    },
    {
      rank: 3,
      tone: 'quiet_transformation',
      archetype: 'food_service',
      format: 'personne_ne_ma_dit',
      hookType: 'radical_relatability',
      compositeScore: 8.4,
      storyCount: 2,
      topStoryIds: ['demo-2-9'],
      rationale: "Food service workers create cognitive dissonance — they serve others' health while neglecting their own. Quiet transformation arcs feel earned and authentic to this audience.",
    },
    {
      rank: 4,
      tone: 'rock_bottom',
      archetype: 'parent',
      format: 'journee_dans_sa_vie',
      hookType: 'radical_relatability',
      compositeScore: 8.1,
      storyCount: 3,
      topStoryIds: ['demo-3-5'],
      rationale: "Parental rock bottom stories unlock universal guilt and hope simultaneously — creating the highest comment-to-view ratios across all tested archetypes.",
    },
    {
      rank: 5,
      tone: 'revenge',
      archetype: 'office_worker',
      format: 'avant_que_je_sache',
      hookType: 'curiosity_gap',
      compositeScore: 7.9,
      storyCount: 2,
      topStoryIds: ['demo-1-7'],
      rationale: 'Office worker revenge narratives tap into widespread workplace frustration. The "before I knew" format builds suspense that drives 90%+ swipe-through rates.',
    },
  ],
  trendData: [
    { week: 'W6 2026', avgScore: 6.1, benchmark: 6.5 },
    { week: 'W7 2026', avgScore: 6.8, benchmark: 6.5 },
    { week: 'W8 2026', avgScore: 7.2, benchmark: 6.5 },
    { week: 'W9 2026', avgScore: 7.0, benchmark: 6.5 },
    { week: 'W10 2026', avgScore: 7.8, benchmark: 6.5 },
    { week: 'W11 2026', avgScore: 8.1, benchmark: 6.5 },
    { week: 'W12 2026', avgScore: 8.4, benchmark: 6.5 },
  ],
  totalStoriesAnalyzed: 0,
  lastUpdated: new Date().toISOString(),
}

export async function POST() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ ...MOCK_REPORT, totalStoriesAnalyzed: 0, _demo: true })
  }

  try {
    const { data: stories, error } = await supabase
      .from('stories')
      .select('id, emotional_tone, character_job, hook_variants, comment_intelligence, created_at')
      .in('status', ['scenes_ready', 'complete'])

    if (error || !stories || stories.length < 5) {
      return NextResponse.json({ ...MOCK_REPORT, totalStoriesAnalyzed: stories?.length ?? 0, _demo: true })
    }

    // Build cell accumulator
    type CellAcc = { scores: number[]; storyIds: string[] }
    const cellMap: Map<string, CellAcc> = new Map()

    for (const story of stories) {
      const tone = story.emotional_tone as EmotionalTone
      if (!EMOTIONAL_TONES.includes(tone)) continue

      const archetype = jobToArchetype(story.character_job ?? '')

      // Compute composite score from hook_variants and virality_verdict
      let score = 5 // default mid
      let hasScore = false

      if (story.hook_variants && Array.isArray(story.hook_variants)) {
        const avgPersona =
          story.hook_variants.reduce((sum: number, hv: { scroll_stop_score?: number }) => {
            return sum + (hv.scroll_stop_score ?? 5)
          }, 0) / story.hook_variants.length
        // hook scroll_stop_score is 0–10
        score = avgPersona
        hasScore = true
      }

      if (story.comment_intelligence?.tension_analysis?.sequel_potential_score != null) {
        const sp = story.comment_intelligence.tension_analysis.sequel_potential_score
        score = hasScore ? (score + sp) / 2 : sp
        hasScore = true
      }

      if (!hasScore) continue

      const key = `${tone}::${archetype}`
      const existing = cellMap.get(key) ?? { scores: [], storyIds: [] }
      existing.scores.push(score)
      existing.storyIds.push(story.id)
      cellMap.set(key, existing)
    }

    // Build matrix
    const matrix: MatrixCell[][] = EMOTIONAL_TONES.map((tone) =>
      ARCHETYPES.map((archetype) => {
        const key = `${tone}::${archetype}`
        const acc = cellMap.get(key)
        if (!acc || acc.scores.length === 0) {
          return { tone, archetype, avgScore: null, storyCount: 0, topStoryId: null, isDeadZone: false }
        }
        const avg = acc.scores.reduce((a, b) => a + b, 0) / acc.scores.length
        const avgScore = parseFloat(avg.toFixed(1))
        const bestIdx = acc.scores.indexOf(Math.max(...acc.scores))
        return {
          tone,
          archetype,
          avgScore,
          storyCount: acc.scores.length,
          topStoryId: acc.storyIds[bestIdx],
          isDeadZone: avgScore < 4 && acc.scores.length >= 2,
        }
      })
    )

    // Build top formulas (top 5 cells by avgScore with storyCount >= 1)
    const cells: (MatrixCell & { toneIdx: number; archIdx: number })[] = []
    matrix.forEach((row, ti) =>
      row.forEach((cell, ai) => {
        if (cell.avgScore !== null) cells.push({ ...cell, toneIdx: ti, archIdx: ai })
      })
    )
    cells.sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))

    const topFormulas: ProvenFormula[] = cells.slice(0, 5).map((cell, i) => ({
      rank: i + 1,
      tone: cell.tone,
      archetype: cell.archetype,
      format: '30j_defi',
      hookType: 'shock_stat' as HookTriggerType,
      compositeScore: cell.avgScore ?? 0,
      storyCount: cell.storyCount,
      topStoryIds: cell.topStoryId ? [cell.topStoryId] : [],
      rationale: `${cell.tone.replace(/_/g, ' ')} × ${cell.archetype.replace(/_/g, ' ')} yields a ${cell.avgScore}/10 avg across ${cell.storyCount} stories.`,
    }))

    // Build trend data (group by week)
    type WeekAcc = { scores: number[] }
    const weekMap: Map<string, WeekAcc> = new Map()
    for (const story of stories) {
      const week = getWeekLabel(new Date(story.created_at))
      const acc = weekMap.get(week) ?? { scores: [] }
      // We need a score per story — recompute simplified
      let sc = 5
      if (story.hook_variants?.length) {
        sc = story.hook_variants.reduce((s: number, hv: { scroll_stop_score?: number }) => s + (hv.scroll_stop_score ?? 5), 0) / story.hook_variants.length
      }
      acc.scores.push(sc)
      weekMap.set(week, acc)
    }

    const trendData = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, acc]) => ({
        week,
        avgScore: parseFloat((acc.scores.reduce((a, b) => a + b, 0) / acc.scores.length).toFixed(1)),
        benchmark: 6.5,
      }))

    const report: IntelligenceReport = {
      matrix,
      topFormulas: topFormulas.length > 0 ? topFormulas : MOCK_REPORT.topFormulas,
      trendData: trendData.length > 0 ? trendData : MOCK_REPORT.trendData,
      totalStoriesAnalyzed: stories.length,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(report)
  } catch (err) {
    console.error('Pattern analysis error:', err)
    return NextResponse.json({ ...MOCK_REPORT, _demo: true, _error: String(err) })
  }
}

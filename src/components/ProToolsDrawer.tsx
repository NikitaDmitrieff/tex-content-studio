'use client'

import { useState } from 'react'
import { Story, Scene, ScreeningResult, SwipeMomentumResult, AudioBrief, RealityAnchors, ScanResult } from '@/lib/types'
import {
  Wrench,
  ChevronDown,
  Activity,
  Clapperboard,
  BarChart3,
  Shield,
  Type,
  Layers,
  Sparkles,
  MessageSquare,
  Music,
  Video,
  Globe,
  Mic,
  Radio,
} from 'lucide-react'

import { HeartbeatStep } from './HeartbeatStep'
import { AudienceScreeningRoom } from './AudienceScreeningRoom'
import { SwipeMomentumPanel } from './SwipeMomentumPanel'
import { AuthenticityScanner } from './AuthenticityScanner'
import { CaptionHeatmapPanel } from './CaptionHeatmapPanel'
import { FormatAdapterPanel } from './FormatAdapterPanel'
import { HookLab } from './HookLab'
import { EngagementKit } from './EngagementKit'
import { CommentSeedLab } from './CommentSeedLab'
import { AudioBriefPanel } from './AudioBriefPanel'
import { CommentStormEngine } from './CommentStormEngine'
import { VoiceoverScriptPanel } from './VoiceoverScriptPanel'
import { MultiPlatformAmplifier } from './MultiPlatformAmplifier'
import { VoiceStudioPanel } from './VoiceStudioPanel'
import { TrendingMusicPanel } from './TrendingMusicPanel'
import { RealityAnchorCard } from './RealityAnchorCard'

type ToolId =
  | 'heartbeat'
  | 'screening'
  | 'swipe'
  | 'authenticity'
  | 'heatmap'
  | 'format'
  | 'hooklab'
  | 'engagement'
  | 'seeds'
  | 'audio'
  | 'commentstorm'
  | 'voiceover'
  | 'voicestudio'
  | 'trendingmusic'
  | 'amplify'

type ToolDef = {
  id: ToolId
  label: string
  description: string
  icon: React.ReactNode
  requiresScenes: boolean
  requiresImages: boolean
}

const PRE_PUBLISH_TOOLS: ToolDef[] = [
  { id: 'heartbeat', label: 'Heartbeat Editor', description: 'Design emotional arc before generation', icon: <Activity className="w-4 h-4" />, requiresScenes: false, requiresImages: false },
  { id: 'screening', label: 'Audience Screening Room', description: '5 persona reactions + drop-off', icon: <Clapperboard className="w-4 h-4" />, requiresScenes: true, requiresImages: false },
  { id: 'swipe', label: 'Swipe Momentum Analyzer', description: 'Per-slide completion prediction', icon: <BarChart3 className="w-4 h-4" />, requiresScenes: true, requiresImages: false },
  { id: 'authenticity', label: 'Authenticity Scanner', description: 'Detect AI smell in scenes', icon: <Shield className="w-4 h-4" />, requiresScenes: true, requiresImages: false },
  { id: 'heatmap', label: 'Caption Power Word Heatmap', description: 'Score French words for scroll-stop', icon: <Type className="w-4 h-4" />, requiresScenes: true, requiresImages: false },
  { id: 'format', label: 'Format DNA Adapter', description: 'Reframe in 8 viral structures', icon: <Layers className="w-4 h-4" />, requiresScenes: true, requiresImages: false },
]

const POST_PUBLISH_TOOLS: ToolDef[] = [
  { id: 'hooklab', label: 'Hook A/B Lab', description: '3 hook variants + persona scoring', icon: <span className="text-sm">🎣</span>, requiresScenes: true, requiresImages: false },
  { id: 'engagement', label: 'Engagement Intelligence Kit', description: 'Audience analysis + strategy', icon: <Sparkles className="w-4 h-4" />, requiresScenes: true, requiresImages: false },
  { id: 'seeds', label: 'Comment Seed Lab', description: 'Pre-write French thread starters', icon: <span className="text-sm">🌱</span>, requiresScenes: true, requiresImages: false },
  { id: 'audio', label: 'Audio Brief Studio', description: 'BPM, mood arc, song suggestions', icon: <Music className="w-4 h-4" />, requiresScenes: true, requiresImages: false },
  { id: 'commentstorm', label: 'Comment Storm Sequel Engine', description: 'Generate Part 2 from comments', icon: <MessageSquare className="w-4 h-4" />, requiresScenes: true, requiresImages: false },
]

const REPURPOSING_TOOLS: ToolDef[] = [
  { id: 'voiceover', label: 'Voiceover Script Companion', description: 'Timing + narration for video', icon: <Video className="w-4 h-4" />, requiresScenes: true, requiresImages: true },
  { id: 'voicestudio', label: 'AI Voice Studio', description: 'Generate AI voiceover per slide', icon: <Mic className="w-4 h-4" />, requiresScenes: true, requiresImages: false },
  { id: 'trendingmusic', label: 'Trending Music Picker', description: 'Top TikTok songs by country', icon: <Radio className="w-4 h-4" />, requiresScenes: false, requiresImages: false },
  { id: 'amplify', label: 'Multi-Platform Amplifier', description: 'Adapt to Shorts, Reels, etc.', icon: <Globe className="w-4 h-4" />, requiresScenes: true, requiresImages: false },
]

export function ProToolsDrawer({
  story,
  scenes,
  onStoryUpdate,
  onScenesUpdate,
  screeningResult,
  onScreeningComplete,
  swipeMomentumResult,
  onSwipeAnalysisComplete,
  onAudioBriefGenerated,
}: {
  story: Story
  scenes: Scene[]
  onStoryUpdate: (updates: Partial<Story>) => void
  onScenesUpdate: (scenes: Scene[]) => void
  screeningResult: ScreeningResult | null
  onScreeningComplete: (result: ScreeningResult) => void
  swipeMomentumResult: SwipeMomentumResult | null
  onSwipeAnalysisComplete: (result: SwipeMomentumResult | null) => void
  onAudioBriefGenerated: (brief: AudioBrief) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedTool, setExpandedTool] = useState<ToolId | null>(null)
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [screeningLoading, setScreeningLoading] = useState(false)
  const [showScreeningModal, setShowScreeningModal] = useState(false)

  const hasScenes = scenes.length > 0
  const hasImages = scenes.some((s) => s.image_url)
  const toolCount = PRE_PUBLISH_TOOLS.length + POST_PUBLISH_TOOLS.length + REPURPOSING_TOOLS.length

  function toggleTool(id: ToolId) {
    setExpandedTool((prev) => (prev === id ? null : id))
  }

  async function handleScreenStory() {
    setScreeningLoading(true)
    try {
      const res = await fetch('/api/screen-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: scenes.map((s) => ({ description: s.description, emotional_beat: s.emotional_beat })),
          character_name: story.character_name,
          character_job: story.character_job,
          character_age: story.character_age,
          emotional_tone: story.emotional_tone,
        }),
      })
      const data = await res.json()
      if (data.personas) {
        onScreeningComplete(data)
        setShowScreeningModal(true)
      }
    } catch (err) {
      console.error('Screening failed:', err)
    } finally {
      setScreeningLoading(false)
    }
  }

  function renderToolContent(tool: ToolDef) {
    const disabled = (tool.requiresScenes && !hasScenes) || (tool.requiresImages && !hasImages)

    if (disabled) {
      return (
        <div className="py-8 text-center text-sm text-zinc-600">
          {!hasScenes ? 'Generate scenes first to use this tool.' : 'Generate images first to use this tool.'}
        </div>
      )
    }

    switch (tool.id) {
      case 'heartbeat':
        return (
          <HeartbeatStep
            story={story}
            onUpdate={onStoryUpdate}
            onBack={() => {}}
            onContinue={() => setExpandedTool(null)}
          />
        )
      case 'screening':
        return (
          <>
            <button
              onClick={handleScreenStory}
              disabled={screeningLoading}
              className="w-full btn-accent flex items-center justify-center gap-2 mb-4"
            >
              {screeningLoading ? (
                <>
                  <div className="spinner w-4 h-4" />
                  <span>Running screening...</span>
                </>
              ) : (
                <>
                  <Clapperboard className="w-4 h-4" />
                  <span>{screeningResult ? 'Re-run Screening' : 'Screen Story'}</span>
                  {screeningResult && (
                    <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-semibold">
                      Score: {screeningResult.virality_score}
                    </span>
                  )}
                </>
              )}
            </button>
            {showScreeningModal && (
              <AudienceScreeningRoom
                result={screeningResult}
                scenes={scenes}
                onScenesUpdate={onScenesUpdate}
                onContinue={() => setShowScreeningModal(false)}
                onClose={() => setShowScreeningModal(false)}
                onRerun={handleScreenStory}
                isLoading={screeningLoading}
              />
            )}
          </>
        )
      case 'swipe':
        return (
          <SwipeMomentumPanel
            scenes={scenes}
            storyId={story.id}
            onScenesUpdate={onScenesUpdate}
            initialResult={swipeMomentumResult}
            onResultChange={onSwipeAnalysisComplete}
          />
        )
      case 'authenticity':
        return (
          <AuthenticityScanner
            scenes={scenes}
            onScenesUpdate={onScenesUpdate}
            scanResults={scanResults}
            onScanComplete={setScanResults}
            isRealityGrounded={story.is_reality_grounded}
          />
        )
      case 'heatmap':
        return <CaptionHeatmapPanel scenes={scenes} onScenesUpdate={onScenesUpdate} />
      case 'format':
        return <FormatAdapterPanel story={story} scenes={scenes} onScenesUpdate={onScenesUpdate} />
      case 'hooklab':
        return (
          <HookLab
            story={story}
            scenes={scenes}
            screeningResult={screeningResult}
            onUseHook={(hookText) => {
              const withImages = scenes.filter((s) => s.image_url)
              if (withImages.length > 0) {
                const updated = scenes.map((s) =>
                  s.id === withImages[0].id ? { ...s, caption: hookText } : s
                )
                onScenesUpdate(updated)
              }
            }}
          />
        )
      case 'engagement':
        return <EngagementKit story={story} scenes={scenes} existingCaption={null} language="en" />
      case 'seeds':
        return <CommentSeedLab storyId={story.id} emotionalTone={story.emotional_tone} />
      case 'audio':
        return <AudioBriefPanel story={story} scenes={scenes} onBriefGenerated={onAudioBriefGenerated} />
      case 'commentstorm':
        return <CommentStormEngine story={story} onClose={() => setExpandedTool(null)} />
      case 'voiceover':
        return <VoiceoverScriptPanel story={story} scenes={scenes} />
      case 'voicestudio':
        return <VoiceStudioPanel story={story} scenes={scenes} />
      case 'trendingmusic':
        return <TrendingMusicPanel />
      case 'amplify':
        return <MultiPlatformAmplifier story={story} scenes={scenes} language="en" />
      default:
        return null
    }
  }

  function renderCategory(label: string, tools: ToolDef[]) {
    return (
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-2">
          {label}
        </h4>
        {tools.map((tool) => {
          const isExpanded = expandedTool === tool.id
          const disabled = (tool.requiresScenes && !hasScenes) || (tool.requiresImages && !hasImages)

          return (
            <div key={tool.id}>
              <button
                onClick={() => toggleTool(tool.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isExpanded
                    ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/20'
                    : disabled
                      ? 'opacity-40 cursor-default'
                      : 'hover:bg-white/[0.04]'
                }`}
                disabled={disabled}
              >
                <span className={isExpanded ? 'text-[var(--accent)]' : 'text-zinc-500'}>
                  {tool.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isExpanded ? 'text-white' : 'text-zinc-300'}`}>
                    {tool.label}
                  </p>
                  <p className="text-xs text-zinc-600 truncate">{tool.description}</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              {isExpanded && (
                <div className="mt-2 mb-4 pl-1 pr-1">
                  {renderToolContent(tool)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Wrench className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-300">Pro Tools</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-500 font-medium">
            {toolCount}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-6 border-t border-white/[0.06] pt-4">
          {renderCategory('Pre-Publish Analysis', PRE_PUBLISH_TOOLS)}
          {renderCategory('Post-Publish Optimization', POST_PUBLISH_TOOLS)}
          {renderCategory('Repurposing', REPURPOSING_TOOLS)}

          {story.is_reality_grounded && story.reality_anchors && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-2">
                Data
              </h4>
              <div className="glass-card p-4">
                <RealityAnchorCard realityAnchors={story.reality_anchors as RealityAnchors} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

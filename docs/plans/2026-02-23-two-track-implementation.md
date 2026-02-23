# Two-Track Story Builder — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 5-step story wizard with a single-page progressive flow + collapsible Pro Tools drawer, without removing any features.

**Architecture:** Rewrite `StoryWorkspace.tsx` as a single scrollable page with 4 progressive sections (Character, Scenes, Images, Export). Create a new `ProToolsDrawer.tsx` component that holds all 14 optional panels in an accordion grouped by category. Adapt existing step components to work inline (remove nav buttons). All internal panel components remain unchanged.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide icons

---

### Task 1: Create ProToolsDrawer component

**Files:**
- Create: `src/components/ProToolsDrawer.tsx`

**Step 1: Create the ProToolsDrawer component**

This is a collapsible drawer with 3 categories of tools in accordion style. Each tool renders its existing panel component. Only one tool expanded at a time.

```tsx
'use client'

import { useState } from 'react'
import { Story, Scene, ScreeningResult, SwipeMomentumResult, AudioBrief, RealityAnchors } from '@/lib/types'
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
  Zap,
  Video,
  Globe,
} from 'lucide-react'

// Pro tool panels
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
import { RealityAnchorCard } from './RealityAnchorCard'
import { ScanResult, ScreeningResult as ScreeningResultType } from '@/lib/types'

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
  | 'amplify'
  | 'reality'

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
  const toolCount = PRE_PUBLISH_TOOLS.length + POST_PUBLISH_TOOLS.length + REPURPOSING_TOOLS.length + (story.is_reality_grounded && story.reality_anchors ? 1 : 0)

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
              const scenesWithImages = scenes.filter((s) => s.image_url)
              if (scenesWithImages.length > 0) {
                const updated = scenes.map((s) =>
                  s.id === scenesWithImages[0].id ? { ...s, caption: hookText } : s
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
      {/* Drawer header — always visible */}
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

      {/* Drawer content */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-6 border-t border-white/[0.06] pt-4">
          {renderCategory('Pre-Publish Analysis', PRE_PUBLISH_TOOLS)}
          {renderCategory('Post-Publish Optimization', POST_PUBLISH_TOOLS)}
          {renderCategory('Repurposing', REPURPOSING_TOOLS)}

          {/* Reality Anchors — conditional */}
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
```

**Step 2: Verify the file compiles**

Run: `cd /private/tmp/tex-content-studio && npx tsc --noEmit --pretty 2>&1 | head -30`

Fix any type errors if they appear.

**Step 3: Commit**

```bash
git add src/components/ProToolsDrawer.tsx
git commit -m "feat: add ProToolsDrawer accordion component for 14 pro tools"
```

---

### Task 2: Slim down StoryArcStep — remove embedded panels

**Files:**
- Modify: `src/components/StoryArcStep.tsx`

The current `StoryArcStep` has 6 panels inlined after the scene list: SwipeMomentumPanel, CaptionHeatmapPanel, AuthenticityScanner, AudienceScreeningRoom button + modal, FormatAdapterPanel, and ArcOverlay. We strip all of them out. The component keeps: scene generation, scene list with edit/delete/reorder, and the "Add Scene" button. It also no longer needs `onBack`/`onContinue` nav buttons — those are handled by the parent.

**Step 1: Rewrite StoryArcStep as a clean scene manager**

Remove imports for: `AuthenticityScanner`, `AudienceScreeningRoom`, `SwipeMomentumPanel`, `FormatAdapterPanel`, `CaptionHeatmapPanel`, `Clapperboard`, `Activity`. Remove the `ArcOverlay` import (will be rendered by parent).

Remove props: `onBack`, `onContinue`, `onScreeningComplete`, `onSwipeAnalysisComplete`.

Remove state: `scanResults`, `screeningResult`, `showScreeningRoom`, `screeningLoading`, `swipeMomentumResult`.

Remove functions: `handleScreenStory`.

Remove from JSX: the entire section after `{/* Add scene button */}` down to `{/* Navigation */}`, and the Navigation div at the bottom, and the AudienceScreeningRoom modal at the very end.

The resulting component signature:

```tsx
export function StoryArcStep({
  story,
  scenes,
  onScenesUpdate,
}: {
  story: Story
  scenes: Scene[]
  onScenesUpdate: (scenes: Scene[]) => void
}) {
```

Keep the entire scene generation logic (`handleGenerate`), scene editing (`startEdit`, `saveEdit`, `cancelEdit`), reordering (`moveScene`), deleting (`handleDelete`), and adding (`handleAdd`). Keep the auto-scan of authenticity within `handleGenerate` — but remove the `setScanResults` call inside it (just remove the auto-scan block entirely since authenticity is now in Pro Tools).

Remove the `ArrowLeft`, `ArrowRight` icon imports if no longer used.

**Step 2: Verify compilation**

Run: `cd /private/tmp/tex-content-studio && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add src/components/StoryArcStep.tsx
git commit -m "refactor: strip embedded panels from StoryArcStep, keep scene manager only"
```

---

### Task 3: Slim down ExportStep — caption + download only

**Files:**
- Modify: `src/components/ExportStep.tsx`

The current ExportStep has 8 tabs (export, hooklab, engagement, seeds, voiceover, amplify, audio, reality) and imports 7 panel components. Strip it down to just the Export & Caption functionality: carousel preview, caption generator, download button. Remove the tab bar and all tab content. Remove `onBack` prop (parent handles navigation).

**Step 1: Rewrite ExportStep as caption + download**

Remove imports for: `EngagementKit`, `VoiceoverScriptPanel`, `MultiPlatformAmplifier`, `HookLab`, `CommentStormEngine`, `AudioBriefPanel`, `CommentSeedLab`, `RealityAnchorCard`. Remove `ScreeningResult`, `AudioBrief`, `RealityAnchors` type imports if no longer used.

Remove: `ActiveTab` type, `activeTab` state, `showCommentStorm` state, `audioBrief` state.

Remove props: `onBack`, `screeningResult`.

New simpler signature:

```tsx
export function ExportStep({
  story,
  scenes,
  onScenesUpdate,
  audioBrief,
}: {
  story: Story
  scenes: Scene[]
  onScenesUpdate: (scenes: Scene[]) => void
  audioBrief?: AudioBrief | null
}) {
```

Keep: carousel preview, caption generation, download ZIP, voiceover script (right column), hashtags, slide overlay text editors. The export functionality in the download function should accept `audioBrief` from props rather than local state.

Remove from JSX: the entire tab bar, all tab conditional renders (hooklab, engagement, seeds, voiceover, amplify, audio, reality tabs), the Comment Storm overlay, and all the duplicated "Back to Images" navigation buttons. Remove the bottom nav bar entirely.

**Step 2: Verify compilation**

Run: `cd /private/tmp/tex-content-studio && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add src/components/ExportStep.tsx
git commit -m "refactor: strip ExportStep to caption + download, remove 8-tab bar"
```

---

### Task 4: Adapt CharacterStep — remove nav buttons

**Files:**
- Modify: `src/components/CharacterStep.tsx`

**Step 1: Remove onContinue prop and the continue button**

Remove the `onContinue` prop from the component signature. Remove the "Continue to Story Arc" button div at the bottom. The character form remains exactly as-is. The parent will handle the "Generate Story" action.

New signature:

```tsx
export function CharacterStep({
  story,
  onUpdate,
  lockedCharacter,
}: {
  story: Story
  onUpdate: (updates: Partial<Story>) => void
  lockedCharacter?: Character | null
}) {
```

Remove `ArrowRight` from the lucide imports.

**Step 2: Verify compilation**

Run: `cd /private/tmp/tex-content-studio && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add src/components/CharacterStep.tsx
git commit -m "refactor: remove nav buttons from CharacterStep"
```

---

### Task 5: Adapt ImageGenerationStep — remove nav buttons

**Files:**
- Modify: `src/components/ImageGenerationStep.tsx`

**Step 1: Remove onBack, onContinue props and navigation buttons**

Remove `onBack` and `onContinue` from props. Remove the `ArrowLeft`, `ArrowRight` imports. Remove the navigation div at the bottom of the JSX. Keep the `swipeScore` prop (it can still come from Pro Tools state).

New signature:

```tsx
export function ImageGenerationStep({
  story,
  scenes,
  visualDna,
  onScenesUpdate,
  swipeScore,
}: {
  story: Story
  scenes: Scene[]
  visualDna?: string | null
  onScenesUpdate: (scenes: Scene[]) => void
  swipeScore?: number | null
}) {
```

**Step 2: Verify compilation**

Run: `cd /private/tmp/tex-content-studio && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add src/components/ImageGenerationStep.tsx
git commit -m "refactor: remove nav buttons from ImageGenerationStep"
```

---

### Task 6: Rewrite StoryWorkspace as single-page progressive flow

**Files:**
- Modify: `src/components/StoryWorkspace.tsx`

This is the core task. Replace the step-based wizard with a single scrollable page. The component renders all 4 sections progressively (showing sections as their prerequisites are met), plus the Pro Tools drawer.

**Step 1: Rewrite StoryWorkspace**

Key changes:
- Remove `step` state, `StepIndicator` import, and all step-based conditional rendering
- Remove `HeartbeatStep` import (now in ProToolsDrawer)
- Add `ProToolsDrawer` import
- Add `audioBrief` state for passing between ProTools and ExportStep
- Smart default heartbeat: when generating story, if no heartbeat_arc is set, auto-apply V-Shape Comeback defaults
- Progressive rendering: Character always visible, Scenes visible when `scenes.length > 0`, Images visible when story has scenes (show ImageGenerationStep), Export visible when any scene has `image_url`

The new component:

```tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Story, Scene, Character, ScreeningResult, SwipeMomentumResult, AudioBrief, HeartbeatArc } from '@/lib/types'
import { CharacterStep } from './CharacterStep'
import { StoryArcStep } from './StoryArcStep'
import { ImageGenerationStep } from './ImageGenerationStep'
import { ExportStep } from './ExportStep'
import { ArcOverlay } from './ArcOverlay'
import { ProToolsDrawer } from './ProToolsDrawer'
import Link from 'next/link'
import { ArrowLeft, Eye, Sparkles, ImageIcon } from 'lucide-react'
import { buildArcScenes } from './ArcTemplateGrid'

const DEFAULT_HEARTBEAT_INTENSITIES = [5, 4, 3, 1, 3, 6, 8, 9]

const SAVE_DEBOUNCE_MS = 1500

export function StoryWorkspace({
  initialStory,
  initialScenes,
  lockedCharacter,
}: {
  initialStory: Story
  initialScenes: Scene[]
  lockedCharacter?: Character | null
}) {
  const [story, setStory] = useState<Story>(initialStory)
  const [scenes, setScenes] = useState<Scene[]>(initialScenes)
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null)
  const [swipeMomentumResult, setSwipeMomentumResult] = useState<SwipeMomentumResult | null>(null)
  const [audioBrief, setAudioBrief] = useState<AudioBrief | null>(null)
  const [generatingStory, setGeneratingStory] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Auto-save logic (preserved from original)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>(JSON.stringify(initialStory))
  const storyRef = useRef(story)
  storyRef.current = story

  const saveStory = useCallback(async (storyToSave: Story) => {
    if (storyToSave.id.startsWith('demo-') || storyToSave.id.startsWith('new-')) return
    const serialized = JSON.stringify(storyToSave)
    if (serialized === lastSavedRef.current) return
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/stories/${storyToSave.id}/save`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: storyToSave.character_name,
          character_age: storyToSave.character_age,
          character_job: storyToSave.character_job,
          character_backstory: storyToSave.character_backstory,
          character_physical: storyToSave.character_physical,
          visual_dna: storyToSave.visual_dna,
          emotional_tone: storyToSave.emotional_tone,
          heartbeat_arc: storyToSave.heartbeat_arc,
          arc_template_used: storyToSave.arc_template_used,
        }),
      })
      if (res.ok) {
        lastSavedRef.current = serialized
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }
  }, [])

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveStory(storyRef.current)
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [story, saveStory])

  useEffect(() => {
    function handleBeforeUnload() {
      const s = storyRef.current
      if (s.id.startsWith('demo-') || s.id.startsWith('new-')) return
      const serialized = JSON.stringify(s)
      if (serialized === lastSavedRef.current) return
      navigator.sendBeacon(
        `/api/stories/${s.id}/save`,
        new Blob(
          [JSON.stringify({
            character_name: s.character_name,
            character_age: s.character_age,
            character_job: s.character_job,
            character_backstory: s.character_backstory,
            character_physical: s.character_physical,
            visual_dna: s.visual_dna,
            emotional_tone: s.emotional_tone,
            heartbeat_arc: s.heartbeat_arc,
            arc_template_used: s.arc_template_used,
          })],
          { type: 'application/json' }
        )
      )
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  function handleStoryUpdate(updates: Partial<Story>) {
    setStory((prev) => ({ ...prev, ...updates }))
  }

  function handleScenesUpdate(newScenes: Scene[]) {
    setScenes(newScenes)
  }

  // Generate story — applies default heartbeat if none set
  async function handleGenerateStory() {
    setGeneratingStory(true)

    // Apply default heartbeat arc if user hasn't customized one via Pro Tools
    let heartbeatArc = story.heartbeat_arc
    let arcTemplateUsed = story.arc_template_used
    if (!heartbeatArc || heartbeatArc.scenes.length === 0) {
      heartbeatArc = { scenes: buildArcScenes(DEFAULT_HEARTBEAT_INTENSITIES) }
      arcTemplateUsed = 'V-Shape Comeback'
      handleStoryUpdate({ heartbeat_arc: heartbeatArc, arc_template_used: arcTemplateUsed })
    }

    try {
      let previousEpisodesSummary: string | undefined
      if (story.character_id) {
        try {
          const prevRes = await fetch(
            `/api/character-episodes?character_id=${story.character_id}&exclude_story_id=${story.id}`
          )
          if (prevRes.ok) {
            const prevData = await prevRes.json()
            previousEpisodesSummary = prevData.summary
          }
        } catch {
          // optional
        }
      }

      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: {
            name: story.character_name,
            age: story.character_age,
            job: story.character_job,
            backstory: story.character_backstory,
            physical_description: story.character_physical,
          },
          emotional_tone: story.emotional_tone,
          story_id: story.id,
          character_id: story.character_id ?? undefined,
          previous_episodes_summary: previousEpisodesSummary,
          reality_anchors: story.reality_anchors ?? undefined,
          heartbeat_arc: heartbeatArc ?? undefined,
          arc_template_used: arcTemplateUsed ?? undefined,
        }),
      })
      const data = await res.json()

      if (data.scenes && Array.isArray(data.scenes)) {
        const newScenes: Scene[] = data.scenes.map(
          (s: { description: string; emotional_beat: string; visual_prompt: string }, i: number) => ({
            id: `scene-${Date.now()}-${i}`,
            story_id: story.id,
            order_index: i,
            description: s.description,
            emotional_beat: s.emotional_beat,
            visual_prompt: s.visual_prompt,
            image_url: null,
            caption: null,
            created_at: new Date().toISOString(),
          })
        )
        setScenes(newScenes)
      }
    } catch (err) {
      console.error('Failed to generate scenes:', err)
    } finally {
      setGeneratingStory(false)
    }
  }

  const canGenerate =
    story.character_name &&
    story.character_age &&
    story.character_job &&
    story.character_backstory &&
    story.character_physical &&
    story.emotional_tone

  const hasScenes = scenes.length > 0
  const hasImages = scenes.some((s) => s.image_url)
  const backHref = lockedCharacter ? `/characters/${lockedCharacter.id}` : '/'
  const backLabel = lockedCharacter ? `Back to ${lockedCharacter.name}` : 'Back to dashboard'

  return (
    <div className="fade-in space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>

        <div className="flex items-center gap-3">
          {saveStatus !== 'idle' && (
            <span
              className={`text-xs transition-opacity ${
                saveStatus === 'saving'
                  ? 'text-zinc-500'
                  : saveStatus === 'saved'
                    ? 'text-emerald-500/70'
                    : 'text-red-400/70'
              }`}
            >
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'error' && 'Save failed'}
            </span>
          )}

          {hasScenes && !story.id.startsWith('demo-') && !story.id.startsWith('new-') && (
            <Link
              href={`/stories/${story.id}/preview`}
              className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl transition-colors"
              style={{
                background: 'rgba(109,90,255,0.12)',
                border: '1px solid rgba(109,90,255,0.3)',
                color: '#8577ff',
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </Link>
          )}
        </div>
      </div>

      {/* ① CHARACTER */}
      <CharacterStep
        story={story}
        onUpdate={handleStoryUpdate}
        lockedCharacter={lockedCharacter}
      />

      {/* Generate Story button */}
      {canGenerate && (
        <div className="flex justify-center">
          <button
            onClick={handleGenerateStory}
            disabled={generatingStory}
            className="btn-accent flex items-center gap-2 px-6 py-3 text-base"
          >
            {generatingStory ? (
              <>
                <div className="spinner" />
                <span>Generating Story...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{hasScenes ? 'Regenerate Story' : 'Generate Story'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ② SCENES */}
      {hasScenes && (
        <>
          <StoryArcStep
            story={story}
            scenes={scenes}
            onScenesUpdate={handleScenesUpdate}
          />

          {/* Arc Overlay — shows heartbeat alignment */}
          {story.heartbeat_arc && story.heartbeat_arc.scenes.length > 0 && (
            <ArcOverlay heartbeatArc={story.heartbeat_arc} scenes={scenes} />
          )}
        </>
      )}

      {/* ③ IMAGES */}
      {hasScenes && (
        <ImageGenerationStep
          story={story}
          scenes={scenes}
          visualDna={lockedCharacter?.visual_dna}
          onScenesUpdate={handleScenesUpdate}
          swipeScore={swipeMomentumResult?.overall_score ?? null}
        />
      )}

      {/* ④ EXPORT */}
      {hasImages && (
        <ExportStep
          story={story}
          scenes={scenes}
          onScenesUpdate={handleScenesUpdate}
          audioBrief={audioBrief}
        />
      )}

      {/* Pro Tools Drawer */}
      {hasScenes && (
        <ProToolsDrawer
          story={story}
          scenes={scenes}
          onStoryUpdate={handleStoryUpdate}
          onScenesUpdate={handleScenesUpdate}
          screeningResult={screeningResult}
          onScreeningComplete={setScreeningResult}
          swipeMomentumResult={swipeMomentumResult}
          onSwipeAnalysisComplete={setSwipeMomentumResult}
          onAudioBriefGenerated={setAudioBrief}
        />
      )}
    </div>
  )
}
```

**Step 2: Verify compilation**

Run: `cd /private/tmp/tex-content-studio && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add src/components/StoryWorkspace.tsx
git commit -m "feat: rewrite StoryWorkspace as single-page progressive flow with ProToolsDrawer"
```

---

### Task 7: Remove StepIndicator and clean up unused imports

**Files:**
- Delete: `src/components/StepIndicator.tsx` (no longer imported anywhere)

**Step 1: Verify StepIndicator is unused**

Run: `grep -r "StepIndicator" src/ --include="*.tsx" --include="*.ts"`

If only `StepIndicator.tsx` itself shows up, it's safe to delete.

**Step 2: Delete StepIndicator**

```bash
rm src/components/StepIndicator.tsx
```

**Step 3: Verify compilation**

Run: `cd /private/tmp/tex-content-studio && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused StepIndicator component"
```

---

### Task 8: Build and smoke test

**Step 1: Run the full build**

Run: `cd /private/tmp/tex-content-studio && npm run build 2>&1 | tail -30`

Expected: Build succeeds with no errors.

**Step 2: Fix any build errors**

If there are type errors or missing imports, fix them. Common issues to watch for:
- `StoryArcStep` callers passing old props (`onBack`, `onContinue`, etc.)
- `ExportStep` callers passing old props (`onBack`, `screeningResult`, etc.)
- `CharacterStep` callers passing `onContinue`
- `ImageGenerationStep` callers passing `onBack`, `onContinue`
- `ContentWeekWorkspace` might import and use these components with old signatures — check if it does and adapt

Run: `grep -rn "StoryArcStep\|ExportStep\|CharacterStep\|ImageGenerationStep" src/ --include="*.tsx" | grep -v "^src/components/"` to find all external callers.

**Step 3: Commit fixes if any**

```bash
git add -A
git commit -m "fix: resolve build errors from component signature changes"
```

---

### Task 9: Final verification — dev server

**Step 1: Start dev server**

Run: `cd /private/tmp/tex-content-studio && npm run dev &`

**Step 2: Verify the story page loads**

Run: `curl -s http://localhost:3000/story/demo-1 | head -20`

Expected: HTML response (not a 500 error).

**Step 3: Stop dev server and commit**

```bash
kill %1
```

No commit needed if everything works. If fixes were required, commit them.

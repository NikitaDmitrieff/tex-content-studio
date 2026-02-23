# Two-Track Story Builder — Design Document

**Date:** 2026-02-23
**Status:** Approved
**Goal:** Simplify the story builder UX without removing any features

## Problem

The current 5-step wizard (Character → Heartbeat → Story Arc → Images → Export) embeds 14 optional analysis/optimization panels across its steps. Story Arc has 6 panels below the scene list. Export has 8 tabs. A user who just wants to make a TikTok carousel faces overwhelming complexity with no clear fast path.

## Solution: Two-Track Architecture

Replace the step wizard with a single scrollable page that has two tracks:

1. **Fast Track** (default) — 4 progressive sections: Character → Scenes → Images → Export. One "Generate" button per section. No steps, no tabs, no navigation buttons.
2. **Pro Tools** — A collapsible drawer at the bottom containing all 14 optional panels organized into 3 categories. Collapsed by default. Accordion-style: one tool open at a time.

## Page Layout

```
┌─────────────────────────────────────────┐
│  Back to Dashboard          [Preview]   │
├─────────────────────────────────────────┤
│  ① CHARACTER CARD (always visible)      │
│     Name, Age, Job, Backstory, Physical │
│     Tone Selector                       │
│     [From Photo] [Regenerate]           │
│              [Generate Story]           │
│                                         │
│  ② SCENES (after generation)            │
│     Scene cards with edit/delete/reorder│
│     Arc Overlay (if heartbeat set)      │
│              [Generate Images]          │
│                                         │
│  ③ IMAGES (after image generation)      │
│     Image grid with caption editors     │
│                                         │
│  ④ EXPORT (after images exist)          │
│     Caption generator + Download ZIP    │
│                                         │
│  ─── Pro Tools (14) ▼ ──────────────    │
│  (collapsed by default, accordion)      │
└─────────────────────────────────────────┘
```

## Pro Tools Drawer — 3 Categories

### Pre-Publish Analysis
- **Heartbeat Editor** — design emotional arc before generation
- **Audience Screening Room** — 5 persona reactions + drop-off points
- **Swipe Momentum Analyzer** — per-slide completion prediction
- **Authenticity Scanner** — detect AI smell in scene text
- **Caption Power Word Heatmap** — score French words for scroll-stop
- **Format DNA Adapter** — reframe story in 8 viral structures

### Post-Publish Optimization
- **Hook A/B Lab** — 3 hook variants with persona scoring
- **Engagement Intelligence Kit** — audience analysis + posting strategy
- **Comment Seed Lab** — pre-write French thread-starter comments
- **Audio Brief Studio** — BPM range, mood arc, song suggestions
- **Comment Storm Sequel Engine** — generate Part 2 from comment debates

### Repurposing
- **Voiceover Script Companion** — timing + narration for video conversion
- **Multi-Platform Amplifier** — adapt carousel to YouTube Shorts, Reels, etc.

Reality Anchors card shown inline when story is reality-grounded.

## Component Migration Map

| Component | From | To | Internal Changes |
|---|---|---|---|
| CharacterStep | Step 1 | Section ① | Remove nav buttons |
| HeartbeatStep | Step 2 | Pro Tools drawer | Becomes optional |
| StoryArcStep | Step 3 | Section ② | Strip 6 embedded panels, keep scene list + generate + edit |
| ImageGenerationStep | Step 4 | Section ③ | Remove nav buttons |
| ExportStep | Step 5 (8 tabs) | Section ④ | Strip to caption + download only, kill tab bar |
| SwipeMomentumPanel | StoryArcStep | Pro Tools → Pre-publish | None |
| CaptionHeatmapPanel | StoryArcStep | Pro Tools → Pre-publish | None |
| AuthenticityScanner | StoryArcStep | Pro Tools → Pre-publish | None |
| AudienceScreeningRoom | StoryArcStep | Pro Tools → Pre-publish | None |
| FormatAdapterPanel | StoryArcStep | Pro Tools → Pre-publish | None |
| HookLab | Export tab | Pro Tools → Post-publish | None |
| EngagementKit | Export tab | Pro Tools → Post-publish | None |
| CommentSeedLab | Export tab | Pro Tools → Post-publish | None |
| AudioBriefPanel | Export tab | Pro Tools → Post-publish | None |
| CommentStormEngine | Export overlay | Pro Tools → Post-publish | None |
| VoiceoverScriptPanel | Export tab | Pro Tools → Repurposing | None |
| MultiPlatformAmplifier | Export tab | Pro Tools → Repurposing | None |
| ArcOverlay | StoryArcStep | Inline after scenes | None |

## Key Behaviors

1. **Progressive disclosure** — sections appear as content is generated (no step numbers)
2. **Smart default Heartbeat** — "V-Shape Comeback" template auto-applied when user skips Heartbeat tool
3. **Pro Tools collapsed by default** — header bar shows tool count, click to expand
4. **Accordion within Pro Tools** — one tool expanded at a time
5. **Prerequisite hints** — tools that need scenes/images show "Generate scenes first" in disabled state
6. **Auto-save** — preserved from current StoryWorkspace behavior

## Scope

### Changed
- `StoryWorkspace.tsx` — rewritten as single-page orchestrator
- `StoryArcStep.tsx` — stripped of 6 embedded panels
- `ExportStep.tsx` — stripped to caption + download (no tab bar)
- `CharacterStep.tsx` — remove nav buttons
- `HeartbeatStep.tsx` — adapted for drawer context
- `StepIndicator.tsx` — removed (no longer needed)
- New: `ProToolsDrawer.tsx` — accordion drawer component

### Untouched
- Dashboard (`/`)
- Characters system (`/characters/*`)
- Content Week (`/content-week`)
- Intelligence (`/intelligence`)
- TikTok Preview (`/stories/[id]/preview`)
- All 29 API routes
- All 14 panel components internally

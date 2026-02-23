export type EmotionalTone =
  | 'comeback'
  | 'revenge'
  | 'quiet_transformation'
  | 'rock_bottom'
  | 'against_all_odds'

export type StoryStatus = 'draft' | 'scenes_ready' | 'images_generating' | 'complete'

export type Story = {
  id: string
  character_name: string
  character_age: number
  character_job: string
  character_backstory: string
  character_physical: string
  visual_dna?: string | null
  emotional_tone: EmotionalTone
  status: StoryStatus
  character_id?: string | null
  created_at: string
  reality_anchors?: RealityAnchors | null
  is_reality_grounded?: boolean
  selected_hook?: string | null
  hook_variants?: HookWithScoring[] | null
  comment_intelligence?: CommentIntelligence | null
  comment_seeds?: CommentSeedKit | null
}

export type Character = {
  id: string
  name: string
  age: number | null
  job: string | null
  backstory: string | null
  physical_description: string | null
  visual_dna: string | null
  created_at: string
}

export type Scene = {
  id: string
  story_id: string
  order_index: number
  description: string
  emotional_beat: string
  visual_prompt: string
  image_url: string | null
  caption: string | null
  created_at: string
}

export const EMOTIONAL_TONES: { value: EmotionalTone; label: string; emoji: string }[] = [
  { value: 'comeback', label: 'Comeback', emoji: '🔥' },
  { value: 'revenge', label: 'Revenge Body', emoji: '💪' },
  { value: 'quiet_transformation', label: 'Quiet Transformation', emoji: '🌅' },
  { value: 'rock_bottom', label: 'Rock Bottom', emoji: '⬇️' },
  { value: 'against_all_odds', label: 'Against All Odds', emoji: '🏆' },
]

export type VoiceoverScriptSlide = {
  slide_number: number
  timing_seconds: number
  narration: string
}

export type MusicMood = 'raw/lo-fi' | 'emotional/piano' | 'triumphant/upbeat' | 'quiet/ambient'

export type VoiceoverScript = {
  intro_hook: string
  slides: VoiceoverScriptSlide[]
  outro_cta: string
  total_duration_seconds: number
  music_mood: MusicMood
}

export type ScanResult = {
  slide_index: number
  human_score: number
  flagged_phrases: string[]
  verdict: 'authentic' | 'suspicious' | 'ai_smell'
  rewrite: string | null
}

export type JobCategory =
  | 'truck_driver'
  | 'nurse'
  | 'factory_worker'
  | 'school_worker'
  | 'office_worker'
  | 'other'

export const JOB_CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: 'truck_driver', label: 'Truck driver' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'factory_worker', label: 'Factory worker' },
  { value: 'school_worker', label: 'School worker' },
  { value: 'office_worker', label: 'Office worker' },
  { value: 'other', label: 'Other' },
]

export const STRUGGLE_CHIPS = [
  { id: 'late_night_cravings', label: 'Late-night cravings' },
  { id: 'knee_pain', label: 'Knee pain' },
  { id: 'no_energy', label: 'No energy' },
  { id: 'family_pressure', label: 'Family pressure' },
  { id: 'no_time', label: 'No time' },
  { id: 'gym_embarrassment', label: 'Embarrassment at gym' },
  { id: 'doctors_warning', label: "Doctor's warning" },
] as const

export type RealDataInput = {
  journey: {
    start_weight?: string
    end_weight?: string
    timeframe?: string
    freeform?: string
  }
  job?: {
    category?: JobCategory
    struggle?: string
  }
  struggles?: string[]
  struggle_detail?: string
  turning_point?: string
  proof?: string
  privacy?: {
    change_age: boolean
    change_gender: boolean
    change_city: boolean
    change_job_type: boolean
  }
}

export type RealityAnchorItem = {
  fact: string
  type: 'real' | 'inspired' | 'invented'
  scene_index?: number | null
}

export type RealityAnchors = {
  anchors: RealityAnchorItem[]
  turning_point_scene_index?: number | null
  proof_scene_index?: number | null
}

export type PersonaReaction = {
  name: string
  age: number
  job: string
  city: string
  emoji: string
  completion_likelihood: number
  predicted_comment: string
  would_save: boolean
  would_share: boolean
  drop_off_slide: number | null
  emotional_reaction: string
}

export type SceneScore = {
  scene_index: number
  engagement_score: number
  danger_zone: boolean
  note: string
  rewrite_suggestion?: string
}

export type ScreeningResult = {
  personas: PersonaReaction[]
  scene_scores: SceneScore[]
  virality_score: number
  verdict: 'ready' | 'needs_work' | 'reshoot'
  key_improvements: string[]
}

export type HookTriggerType = 'curiosity_gap' | 'shock_stat' | 'radical_relatability'

export type HookVariant = {
  variant: string
  trigger_type: HookTriggerType
  confidence_score: number
  hook_length_chars: number
}

export type HookPersonaScore = {
  persona_name: string
  persona_emoji: string
  scroll_stop_likelihood: number
  predicted_reaction: string
}

export type HookWithScoring = {
  hook: HookVariant
  persona_scores: HookPersonaScore[]
  scroll_stop_score: number
}

export type CommentClassification = {
  believers: number
  skeptics: number
  question_askers: number
  emotional: number
  tag_friends: number
}

export type CommentTopQuotes = {
  believers: string[]
  skeptics: string[]
  question_askers: string[]
}

export type TensionAnalysis = {
  primary_debate: string
  burning_question: string
  viral_signal: string
  sequel_potential_score: number
}

export type CommentIntelligence = {
  classification: CommentClassification
  top_quotes: CommentTopQuotes
  tension_analysis: TensionAnalysis
}

export type SequelCommentDriver =
  | 'skeptics'
  | 'question_askers'
  | 'emotional_amp'
  | 'believers'
  | 'setup_part3'

export type SequelScene = {
  description: string
  emotional_beat: string
  visual_prompt: string
  comment_driver: SequelCommentDriver
}

export type SequelBlueprint = {
  scenes: SequelScene[]
  sequel_hook: string
  sequel_emotional_tone: EmotionalTone
}

export type SongSuggestion = {
  artist: string
  track: string
  mood_match_score: number
  why_it_fits: string
  tiktok_search_term: string
}

export type AudioBrief = {
  bpm_range: string
  mood_arc: string
  genre_tags: string[]
  french_affinity_score: number
  universal_score: number
  song_suggestions: SongSuggestion[]
  scene_energies: number[]
}

export const STATUS_CONFIG: Record<StoryStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  scenes_ready: { label: 'Scenes Ready', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  images_generating: { label: 'Generating', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  complete: { label: 'Complete', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
}

// ── Series Bible ─────────────────────────────────────────────────────────────

export type SeriesBibleEpisode = {
  episode_number: number
  title: string
  premise: string
  emotional_tone: EmotionalTone
  turning_point: string
  cliffhanger_hook: string
  audience_target: string
  season_timing_suggestion?: string
}

export type SeriesBible = {
  id: string
  character_id: string
  episodes: SeriesBibleEpisode[]
  created_at: string
  linked_story_ids?: (string | null)[]
}

// ── TikTok Format DNA Adapter ─────────────────────────────────────────────────

export type ContentFormatId =
  | 'pov_coach'
  | '30_jours_defi'
  | 'personne_ne_ma_dit'
  | 'essaye_30_jours'
  | 'avant_que_je_sache'
  | 'coach_dit_toujours'
  | 'commentaires_pousse'
  | 'journee_dans_sa_vie'

export type ContentFormat = {
  id: ContentFormatId
  name: string
  tagline: string
  best_for: string
  engagement_modifier: string
}

export type FormatAdaptResult = {
  adapted_scenes: Scene[]
  format_fit_score: number
  format_note: string
}

// ── Swipe Momentum Analyzer ──────────────────────────────────────────────────

export type MomentumType = 'strong' | 'building' | 'flat' | 'drop'

export type SlideSwipeScore = {
  slide_index: number
  swipe_probability: number       // 0-1
  momentum_type: MomentumType
  weakness: string
  fix_suggestion: string
  rewritten_caption: string
}

export type SwipeMomentumResult = {
  slide_scores: SlideSwipeScore[]
  overall_score: number           // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  drop_off_slide: number
  completion_rate_estimate: string
  critical_fixes: number[]
  strong_slides: number[]
}

// ── Viral Comment Seed Lab ────────────────────────────────────────────────────

export type CommentSeed = {
  archetype: 'gentle_skeptic' | 'personal_echo' | 'soft_provocateur' | 'curiosity_magnet' | 'shock_amplifier'
  comment_text: string
  creator_response: string
  controversy_level: 'douce' | 'sceptique' | 'hot_take' | 'curiosite' | 'choc'
  predicted_replies: string
  thread_shape: string
}

export type CommentSeedKit = {
  seeds: CommentSeed[]
  strategy_summary: string
  optimal_post_order: number[]
}

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

export const STATUS_CONFIG: Record<StoryStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  scenes_ready: { label: 'Scenes Ready', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  images_generating: { label: 'Generating', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  complete: { label: 'Complete', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
}

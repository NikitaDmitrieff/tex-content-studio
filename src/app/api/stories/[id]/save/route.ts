import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

const ALLOWED_FIELDS = new Set([
  'character_name',
  'character_age',
  'character_job',
  'character_backstory',
  'character_physical',
  'visual_dna',
  'emotional_tone',
  'heartbeat_arc',
  'arc_template_used',
  'status',
])

function isDemoId(id: string) {
  return id.startsWith('roster-') || id.startsWith('demo-') || id.startsWith('new-')
}

async function handleSave(request: NextRequest, id: string) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Skip DB save for demo/roster stories
  if (isDemoId(id)) {
    return NextResponse.json({ saved: true, demo: true })
  }

  // Filter to only allowed fields
  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      updates[key] = value
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Failed to save story:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ saved: true })
  } catch (err) {
    console.error('Save story error:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleSave(request, id)
}

// POST handler for sendBeacon (fires on page unload)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleSave(request, id)
}

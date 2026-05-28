import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceRoleClient()
    const { data } = await supabase.from('tasks').select('*, checklist_items(*)').eq('scene_id', params.id).order('sort_order')
    return NextResponse.json(data || [])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const supabase = createServiceRoleClient()

    const { data: scene } = await supabase.from('scenes').select('project_id').eq('id', params.id).single()
    if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 })

    const { data: last } = await supabase.from('tasks').select('sort_order').eq('scene_id', params.id).order('sort_order', { ascending: false }).limit(1).single()

    const { data, error } = await supabase.from('tasks').insert({
      scene_id: params.id,
      project_id: scene.project_id,
      title: body.title || 'New Task',
      status: 'todo',
      sort_order: (last?.sort_order ?? -1) + 1,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

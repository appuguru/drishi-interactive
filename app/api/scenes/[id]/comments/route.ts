import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('scene_id', params.id)
      .order('created_at', { ascending: true })
    return NextResponse.json(data || [])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await currentUser()
    const body = await req.json()
    const supabase = createServiceRoleClient()

    const { data: scene } = await supabase.from('scenes').select('project_id').eq('id', params.id).single()
    if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 })

    const { data, error } = await supabase.from('comments').insert({
      scene_id: params.id,
      project_id: scene.project_id,
      author_clerk_id: userId,
      author_name: user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User',
      author_avatar: user?.imageUrl,
      content: body.content,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

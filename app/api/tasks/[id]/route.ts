import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/utils/activity'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.from('tasks').update({ ...body, updated_at: new Date().toISOString() }).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (body.status === 'done') {
      await logActivity({ projectId: data.project_id, clerkId: userId, action: 'task_completed', entityType: 'task', entityId: data.id, entityTitle: data.title })
    }
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const supabase = createServiceRoleClient()
    await supabase.from('tasks').delete().eq('id', params.id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

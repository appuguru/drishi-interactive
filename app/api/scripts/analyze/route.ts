import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { analyzeScript } from '@/lib/openai/analyze-script'
import { generateSlug } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = (formData.get('title') as string) || 'Untitled Project'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Read file content
    let scriptText = ''
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      scriptText = buffer.toString('utf-8')
    } else if (file.name.endsWith('.pdf')) {
      // For PDF, convert buffer to base64 and extract text via AI
      scriptText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    } else if (file.name.endsWith('.docx')) {
      // Basic text extraction from DOCX (XML-based)
      const xmlContent = buffer.toString('utf-8')
      const textMatch = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
      if (textMatch) {
        scriptText = textMatch.map(t => t.replace(/<[^>]+>/g, '')).join(' ')
      } else {
        scriptText = xmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      }
    }

    if (!scriptText || scriptText.length < 50) {
      return NextResponse.json({ error: 'Could not extract text from file. Please try a .txt file.' }, { status: 400 })
    }

    // Analyze with AI
    const aiStructure = await analyzeScript(scriptText)

    // Create project in database
    const supabase = createServiceRoleClient()
    const slug = generateSlug(aiStructure.project_title || title)

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: aiStructure.project_title || title,
        description: aiStructure.description,
        slug,
        script_raw_text: scriptText.slice(0, 50000),
        ai_generated_structure: aiStructure,
        created_by: userId,
        status: 'draft',
        is_published: false,
      })
      .select()
      .single()

    if (projectError) {
      console.error('Project insert error:', projectError)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    return NextResponse.json({ projectId: project.id, structure: aiStructure })
  } catch (error: any) {
    console.error('Script analyze error:', error)
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 })
  }
}

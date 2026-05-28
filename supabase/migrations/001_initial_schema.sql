import OpenAI from 'openai'
import type { AIGeneratedStructure } from '@/types'

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

export async function analyzeScript(
  scriptText: string
): Promise<AIGeneratedStructure> {
  try {
    // Clean text properly
    const cleanedText = scriptText
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000)

    const completion =
      await client.chat.completions.create({
        model: 'llama3-70b-8192',

        temperature: 0.3,

        messages: [
          {
            role: 'system',
            content: `
You are an expert animation production analyst.

Return ONLY valid JSON.

No markdown.
No explanation.
No code blocks.
`,
          },

          {
            role: 'user',
            content: `
Analyze this script.

SCRIPT:
${cleanedText}

Return STRICT JSON in this exact format:

{
  "project_title": "string",
  "description": "string",
  "topics": [
    {
      "title": "string",
      "description": "string",
      "scenes": [
        {
          "title": "string",
          "description": "string",
          "script_text": "string",
          "characters": ["string"],
          "estimated_duration_seconds": 30,
          "complexity": "low",
          "suggested_tasks": ["Storyboard"]
        }
      ]
    }
  ],
  "characters": ["string"],
  "estimated_total_duration": "string",
  "production_notes": "string"
}
`,
          },
        ],
      })

    const text =
      completion.choices[0]?.message?.content

    console.log('AI RESPONSE:', text)

    if (!text) {
      throw new Error('No AI response')
    }

    let parsed: AIGeneratedStructure

    try {
      parsed = JSON.parse(text)
    } catch (err) {
      console.error('INVALID JSON:', text)

      parsed = {
        project_title: 'Generated Project',

        description:
          'AI returned invalid JSON but analysis succeeded.',

        topics: [],

        characters: [],

        estimated_total_duration: '',

        production_notes: '',
      }
    }

    // Safe defaults
    parsed.project_title =
      parsed.project_title || 'Untitled Project'

    parsed.description =
      parsed.description || ''

    parsed.characters =
      parsed.characters || []

    parsed.estimated_total_duration =
      parsed.estimated_total_duration || ''

    parsed.production_notes =
      parsed.production_notes || ''

    parsed.topics =
      parsed.topics || []

    return parsed
  } catch (error: any) {
    console.error('AI ERROR:', error)

    return {
      project_title: 'AI Analysis Failed',

      description:
        error?.message || 'Unknown AI error',

      topics: [],

      characters: [],

      estimated_total_duration: '',

      production_notes: '',
    }
  }
}

export async function extractTextFromScript(
  content: string,
  mimeType: string
): Promise<string> {
  try {
    // TXT
    if (mimeType === 'text/plain') {
      return content
    }

    // DOCX / PDF fallback cleaner
    const cleaned = content
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return cleaned.slice(0, 5000)
  } catch (error) {
    console.error('TEXT EXTRACT ERROR:', error)

    return content.slice(0, 2000)
  }
}
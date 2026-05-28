import OpenAI from 'openai'
import type { AIGeneratedStructure } from '@/types'

const apiKey = process.env.GROQ_API_KEY

if (!apiKey) {
  throw new Error('Missing GROQ_API_KEY')
}

const client = new OpenAI({
  apiKey,
  baseURL: 'https://api.groq.com/openai/v1',
})

const SYSTEM_PROMPT = `
You are an expert animation production analyst.

Return ONLY valid JSON.

No markdown.
No explanations.
No code blocks.
`

const USER_PROMPT = (scriptText: string) => `
Analyze this animation/video script.

SCRIPT:
${scriptText.slice(0, 3000)}

Return EXACTLY this JSON structure:

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
`

export async function analyzeScript(
  scriptText: string
): Promise<AIGeneratedStructure> {
  try {
    // CLEAN INPUT TEXT
    const cleanedText = scriptText
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const completion =
      await client.chat.completions.create({
        model: 'llama3-70b-8192',

        temperature: 0.3,

        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },

          {
            role: 'user',
            content: USER_PROMPT(cleanedText),
          },
        ],
      })

    const text =
      completion.choices[0]?.message?.content

    console.log('GROQ RESPONSE:', text)

    if (!text) {
      throw new Error('No AI response')
    }

    let parsed: AIGeneratedStructure

    try {
      // REMOVE MARKDOWN IF AI RETURNS IT
      const cleanedJson = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()

      parsed = JSON.parse(cleanedJson)
    } catch (jsonError) {
      console.error(
        'JSON Parse Error:',
        text
      )

      return {
        project_title:
          'AI Analysis Failed',

        description:
          'AI returned invalid JSON',

        topics: [],

        characters: [],

        estimated_total_duration: '',

        production_notes: '',
      }
    }

    // SAFE FALLBACKS

    parsed.project_title =
      parsed.project_title ||
      'Untitled Project'

    parsed.description =
      parsed.description || ''

    parsed.characters =
      parsed.characters || []

    parsed.estimated_total_duration =
      parsed.estimated_total_duration ||
      'Unknown'

    parsed.production_notes =
      parsed.production_notes || ''

    parsed.topics =
      parsed.topics || []

    parsed.topics = parsed.topics.map(
      (topic: any, ti: number) => ({
        title:
          topic.title ||
          `Topic ${ti + 1}`,

        description:
          topic.description || '',

        scenes: (topic.scenes || []).map(
          (scene: any, si: number) => ({
            title:
              scene.title ||
              `Scene ${si + 1}`,

            description:
              scene.description || '',

            script_text:
              scene.script_text || '',

            characters:
              scene.characters || [],

            estimated_duration_seconds:
              Number(
                scene.estimated_duration_seconds
              ) || 30,

            complexity: [
              'low',
              'medium',
              'high',
            ].includes(scene.complexity)
              ? scene.complexity
              : 'medium',

            suggested_tasks:
              scene.suggested_tasks || [
                'Storyboard',
                'Animation',
                'Sound Design',
              ],
          })
        ),
      })
    )

    return parsed
  } catch (error: any) {
    console.error(
      'Analyze Script Error:',
      error
    )

    return {
      project_title:
        'AI Analysis Failed',

      description:
        error?.message ||
        'Unknown AI error',

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
    // TXT FILE
    if (mimeType === 'text/plain') {
      return content
    }

    // CLEAN DOCX / PDF RAW CONTENT
    const cleaned = content
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return cleaned.slice(0, 5000)
  } catch (error) {
    console.error(
      'Text extraction error:',
      error
    )

    return content.slice(0, 3000)
  }
}
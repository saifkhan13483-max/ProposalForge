import Groq from 'groq-sdk'

const MODEL_CHAIN = [
  'llama-3.3-70b-versatile',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
]

function getApiKeys(): string[] {
  const suffixes = ['', '_B', '_C', '_D', '_E', '_F']
  const keys: string[] = []
  for (const suffix of suffixes) {
    const key = process.env[`GROQ_API_KEY${suffix}`]
    if (key?.trim()) keys.push(key.trim())
  }
  return keys
}

function isRateLimit(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { status?: number; statusText?: string; message?: string }
  return (
    e.status === 429 ||
    e.statusText === 'Too Many Requests' ||
    (typeof e.message === 'string' && e.message.includes('429'))
  )
}

export async function generateContent(prompt: string): Promise<string> {
  const keys = getApiKeys()

  if (keys.length === 0) {
    throw new Error('AI generation not configured. Please add GROQ_API_KEY.')
  }

  const errors: string[] = []

  for (const modelName of MODEL_CHAIN) {
    let allRateLimited = true

    for (const key of keys) {
      try {
        const groq = new Groq({ apiKey: key })
        const completion = await groq.chat.completions.create({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4096,
        })
        const text = completion.choices[0]?.message?.content
        if (!text) throw new Error('Empty response from Groq')
        return text
      } catch (err) {
        if (isRateLimit(err)) {
          errors.push(`${modelName}: rate limited`)
          continue
        }
        allRateLimited = false
        errors.push(`${modelName}: ${(err as Error).message}`)
        break
      }
    }

    if (allRateLimited) continue
  }

  throw new Error(`AI generation failed after trying all keys and models. Details: ${errors.join('; ')}`)
}

export function hasGeminiKey(): boolean {
  return getApiKeys().length > 0
}

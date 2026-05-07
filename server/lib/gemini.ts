import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

function getApiKeys(): string[] {
  const suffixes = ['', '_B', '_C', '_D', '_E', '_F']
  const keys: string[] = []
  for (const suffix of suffixes) {
    const key = process.env[`GEMINI_API_KEY${suffix}`]
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
    throw new Error('AI generation not configured. Please add GEMINI_API_KEY.')
  }

  const errors: string[] = []

  for (const modelName of MODEL_CHAIN) {
    let allRateLimited = true

    for (const key of keys) {
      try {
        const genAI = new GoogleGenerativeAI(key)
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        return result.response.text()
      } catch (err) {
        if (isRateLimit(err)) {
          errors.push(`${modelName}: rate limited`)
          // try next key with same model
          continue
        }
        // Non-rate-limit error — don't try other keys for this model
        allRateLimited = false
        errors.push(`${modelName}: ${(err as Error).message}`)
        break
      }
    }

    // If all keys were rate-limited for this model, try the next model
    if (allRateLimited) continue

    // Non-429 error on this model — still try next model as fallback
  }

  throw new Error(`AI generation failed after trying all keys and models. Details: ${errors.join('; ')}`)
}

export function hasGeminiKey(): boolean {
  return getApiKeys().length > 0
}

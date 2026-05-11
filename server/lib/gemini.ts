import { GoogleGenAI } from '@google/genai'

function getAI(): GoogleGenAI {
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY

  if (baseUrl && apiKey) {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        apiVersion: '',
        baseUrl,
      },
    })
  }

  const legacyKey = process.env.GEMINI_API_KEY
  if (legacyKey) {
    return new GoogleGenAI({ apiKey: legacyKey })
  }

  throw new Error('AI generation not configured. Please add a Gemini API key or enable the Replit AI integration.')
}

export async function generateContent(prompt: string): Promise<string> {
  const ai = getAI()

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  })

  const text = response.text
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

export function hasGeminiKey(): boolean {
  return !!(
    (process.env.AI_INTEGRATIONS_GEMINI_BASE_URL && process.env.AI_INTEGRATIONS_GEMINI_API_KEY) ||
    process.env.GEMINI_API_KEY
  )
}

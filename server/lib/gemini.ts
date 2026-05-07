import { GoogleGenerativeAI } from '@google/generative-ai'

export async function generateContent(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('AI generation not configured. Please add GEMINI_API_KEY.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  })

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

export function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY
}

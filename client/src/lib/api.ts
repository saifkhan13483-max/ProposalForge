import { auth } from '@/lib/firebase'

const BASE_URL = '/api'

async function getToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  try {
    return await user.getIdToken()
  } catch {
    return null
  }
}

export async function apiRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const token = await getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers || {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || err.message || `Request failed: ${res.status}`)
  }

  return res.json()
}

export const api = {
  get: <T>(path: string) => apiRequest<T>('GET', path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => apiRequest<T>('PUT', path, body),
  delete: <T>(path: string) => apiRequest<T>('DELETE', path),
}

// Legacy exports kept for any components that still import them
export function getAuthToken(): string | null { return null }
export function setAuthToken(_token: string): void {}
export function clearAuthToken(): void {}

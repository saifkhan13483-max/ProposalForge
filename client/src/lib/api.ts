import { auth } from '@/lib/firebase'

// Normalize VITE_API_URL so common mistakes don't break requests:
//   "https://x.up.railway.app"      → "https://x.up.railway.app/api"  ✓
//   "https://x.up.railway.app/"     → "https://x.up.railway.app/api"  ✓ (trailing slash)
//   "https://x.up.railway.app/api"  → "https://x.up.railway.app/api"  ✓ (already has /api)
//   "https://x.up.railway.app/api/" → "https://x.up.railway.app/api"  ✓ (trailing slash + /api)
//   "x.up.railway.app"              → "https://x.up.railway.app/api"  ✓ (missing https://)
//   "http://x.up.railway.app"       → "https://x.up.railway.app/api"  ✓ (upgrades http → https)
function buildBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined) || ''
  if (!raw) return '/api'

  let normalized = raw.trim().replace(/\/+$/, '') // trim whitespace + trailing slashes

  // Auto-add https:// if no protocol is present
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`
  }
  // Upgrade http → https (Railway always uses https)
  normalized = normalized.replace(/^http:\/\//, 'https://')

  return normalized.endsWith('/api') ? normalized : `${normalized}/api`
}

export const BASE_URL = buildBaseUrl()

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

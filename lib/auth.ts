import { NextRequest } from 'next/server'
import { verifyToken } from './jwt'

function parseCookies(cookieHeader: string | null) {
  const map: Record<string, string> = {}
  if (!cookieHeader) return map
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.split('=')
    const key = k?.trim()
    if (!key) continue
    map[key] = decodeURIComponent(v.join('=').trim())
  }
  return map
}

export function getAuthPayload(req: Request | NextRequest) {
  // Prefer Authorization header bearer token
  const auth = req.headers.get('authorization')
  if (auth) {
    const parts = auth.split(' ')
    if (parts.length === 2) {
      const token = parts[1]
      try {
        return verifyToken(token) as any
      } catch (e) {
        return null
      }
    }
  }

  // Fallback to cookie named 'session_token'
  const cookieHeader = req.headers.get('cookie')
  const cookies = parseCookies(cookieHeader)
  const session = cookies['session_token'] || cookies['session']
  if (!session) return null
  try {
    return verifyToken(session) as any
  } catch (e) {
    return null
  }
}

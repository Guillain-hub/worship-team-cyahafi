import jwt from 'jsonwebtoken'

export function signToken(payload: object, expiresIn = '7d') {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not configured')
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not configured')
  return jwt.verify(token, secret)
}

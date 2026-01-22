"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { Sparkles, Lock, User, ArrowLeft } from "lucide-react"

function RegisterForm({ onSuccess }: { onSuccess: (role: string | null) => void }) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullNameError, setFullNameError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  function validate() {
    let ok = true
    setFullNameError(null)
    setPhoneError(null)
    setPasswordError(null)
    const phoneRegex = /^\+?\d{7,15}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!fullName) { setFullNameError('Full name is required'); ok = false }
    if (!phone) { setPhoneError('Phone is required'); ok = false }
    else if (!phoneRegex.test(phone)) { setPhoneError('Invalid phone format'); ok = false }
    if (email && !emailRegex.test(email)) { setError('Invalid email format'); ok = false }
    if (!password || password.length < 8) { setPasswordError('Password must be at least 8 characters'); ok = false }
    return ok
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email: email || null, phone: phone, password }),
      })
      const json = await res.json()
      setLoading(false)
      if (!res.ok) { setError(json.error || 'Registration failed'); return }
      const memberRole = json?.member?.role ?? null
      onSuccess(memberRole)
    } catch (err: any) {
      setLoading(false)
      setError(err?.message ?? 'Network error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div>
        <Label className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Full name</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="mt-2 bg-white/5 text-white/90 text-sm" />
        {fullNameError && <p className="text-[9px] sm:text-[10px] text-red-400 mt-1">{fullNameError}</p>}
      </div>
      <div>
        <Label className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Email (optional)</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 bg-white/5 text-white/90 text-sm" />
      </div>
      <div>
        <Label className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2507..." className="mt-2 bg-white/5 text-white/90 text-sm" />
        {phoneError && <p className="text-[9px] sm:text-[10px] text-red-400 mt-1">{phoneError}</p>}
      </div>
      <div>
        <Label className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Password</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" className="mt-2 bg-white/5 text-white/90 text-sm" />
        {passwordError && <p className="text-[9px] sm:text-[10px] text-red-400 mt-1">{passwordError}</p>}
      </div>
      {error && <div className="text-[10px] sm:text-[11px] text-red-300 bg-red-600/10 p-2 sm:p-3 rounded">{error}</div>}
      <div className="pt-2">
        <Button type="submit" className="w-full h-10 sm:h-12 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm" disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </Button>
      </div>
    </form>
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [identifierError, setIdentifierError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    if (!validate()) return
    setLoading(true)
    const res = await login(identifier, password)
    setLoading(false)
    if (!res.ok) {
      setError(res.error || 'Login failed')
      return
    }

    const memberRole = (res as any)?.member?.role
    if (memberRole === 'Member') {
      router.push('/dashboard/member')
    } else {
      router.push('/dashboard')
    }
  }

  function validate() {
    let ok = true
    setIdentifierError(null)
    setPasswordError(null)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^\+?\d{7,15}$/

    if (!identifier) {
      setIdentifierError('Phone or email is required')
      ok = false
    } else if (identifier.includes('@')) {
      if (!emailRegex.test(identifier)) {
        setIdentifierError('Invalid email format')
        ok = false
      }
    } else {
      if (!phoneRegex.test(identifier)) {
        setIdentifierError('Invalid phone format')
        ok = false
      }
    }

    if (!password) {
      setPasswordError('Password is required')
      ok = false
    }
    return ok
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center px-2 sm:px-4">
      {/* --- SUNRISE BACKGROUND --- */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] scale-110 hover:scale-100"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=2070')` 
        }}
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 z-10 bg-black/30 backdrop-blur-[2px]" />

      {/* Back to Landing Button */}
      <Link href="/" className="absolute top-4 left-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 hover:border-white/40 pointer-events-auto" style={{ touchAction: 'manipulation' }}>
        <ArrowLeft size={18} />
        <span className="text-sm font-semibold">Back</span>
      </Link>

      <main className="relative z-20 w-full max-w-md px-2 sm:px-6 flex flex-col items-center space-y-4 sm:space-y-8 animate-in fade-in zoom-in duration-700">
        
        {/* --- WELCOME HEADER --- */}
        <div className="text-center space-y-1 sm:space-y-2">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
              <Sparkles className="text-orange-400" size={24} />
            </div>
          </div>
          <h1 className="text-white text-[9px] sm:text-xs font-black uppercase tracking-[0.4em] drop-shadow-md leading-tight">
            Welcome to Worship Team ADEPR Cyahafi
          </h1>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-xl leading-tight">
            Internal Portal
          </h2>
        </div>

        {/* --- ELEGANT TRANSPARENT CARD (Login / Register) --- */}
        <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex gap-1 sm:gap-2 bg-white/5 rounded-full p-1">
              <button onClick={() => setMode('login')} className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full font-black text-[9px] sm:text-xs tracking-widest uppercase transition-colors ${mode === 'login' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white/80'}`}>
                Login
              </button>
              <button onClick={() => setMode('register')} className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full font-black text-[9px] sm:text-xs tracking-widest uppercase transition-colors ${mode === 'register' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white/80'}`}>
                Register
              </button>
            </div>
            <div className="text-[8px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest">Authorized Personnel</div>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
              {/* Identifier Input */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Member ID (Email/Phone)</Label>
                <div className="relative group">
                  <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-orange-400 transition-colors" size={16} />
                  <Input 
                    value={identifier} 
                    onChange={(e) => setIdentifier(e.target.value)} 
                    placeholder="Enter your credentials"
                    className="h-11 sm:h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl pl-10 sm:pl-12 focus-visible:ring-orange-400/50 focus-visible:border-orange-400/50 transition-all shadow-inner text-sm"
                  />
                </div>
                {identifierError && <p className="text-[9px] sm:text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1">{identifierError}</p>}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest">Secret Key</Label>
                  <a href="#" className="text-[8px] sm:text-[9px] font-black text-orange-400 uppercase tracking-widest hover:text-white transition-colors">Forgot?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-orange-400 transition-colors" size={16} />
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="h-11 sm:h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl pl-10 sm:pl-12 focus-visible:ring-orange-400/50 focus-visible:border-orange-400/50 transition-all shadow-inner text-sm"
                  />
                </div>
                {passwordError && <p className="text-[9px] sm:text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1">{passwordError}</p>}
              </div>

              {error && (
                <div className="p-2 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-[10px] sm:text-[11px] font-bold text-red-200 text-center uppercase tracking-wider">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-10 sm:h-14 bg-white text-slate-900 hover:bg-orange-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm transition-all active:scale-95 shadow-xl"
              >
                {loading ? 'Authenticating...' : 'Enter Dashboard'}
              </Button>

              <div className="mt-2 sm:mt-4 text-center">
                <p className="text-[9px] sm:text-[10px] text-white/40">Don't have an account? <button onClick={() => setMode('register')} className="text-orange-400 font-black uppercase tracking-widest text-[9px] sm:text-[10px]">Register</button></p>
              </div>
            </form>
          ) : (
            <RegisterForm onSuccess={(memberRole) => {
              if (memberRole === 'Member') router.push('/dashboard/member')
              else router.push('/dashboard')
            }} />
          )}
        </div>

        {/* --- FOOTER DECORATION --- */}
        <p className="text-white/20 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.8em]">
          ADEPR CYAHAFI • 2026
        </p>
      </main>
    </div>
  )
}
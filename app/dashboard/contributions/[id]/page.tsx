"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lock, Pencil, Save, ArrowLeft, Loader2, XCircle, CheckCircle2, Phone, Wallet } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

// 1. Logic-only Rates (Not in DB)
const MEMBER_RATES: Record<string, number> = {
  'EMPLOYED': 1000,
  'SELF_EMPLOYED': 2000,
  'STUDENT': 500,
  'UNEMPLOYED': 0
};

export default function ContributionDetail() {
  const params = useParams()
  const id = params?.id as string | undefined
  const { user } = useAuth() 
  const router = useRouter()

  const [event, setEvent] = useState<any | null>(null)
  const [members, setMembers] = useState<any[]>([])
  // Check sessionStorage on mount to see if already unlocked
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('contrib_unlocked') === '1'
      } catch (e) {
        return false
      }
    }
    return false
  })
  const [passkey, setPasskey] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [rows, setRows] = useState<Record<string, { amount: string }>>({})
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({}) 
  const [loading, setLoading] = useState(true)
  const [isEditingMode, setIsEditingMode] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const eRes = await fetch(`/api/contributions/${id}`)
      const mRes = await fetch('/api/members')
      const eJson = await eRes.json()
      const mJson = await mRes.json()
      
      const currentEvent = eJson.event || null
      setEvent(currentEvent)
      setMembers(mJson.members || [])

      const amountMap: Record<string, any> = {}
      const statusInit: Record<string, boolean> = {}
      const existingContribs = currentEvent?.contributions || []
      
      mJson.members?.forEach((m: any) => {
        const existing = existingContribs.find((c: any) => c.memberId === m.id)
        
        // FLEXIBLE LOGIC:
        // If they already paid, show that amount.
        // If they haven't paid AND it's a Monthly event, show the SUGGESTED rate.
        // If the event is a Wedding, default to FRW 3000 for each member.
        // Otherwise, leave it empty.
        let suggestedAmount = ''
        if (existing) {
          suggestedAmount = String(existing.amount)
        } else if (currentEvent?.type === 'WEDDING') {
          suggestedAmount = '3000'
        } else if (currentEvent?.type === 'MONTHLY') {
          suggestedAmount = String(MEMBER_RATES[m.memberType] || '')
        }

        amountMap[m.id] = { amount: suggestedAmount }
        statusInit[m.id] = !!existing
      })
      
      setRows(amountMap)
      setStatusMap(statusInit)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  // Load data only when unlocked and when the `id` changes.
  useEffect(() => {
    if (unlocked) loadData()
  }, [id, unlocked])

  const verifyPasskey = async () => {
    setVerifying(true)
    try {
      const res = await fetch('/api/contributions/verify-passkey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passkey }) })
      const j = await res.json()
      if (!res.ok) return alert(j.error || 'Unauthorized')
      try { sessionStorage.setItem('contrib_unlocked', '1') } catch (e) {}
      setUnlocked(true)
    } catch (e) { alert('Network error') } finally { setVerifying(false) }
  }

  async function handleGlobalSave() {
    setSaving(true)
    try {
      const syncPromises = members.map(async (m) => {
        const isMarkedPaid = statusMap[m.id]
        const amt = rows[m.id]?.amount
        
        // This remains flexible: We save whatever is in the 'amt' box
        if (isMarkedPaid && Number(amt) > 0) {
          return fetch(`/api/contributions/${id}/member`, { 
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ memberId: m.id, amount: Number(amt) }) 
          })
        } else {
          return fetch(`/api/contributions/${id}/member`, { 
            method: 'DELETE', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ memberId: m.id }) 
          })
        }
      })
      await Promise.all(syncPromises)
      await loadData()
      setIsEditingMode(false)
    } catch (e) { alert("Error saving") } finally { setSaving(false) }
  }

  const totalPaid = Object.keys(statusMap).reduce((sum, memberId) => {
    if (statusMap[memberId]) return sum + (Number(rows[memberId]?.amount) || 0)
    return sum
  }, 0)

  const filteredMembers = members.filter(m => {
    if (filter === 'paid') return statusMap[m.id] === true
    if (filter === 'pending') return statusMap[m.id] === false
    return true
  })

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div>

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">

      {/* PASSKEY OVERLAY */}
      {!unlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] scale-110 hover:scale-100"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=2070')` }}
          />
          <div className="absolute inset-0 z-10 bg-black/30 backdrop-blur-[2px]" />

          <div className="relative z-20 w-full max-w-md px-6">
            <div className="w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
              <h3 className="text-lg font-bold mb-2 text-white">Passkey required</h3>
              <p className="text-sm text-white/80 mb-4">Enter the contributions passkey to view this page.</p>
              <Input type="password" value={passkey} onChange={(e) => setPasskey(e.target.value)} placeholder="Passkey" className="mb-4 bg-white/5 text-white/90" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setPasskey(''); try { sessionStorage.removeItem('contrib_unlocked') } catch(e){} }}>Cancel</Button>
                <Button onClick={verifyPasskey} disabled={verifying}>{verifying ? 'Checking...' : 'Enter'}</Button>
              </div>
            </div>
            <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.8em] mt-4 text-center">ADEPR CYAHAFI • 2026</p>
          </div>
        </div>
      )}
      
      {/* NAVIGATION BAR */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-sm font-bold truncate max-w-[150px]">{event?.name}</h1>
            <p className="text-[10px] text-muted-foreground">Total Collected: <span className="text-emerald-600 font-bold">FRW {totalPaid.toLocaleString()}</span></p>
          </div>
        </div>

        {!event?.locked && (
          isEditingMode ? (
            <Button size="sm" onClick={handleGlobalSave} disabled={saving} className="bg-emerald-600 h-8 text-xs px-4">
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
              Save Changes
            </Button>
          ) : (
            <Button size="sm" onClick={() => setIsEditingMode(true)} variant="outline" className="h-8 text-xs px-4">
              <Pencil className="h-3 w-3 mr-1" /> Enter Editing Mode
            </Button>
          )
        )}
      </div>

      <div className="px-4 py-2 border-b bg-muted/20">
        <Tabs value={filter} onValueChange={(val: any) => setFilter(val)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full h-8">
            <TabsTrigger value="all" className="text-xs">All Members</TabsTrigger>
            <TabsTrigger value="paid" className="text-xs">Paid</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8 px-2 text-center text-[10px]">#</TableHead>
              <TableHead className="text-[10px]">MEMBER</TableHead>
              <TableHead className="text-[10px]">AMOUNT (FRW)</TableHead>
              <TableHead className="w-10 text-center text-[10px]">STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((m, index) => {
              const currentAmount = rows[m.id]?.amount || '';
              const isChecked = !!statusMap[m.id];
              const hasAmount = Number(currentAmount) > 0;
              
              return (
                <TableRow key={m.id} className={`${isChecked ? "bg-emerald-500/5" : ""} active:bg-muted/50 transition-colors`}>
                  <TableCell className="px-2 text-center text-[10px] text-muted-foreground">{index + 1}</TableCell>
                  
                  <TableCell className="px-2 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{m.fullName}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[7px] h-3 px-1 uppercase leading-none font-bold">{m.memberType}</Badge>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span className="truncate">{m.phone || '---'}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={currentAmount}
                      disabled={!isEditingMode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRows(prev => ({ ...prev, [m.id]: { amount: val } }));
                        if (Number(val) <= 0) setStatusMap(prev => ({ ...prev, [m.id]: false }));
                      }}
                      className={`w-20 h-8 px-2 border rounded text-xs font-mono ${
                        !isEditingMode 
                          ? "bg-transparent border-transparent text-foreground" 
                          : "bg-background border-input focus:ring-1 ring-primary/30 outline-none"
                      }`}
                    />
                  </TableCell>

                  <TableCell className="px-2 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!isEditingMode || !hasAmount}
                      onChange={(e) => setStatusMap(prev => ({ ...prev, [m.id]: e.target.checked }))}
                      className="h-5 w-5 rounded accent-emerald-600 cursor-pointer"
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {event?.locked && (
        <div className="fixed bottom-0 w-full bg-slate-900 text-white p-2 text-center text-[10px] uppercase font-bold flex items-center justify-center gap-2">
          <Lock className="h-3 w-3" /> Records Locked
        </div>
      )}
    </div>
  )
}
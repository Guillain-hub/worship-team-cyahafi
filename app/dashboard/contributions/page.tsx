"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, Pencil, Search, Trash2, 
  Wallet, Loader2, ChevronDown, ChevronRight, MinusCircle,
  ArrowUpRight, History, Calendar, User, ArrowDownRight
} from 'lucide-react'

export default function ContributionsLandingPage() {
  const { toast } = useToast()
  const router = useRouter()

  // Passkey gating - always require entry when visiting this page
  const [unlocked, setUnlocked] = useState<boolean>(false)
  const [passkey, setPasskey] = useState('')
  const [verifying, setVerifying] = useState(false)
  const passkeyInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([]) 
  const [searchTerm, setSearchTerm] = useState('')
  
  // UI States
  const [showHistory, setShowHistory] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Form States
  const [currentEvent, setCurrentEvent] = useState<any>({ id: '', name: '', type: 'MONTHLY', date: '' })
  const [customType, setCustomType] = useState('')
  const [expenseForm, setExpenseForm] = useState({ id: '', reason: '', amount: 0, date: '' })
  const [expenseEditing, setExpenseEditing] = useState(false)

  const localDateString = (d?: any) => {
    if (!d) return ''
    const dt = new Date(d)
    return [dt.getFullYear(), String(dt.getMonth() + 1).padStart(2, '0'), String(dt.getDate()).padStart(2, '0')].join('-')
  }

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/contributions')
      const json = await res.json()
      setEvents(json.events || [])
      
      const expRes = await fetch('/api/expenses')
      const expJson = await expRes.json()
      setExpenses(expJson.expenses || [])
    } catch (e) { console.debug(e) } finally { setLoading(false) }
  }

  // only load when unlocked
  useEffect(() => {
    if (unlocked) load()
  }, [unlocked])



  const verifyPasskey = async () => {
    setVerifying(true)
    try {
      const res = await fetch('/api/contributions/verify-passkey', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passkey })
      })
      const j = await res.json()
      if (!res.ok) return toast({ title: 'Wrong passkey', variant: 'destructive', description: j.error || 'Unauthorized' })
      try { sessionStorage.setItem('contrib_unlocked', '1') } catch (e) {}
      setUnlocked(true)
    } catch (e) {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally { setVerifying(false) }
  }

  // Global Balance Logic
  const grossCollection = events.reduce((acc, ev) => acc + (ev.actualTotal || 0), 0)
  const totalExpenses = expenses.reduce((acc, ex) => acc + (ex.amount || 0), 0)
  const netBalance = grossCollection - totalExpenses

  const handleRecordUsage = async () => {
    if (expenseForm.amount <= 0 || !expenseForm.reason) {
      return toast({ title: "Details required", description: "Enter amount and reason" })
    }
    setIsProcessing(true)
    try {
      // Find or create 'System_Internal' event just for database compatibility
      // We keep this hidden from the user interface
      let eventIdToUse: string | undefined = undefined
      const internalEvent = events.find(ev => ev.name === '_internal_usage')
      
      if (internalEvent) {
        eventIdToUse = internalEvent.id
      } else {
        const createRes = await fetch('/api/contributions', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '_internal_usage', date: new Date().toISOString(), type: 'OTHER' })
        })
        const createJson = await createRes.json().catch(() => ({}))
        eventIdToUse = createJson.event?.id
      }

      let res
      if (expenseEditing && expenseForm.id) {
        // Edit existing expense
        res = await fetch(`/api/expenses/${expenseForm.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: expenseForm.amount, reason: expenseForm.reason, date: expenseForm.date || new Date().toISOString() })
        })
      } else {
        res = await fetch('/api/expenses', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            eventId: eventIdToUse, 
            amount: expenseForm.amount, 
            reason: expenseForm.reason,
            recipient: 'N/A' 
          })
        })
      }

      console.log('Record usage response:', { status: res.status, ok: res.ok })
      const responseData = await res.json().catch(() => ({}))
      console.log('Record usage response data:', responseData)

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to save')
      }
      
      toast({ title: expenseEditing ? 'Usage Updated' : 'Usage Recorded' })
      setExpenseOpen(false)
      setExpenseEditing(false)
      setExpenseForm({ id: '', reason: '', amount: 0, date: '' })
      load()
    } catch (e) {
      console.error('Record usage error:', e)
      toast({ title: "Error recording usage", variant: "destructive", description: String(e) })
    } finally { setIsProcessing(false) }
  }

  const deleteExpense = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this usage record?')) return
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE', credentials: 'include' })
      console.log('Delete response:', { status: res.status, ok: res.ok })
      
      const responseData = await res.json().catch(() => ({}))
      console.log('Delete response data:', responseData)
      
      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to delete')
      }
      
      toast({ title: 'Usage record deleted' })
      load()
    } catch (err) { 
      console.error('Delete error:', err)
      toast({ title: 'Error deleting record', variant: 'destructive', description: String(err) }) 
    }
  }

  const startEditExpense = (e: React.MouseEvent, ex: any) => {
    e.stopPropagation()
    setExpenseEditing(true)
    setExpenseForm({ 
      id: ex.id, 
      reason: ex.reason, 
      amount: ex.amount || 0, 
      date: ex.date ? localDateString(ex.date) : '' 
    })
    setExpenseOpen(true)
  }

  const handleSaveEvent = async () => {
    if (!currentEvent.name) return toast({ title: 'Name required' })
    setIsProcessing(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/contributions/${currentEvent.id}` : '/api/contributions'
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentEvent.name,
          date: currentEvent.date || new Date().toISOString(),
          type: currentEvent.type === 'OTHER' ? (customType || 'OTHER') : (currentEvent.type || 'MONTHLY')
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save')
      }
      
      toast({ title: editing ? 'Event Updated' : 'Event Created' })
      setFormOpen(false)
      setEditing(false)
      setCustomType('')
      setCurrentEvent({ id: '', name: '', type: 'MONTHLY', date: '' })
      load()
    } catch (e) {
      console.error('Save event error:', e)
      toast({ title: 'Error saving event', variant: 'destructive' })
    } finally { setIsProcessing(false) }
  }

  const deleteEvent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this event?')) return
    try {
      const res = await fetch(`/api/contributions/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete')
      }
      toast({ title: 'Event deleted' })
      load()
    } catch (err) {
      console.error('Delete event error:', err)
      toast({ title: 'Error deleting event', variant: 'destructive' })
    }
  }

  return (
    <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 max-w-[1200px] mx-auto">

      {/* PASSKEY DIALOG --- Use Dialog component for proper mobile support */}
      <Dialog open={!unlocked} onOpenChange={() => {}}>
        <DialogContent 
          onPointerDownOutside={(e) => e.preventDefault()} 
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="sm:max-w-[420px] p-0 border-none bg-transparent shadow-none"
        >
          <div className="relative w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">Enter passkey</h3>
            <p className="text-sm text-white/80 mb-6 sm:mb-8">This section is protected. Enter the passkey to continue.</p>
            
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Passkey</label>
                <Input 
                  ref={passkeyInputRef}
                  type="password" 
                  value={passkey} 
                  onChange={(e) => setPasskey(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && verifyPasskey()}
                  placeholder="••••••••" 
                  autoFocus
                  className="h-11 sm:h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl focus-visible:ring-orange-400/50 focus-visible:border-orange-400/50 transition-all shadow-inner text-sm"
                />
              </div>
              
              <div className="flex gap-2 sm:gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setPasskey('')} 
                  className="flex-1 h-10 sm:h-12 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={verifyPasskey} 
                  disabled={verifying} 
                  className="flex-1 h-10 sm:h-12 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl"
                >
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {verifying ? 'Checking...' : 'Enter'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* HEADER SECTION: BALANCE CARD */}
      <div className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm overflow-hidden">
        <div 
          className="p-3 sm:p-5 flex flex-col gap-3 sm:gap-4 cursor-pointer hover:bg-muted/20 transition-all"
          onClick={() => setShowHistory(!showHistory)}
        >
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center">
            <div className="space-y-1 w-full sm:w-auto">
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Wallet className="h-3 w-3 text-emerald-500 flex-shrink-0" /> Total Net Balance
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                {netBalance.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal opacity-60 text-muted-foreground">RWF</span>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-border hidden md:block" />
            <div className="hidden md:block space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Collections</span>
              <div className="text-sm font-bold opacity-80">{grossCollection.toLocaleString()} RWF</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <Button 
              variant="outline" size="sm" 
              className="rounded-lg sm:rounded-xl h-9 sm:h-10 border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs sm:text-sm w-full sm:w-auto justify-center sm:justify-start"
              onClick={(e) => { e.stopPropagation(); setExpenseEditing(false); setExpenseForm({ id: '', reason: '', amount: 0, date: '' }); setExpenseOpen(true); }}
            >
              <MinusCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> New Usage
            </Button>
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-muted-foreground bg-muted px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl whitespace-nowrap">
               <History className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" /> {showHistory ? "Hide History" : "Show History"}
            </div>
          </div>
        </div>

        {/* CLEAN HISTORY TABLE (Removed Reference/Event Column) */}
        {showHistory && (
          <div className="border-t bg-muted/5 animate-in slide-in-from-top-2 duration-200 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-[9px] sm:text-[10px] font-bold uppercase py-2 pl-3 sm:pl-6">Date</TableHead>
                  <TableHead className="text-[9px] sm:text-[10px] font-bold uppercase py-2">Usage Description</TableHead>
                  <TableHead className="text-[9px] sm:text-[10px] font-bold uppercase py-2 text-right pr-3 sm:pr-6">Amount Deducted</TableHead>
                  <TableHead className="text-[9px] sm:text-[10px] font-bold uppercase py-2 text-right pr-3 sm:pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-6 sm:py-10 text-muted-foreground text-xs">No records found</TableCell></TableRow>
                ) : expenses.map((ex, i) => (
                  <TableRow key={i} className="hover:bg-muted/20 border-b border-border/40">
                    <TableCell className="pl-3 sm:pl-6 py-2 sm:py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">
                      {new Date(ex.date || Date.now()).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-2 sm:py-3 text-xs sm:text-sm">
                      <div className="font-bold text-foreground truncate">{ex.reason}</div>
                    </TableCell>
                    <TableCell className="pr-3 sm:pr-6 py-2 sm:py-3 text-right font-mono font-bold text-red-600 text-xs sm:text-sm whitespace-nowrap">
                      -{ex.amount?.toLocaleString()} RWF
                    </TableCell>
                    <TableCell className="pr-3 sm:pr-6 py-2 sm:py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => startEditExpense(e, ex)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => deleteExpense(e, ex.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* COLLECTIONS TABLE (Filtered to exclude the hidden internal usage event) */}
      <Card className="rounded-xl border-border overflow-hidden shadow-sm">
        <div className="p-3 flex justify-between items-center border-b bg-muted/10">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search collections..." 
              className="pl-8 h-9 text-sm rounded-lg border-none bg-background shadow-none" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <Button size="sm" onClick={() => { setEditing(false); setFormOpen(true); }} className="rounded-lg font-bold">
            <Plus className="mr-1 h-4 w-4" /> New Event
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 text-[10px] font-bold uppercase">Source Event</TableHead>
              <TableHead className="text-[10px] font-bold uppercase">Date</TableHead>
              <TableHead className="text-[10px] font-bold uppercase">Category</TableHead>
              <TableHead className="text-[10px] font-bold uppercase">Total Inflow</TableHead>
              <TableHead className="text-right pr-6 text-[10px] font-bold uppercase">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events
              .filter(ev => ev.name !== '_internal_usage') // DON'T SHOW THE HIDDEN SYSTEM EVENT HERE
                .map((ev) => (
                <TableRow key={ev.id} className="cursor-pointer group h-12" onClick={() => router.push(`/dashboard/contributions/${ev.id}`)}>
                  <TableCell className="pl-6 font-bold text-sm group-hover:text-primary transition-colors">{ev.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ev.date ? new Date(ev.date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-bold">{ev.type}</Badge></TableCell>
                  <TableCell className="font-mono text-xs font-bold text-emerald-600">
                    <ArrowUpRight className="inline h-3 w-3 mr-1" />{ (ev.actualTotal || 0).toLocaleString() }
                  </TableCell>
                  <TableCell className="text-right pr-6">
                     <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setEditing(true); setCurrentEvent(ev); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => deleteEvent(e, ev.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                     </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      {/* DIALOG: NEW EVENT */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl p-6">
          <DialogHeader><DialogTitle className="text-lg font-black">{editing ? 'Edit Event' : 'New Contribution Event'}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">Event Name</label>
              <Input value={currentEvent.name} onChange={(e) => setCurrentEvent({...currentEvent, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Date</label>
                <Input type="date" value={currentEvent.date ? localDateString(currentEvent.date) : ''} onChange={(e) => setCurrentEvent({...currentEvent, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Type</label>
                <Select value={currentEvent.type} onValueChange={(v) => {
                  setCurrentEvent({...currentEvent, type: v})
                  if (v !== 'OTHER') setCustomType('')
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="ONE_OFF">One-off</SelectItem>
                    <SelectItem value="WEDDING">Wedding</SelectItem>
                    <SelectItem value="CONDOLENCE">Condolence</SelectItem>
                    <SelectItem value="HEALTH_SUPPORT">Health Support</SelectItem>
                    <SelectItem value="OTHER">Other (custom)</SelectItem>
                  </SelectContent>
                </Select>

                {currentEvent.type === 'OTHER' && (
                  <div className="pt-2">
                    <label className="text-[11px] font-medium text-muted-foreground">Custom Type</label>
                    <Input placeholder="Enter custom contribution type" value={customType} onChange={(e) => setCustomType(e.target.value)} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEvent}>{editing ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: USAGE (Clean Version) */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-black flex items-center gap-2">
                  <ArrowDownRight className="text-red-500" /> {expenseEditing ? 'Edit Usage' : 'Record Usage'}
                </DialogTitle>
              </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">Reason for Payout</label>
              <Input 
                placeholder="Description of the usage" 
                value={expenseForm.reason} 
                onChange={(e) => setExpenseForm({...expenseForm, reason: e.target.value})} 
                className="h-12 rounded-xl" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">Date</label>
                <Input type="date" value={expenseForm.date ? localDateString(expenseForm.date) : ''} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">Amount (RWF)</label>
                <Input 
                  type="number" 
                  placeholder="0"
                  value={expenseForm.amount || ''} 
                  onChange={(e) => setExpenseForm({...expenseForm, amount: Number(e.target.value)})} 
                  className="h-12 rounded-xl font-mono font-bold text-lg" 
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setExpenseOpen(false)} className="rounded-xl">Cancel</Button>
            <Button 
              disabled={isProcessing} 
              onClick={handleRecordUsage} 
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-6 h-12"
            >
               {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
               {expenseEditing ? 'Save' : 'Confirm Deduction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
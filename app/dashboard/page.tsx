"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Users, Calendar, HandCoins, Loader2, 
  Mic2, Bell, Clock, CheckCircle2, Trash2, Megaphone, AlertCircle, Edit3, ArrowRight, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-provider"

export default function DashboardPage() {
  const { user } = useAuth()
  const roleName = typeof user?.role === 'object' && user?.role && "name" in user?.role ? (user?.role as any).name : user?.role
  const [isLoading, setIsLoading] = useState(true)
  const [showRecentActivities, setShowRecentActivities] = useState(false)
  const [members, setMembers] = useState([])
  const [netBalance, setNetBalance] = useState<number | null>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [avgAttendance, setAvgAttendance] = useState<string>('—')
  const [announcement, setAnnouncement] = useState("")
  const [announcementsList, setAnnouncementsList] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<string>("")

  useEffect(() => {
    async function init() {
      try {
        const [mRes, aRes, annRes, cRes, eRes] = await Promise.all([
          fetch('/api/members').then(r => r.json()),
          fetch('/api/activities').then(r => r.json()),
          fetch('/api/announcements').then(r => r.json()),
          fetch('/api/contributions').then(r => r.json()),
          fetch('/api/expenses').then(r => r.json()),
        ])
        const membersData = mRes.members || []
        const activitiesData = aRes.activities || []

        // Normalize incoming activity dates to preserve calendar day (no TZ shift)
        const normalizedActivities = (activitiesData || []).map((a: any) => {
          if (!a?.date) return { ...a, date: null }
          const d = new Date(a.date)
          const safeDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
          return { ...a, date: safeDate }
        })

        setMembers(membersData)
        setActivities(normalizedActivities)
        setAnnouncementsList(annRes.announcements || [])

        // Compute net balance: sum of contributions (actualTotal) minus sum of expense amounts
        const contribEvents = cRes.events || []
        const totalContrib = contribEvents.reduce((s: number, ev: any) => s + (Number(ev.actualTotal) || 0), 0)
        const expenses = eRes.expenses || []
        const totalExpenses = expenses.reduce((s: number, ex: any) => s + (Number(ex.amount) || 0), 0)
        setNetBalance(totalContrib - totalExpenses)

        // Fetch attendance for activities so we can mark ones with saved attendance
        // as "recent" even if their date is today or later. This lets completed
        // activities move to Recent once all members have been marked.
        const actsWithAttendance = await Promise.all(normalizedActivities.map(async (act: any) => {
          try {
            const res = await fetch(`/api/activities/${act.id}/attendance`)
            const json = await res.json()
            const attendance = json.attendance || []
            const present = attendance.filter((r: any) => String(r.status).toLowerCase().startsWith('p')).length
            const excused = attendance.filter((r: any) => String(r.status).toLowerCase().startsWith('e')).length
            act.attendedNbr = present
            act.excusedNbr = excused
            act.missedNbr = Math.max(0, membersData.length - present - excused)
            act.attendanceSaved = attendance.length > 0
          } catch (e) {
            act.attendedNbr = act.attendedNbr || 0
            act.missedNbr = Math.max(0, membersData.length - (act.attendedNbr || 0))
            act.attendanceSaved = !!act.attendanceSaved
          }
          return act
        }))
        setActivities(actsWithAttendance)
        // compute average attendance across activities (skip if members missing)
        try {
          if (membersData.length > 0 && normalizedActivities.length > 0) {
            const percentList = normalizedActivities.map((a: any) => {
              const attended = Number(a.attendedNbr || 0)
              return membersData.length > 0 ? (attended / membersData.length) : 0
            })
            const avg = Math.round((percentList.reduce((s: number, p: number) => s + p, 0) / Math.max(1, percentList.length)) * 100)
            setAvgAttendance(`${avg}%`)
          }
        } catch (e) { /* ignore */ }
      } catch (e) { console.error(e) } 
      finally { setIsLoading(false) }
    }
    init()
  }, [])

  const timeAgo = (iso?: string) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      const diff = Date.now() - d.getTime()
      const sec = Math.floor(diff / 1000)
      if (sec < 60) return `${sec}s ago`
      const min = Math.floor(sec / 60)
      if (min < 60) return `${min}m ago`
      const hr = Math.floor(min / 60)
      if (hr < 24) return `${hr}h ago`
      const days = Math.floor(hr / 24)
      return `${days}d ago`
    } catch (e) { return '' }
  }

  // Activity logic
  // Activity logic — compare by date-only (start of day) so events scheduled for today count as upcoming
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0,0,0,0)
  const startOfTomorrow = new Date(startOfToday)
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

  const upcoming = activities
    .filter(a => {
      const d = a?.date ? (a.date as Date) : null
      if (!d) return false
      // upcoming if event date is today or later
      return d.getTime() >= startOfToday.getTime()
    })
    .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))

  const recent = activities
    .filter(a => {
      const d = a?.date ? (a.date as Date) : null
      if (!d) return false
      // recent (completed): any event date strictly before today
      return d.getTime() < startOfToday.getTime()
    })
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
    .slice(0, 3)

  const handleBroadcastMessage = async () => {
    if (!announcement.trim()) return
    try {
      const payload = { 
        author: user?.fullName || 'Leader', 
        content: announcement,
        createdAt: new Date().toISOString()
      }
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const j = await res.json()
      if (j.announcement) {
        setAnnouncementsList(prev => [j.announcement, ...prev])
        setAnnouncement('')
      }
    } catch (e) { console.error(e) }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this broadcast?")) return
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
      const j = await res.json()
      if (!res.ok) return alert(j.error || 'Failed to delete')
      setAnnouncementsList(prev => prev.filter(a => String(a.id) !== String(id)))
    } catch (e) { console.error(e) }
  }

  const startEdit = (ann: any) => {
    setEditingId(String(ann.id))
    setEditingContent(ann.content || '')
  }

  const cancelEdit = () => { setEditingId(null); setEditingContent('') }

  const saveEdit = async (id: string) => {
    if (!editingContent.trim()) return alert('Content required')
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent })
      })
      const j = await res.json()
      if (!res.ok) return alert(j.error || 'Failed to update')
      setAnnouncementsList(prev => prev.map(a => String(a.id) === String(id) ? j.announcement : a))
      setEditingId(null)
      setEditingContent('')
    } catch (e) { console.error(e) }
  }

  const rwf = (n: number) => new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(n)

  if (isLoading) return <div className="h-96 w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 pb-20 px-2 sm:px-4 pt-4 sm:pt-8 text-foreground bg-background">
      
      {/* RESTORED SUMMARY STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 py-4 sm:py-6 border-b border-border/50">
        {[
          { label: "Active Members", val: members.length, icon: Users, href: "/dashboard/members" },
          { label: "Treasury", val: netBalance === null ? '—' : rwf(netBalance), icon: HandCoins, href: "/dashboard/contributions" },
          { label: "Total Events", val: activities.length, icon: Calendar, href: "/dashboard/activities" },
          { label: "Avg Attendance", val: avgAttendance, icon: Mic2, href: "/dashboard/activities" },
        ].map((item, i) => (
          <Link key={i} href={item.href} className="group">
            <div className="space-y-1 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1 sm:gap-2">
                <item.icon size={12} className="text-primary flex-shrink-0" /> {item.label}
              </p>
              <h2 className="text-lg sm:text-2xl font-black tracking-tighter group-hover:text-primary transition-colors">{item.val}</h2>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16">
        
        {/* LEFT: BROADCAST FEED */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-10">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
              <Megaphone size={12} className="sm:w-4 sm:h-4" /> New Broadcast
            </h3>
            {roleName === 'Leader' || roleName === 'Admin' ? (
              <>
                <Textarea 
                  placeholder="Post a team update..."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="bg-muted/40 border-none rounded-xl sm:rounded-2xl p-2 sm:p-3 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-primary/20 min-h-[60px] sm:min-h-[80px] resize-none w-full"
                />
                <div className="flex justify-end">
                  <Button onClick={handleBroadcastMessage} size="sm" className="rounded-full px-4 sm:px-6 font-black uppercase text-[9px] sm:text-[10px] tracking-widest text-xs sm:text-sm">Post</Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Announcements are posted by Leaders or Admins. You can view them below.</p>
            )}
          </div>

          <div className="space-y-6 sm:space-y-8">
            {announcementsList.map((ann) => (
              <div key={ann.id} className="group border-l-2 border-primary/20 pl-3 sm:pl-4 py-2 sm:py-3 relative bg-card rounded-md">
                <div className="flex justify-between items-start gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-primary">{ann.author || 'System'}</span>
                          <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                            {timeAgo(ann.time || ann.createdAt)} • {(ann.time || ann.createdAt) ? new Date(ann.time || ann.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        {editingId === String(ann.id) ? (
                          <div className="space-y-2">
                            <Textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm" />
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={cancelEdit} className="text-xs sm:text-sm">Cancel</Button>
                              <Button size="sm" onClick={() => saveEdit(String(ann.id))} className="text-xs sm:text-sm">Save</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">{ann.content}</p>
                        )}
                      </div>
                      {(roleName === 'Leader' || roleName === 'Admin') && (
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <button onClick={() => startEdit(ann)} className="p-1 text-muted-foreground hover:text-primary" aria-label="Edit announcement"><Edit3 size={12} className="sm:w-4 sm:h-4" /></button>
                          <button 
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                            aria-label="Delete announcement"
                          >
                            <Trash2 size={12} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      )}
                    </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: SCHEDULE (Upcoming & Recent) */}
        <div className="lg:col-span-5 space-y-8 sm:space-y-12">
          
          {/* UPCOMING */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <AlertCircle size={12} className="sm:w-4 sm:h-4 flex-shrink-0" /> Upcoming Events
              </h3>
              <Link href="/dashboard/activities" className="text-[8px] sm:text-[9px] font-black text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight size={10} />
              </Link>
            </div>
            <div className="flex flex-col sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible flex-nowrap sm:flex-wrap pb-2 sm:pb-0 -mx-2 sm:mx-0 px-2 sm:px-0">
              {upcoming.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No events scheduled.</p>
              ) : (
                upcoming.slice(0, 3).map((act) => (
                  <div key={act.id} className="min-w-[260px] sm:min-w-0 sm:w-full flex items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-none sm:rounded-lg bg-transparent sm:bg-muted/20 border-b sm:border border-muted/30 sm:border-transparent hover:bg-muted/30 transition-colors">
                    <div className="w-0.5 sm:w-1 bg-primary rounded-full flex-shrink-0 h-4" />
                    <span className="text-[6px] sm:text-xs font-black uppercase truncate flex-1 whitespace-nowrap">{act.name}</span>
                    <span className="text-[5px] sm:text-[7px] font-bold text-muted-foreground whitespace-nowrap">{act.date ? (act.date as Date).toLocaleDateString() : ''}</span>
                    <span className="text-[5px] sm:text-[7px] font-bold text-muted-foreground whitespace-nowrap">{act.time || "TBA"}</span>
                    <span className="text-[5px] sm:text-[7px] font-black px-0.5 sm:px-1 py-0.5 bg-primary text-primary-foreground rounded uppercase flex-shrink-0">Soon</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RECENT */}
          <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-border/30">
            <button 
              onClick={() => setShowRecentActivities(!showRecentActivities)}
              className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-emerald-600/15 to-emerald-600/10 border border-emerald-600/40 hover:border-emerald-600/70 hover:from-emerald-600/25 hover:to-emerald-600/15 transition-all duration-200 group shadow-sm hover:shadow-md active:scale-95"
            >
              <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={12} className="sm:w-4 sm:h-4 flex-shrink-0" /> Recently Completed
              </h3>
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/dashboard/activities?view=history" onClick={(e) => e.stopPropagation()} className="text-[8px] sm:text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 transition-colors">
                  History <ArrowRight size={10} />
                </Link>
                <ChevronDown 
                  size={14} 
                  className={`sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ${showRecentActivities ? 'rotate-0' : 'rotate-180'}`}
                />
              </div>
            </button>
            {showRecentActivities && (
              <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-300">
                {recent.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic opacity-60">No completed events yet.</p>
                ) : (
                  recent.map((act) => (
                    <div key={act.id} className="group block">
                      <div className="flex gap-2 sm:gap-4 items-center justify-between flex-wrap text-xs sm:text-sm p-3 rounded-lg bg-muted/10 border border-transparent opacity-75 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                          <div className="w-1 bg-muted rounded-full flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold uppercase tracking-tighter text-muted-foreground truncate">{act.name}</p>
                            <p className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase">{act.date ? (act.date as Date).toLocaleDateString() : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[12px] flex-shrink-0">
                          <div className="text-emerald-600 font-bold whitespace-nowrap">P: {act.attendedNbr ?? 0}</div>
                          <div className="text-destructive font-bold whitespace-nowrap">M: {act.missedNbr ?? Math.max(0, members.length - (act.attendedNbr || 0))}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
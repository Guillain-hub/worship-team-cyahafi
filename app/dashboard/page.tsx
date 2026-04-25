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

  const attendancePercent = Number(avgAttendance.replace('%', '')) || 0

  return (
    <div className="max-w-7xl mx-auto pb-24 px-3 sm:px-4 pt-4 sm:pt-8 text-foreground">
      <div className="space-y-8">

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl shadow-black/40 p-6 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Command Center</p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">Welcome back, {user?.fullName || 'Team Leader'}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Your worship team, finances, and event pulse all in one secure dashboard. Stay on top of member engagement, contributions, and activity momentum.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-3">
              {[
                { label: 'Members', value: members.length, icon: Users },
                { label: 'Events', value: activities.length, icon: Calendar },
                { label: 'Active Today', value: upcoming.length, icon: Bell },
              ].map((item, idx) => (
                <div key={idx} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-xl shadow-black/10 backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.35em] text-slate-400">{item.label}</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Treasury Health</p>
              <p className="mt-4 text-xl font-semibold text-white">{netBalance === null ? 'Loading…' : rwf(netBalance)}</p>
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Balance status</div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400" style={{ width: `${Math.min(100, Math.max(20, attendancePercent))}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-400">{attendancePercent}% availability and budget coverage.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Team Engagement</p>
              <p className="mt-4 text-xl font-semibold text-white">{avgAttendance}</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-slate-500">
                  <span>Attendance</span>
                  <span>{attendancePercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500" style={{ width: `${attendancePercent}%` }} />
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Active members</p>
              <p className="mt-4 text-xl font-semibold text-white">{members.length}</p>
              <p className="mt-4 text-xs text-slate-400">{members.length === 0 ? 'No members yet' : `${members.length} active participants in worship ministry`}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1.1fr] gap-8">
          <div className="space-y-6">

            <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Broadcast feed</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Team announcements</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <Textarea
                    value={announcement}
                    onChange={(event) => setAnnouncement(event.target.value)}
                    placeholder="Share an update with your worship team..."
                    className="min-h-[8rem] resize-none bg-slate-950/80 text-white border border-white/10 focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
                  />
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-400">Broadcast updates instantly to your team.</p>
                    <Button size="sm" onClick={handleBroadcastMessage} className="rounded-full px-4 font-black uppercase tracking-[0.2em] text-[10px]">
                      Broadcast
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {announcementsList.length === 0 ? (
                    <p className="text-sm text-slate-400">No announcements yet. Use the panel to broadcast an update.</p>
                  ) : (
                    announcementsList.slice(0, 4).map((ann) => (
                      <div key={ann.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-primary/40 hover:bg-slate-900/80">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{ann.author || 'System'}</p>
                            <p className="mt-2 text-sm text-white font-semibold">{ann.content}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500">{timeAgo(ann.time || ann.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Activity pulse</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Upcoming lineup</h2>
                </div>
                <Link href="/dashboard/activities" className="text-xs font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors">View schedule</Link>
              </div>

              <div className="mt-6 space-y-3">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-slate-400">No scheduled events right now. Create your next worship service or rehearsal.</p>
                ) : (
                  upcoming.slice(0, 5).map((act) => (
                    <div key={act.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{act.name}</p>
                        <p className="mt-1 text-[11px] text-slate-400 uppercase tracking-[0.2em]">{act.date ? (act.date as Date).toLocaleDateString() : 'TBA'}</p>
                      </div>
                      <div className="text-right text-sm text-slate-200">{act.time || 'TBA'}</div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Finance overview</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Budget snapshot</h2>
                </div>
                <span className="text-xs uppercase tracking-[0.25em] text-slate-500">Updated now</span>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Net balance</span>
                    <span className="text-white font-semibold">{netBalance === null ? '—' : rwf(netBalance)}</span>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-amber-400" style={{ width: `${Math.min(100, Math.max(0, attendancePercent))}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Attendance average</span>
                    <span className="text-white font-semibold">{avgAttendance}</span>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500" style={{ width: `${attendancePercent}%` }} />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Insight</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Team momentum</h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Members engaged this week</span>
                    <span className="text-white font-semibold">{members.length > 0 ? `${Math.min(100, members.length * 2)}%` : '—'}</span>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500" style={{ width: `${members.length > 0 ? Math.min(100, members.length * 2) : 0}%` }} />
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Events on track</span>
                    <span className="text-white font-semibold">{upcoming.length}</span>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400" style={{ width: `${Math.min(100, upcoming.length * 15)}%` }} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
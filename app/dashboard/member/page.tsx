"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CalendarCheck, Wallet, CheckCircle2, AlertCircle, ArrowRight, User, Megaphone, HandCoins } from "lucide-react"

type Activity = {
  id: string
  name: string
  date: string | Date | null
  time?: string | null
  status?: string
}

export default function MemberPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({})
  const [contributions, setContributions] = useState<any[]>([])
  const [upcoming, setUpcoming] = useState<Activity[]>([])
  const [recent, setRecent] = useState<Activity[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [totalContributions, setTotalContributions] = useState(0)
  const [attendancePercentage, setAttendancePercentage] = useState("—")
  const [loading, setLoading] = useState(true)
  const [showContributions, setShowContributions] = useState(false)
  const [showRecentAttendance, setShowRecentAttendance] = useState(false)

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

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    try {
      const [memberRes, annRes] = await Promise.all([
        fetch(`/api/members/${user?.id}`),
        fetch("/api/announcements"),
      ])

      const memberData = await memberRes.json()
      const ann = annRes.ok ? (await annRes.json()).announcements : []

      // Get attendance data for current member
      const attendanceData = memberData.attendance || []
      
      // Normalize dates to preserve calendar day (no TZ shift)
      const normalized = (attendanceData || []).map((a: any) => {
        if (!a?.date) return { ...a, date: null }
        const d = new Date(a.date)
        const safeDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        return { ...a, date: safeDate }
      })

      setActivities(normalized)
      setAnnouncements(ann)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      setUpcoming(normalized.filter((a: Activity) => (a.date as Date) >= today).slice(0, 5))
      setRecent(
        normalized
          .filter((a: Activity) => (a.date as Date) < today)
          .sort((a: Activity, b: Activity) => (b.date as Date).getTime() - (a.date as Date).getTime())
          .slice(0, 5)
      )

      // Build attendance map from member data
      const map: Record<string, string> = {}
      attendanceData.forEach((a: any) => {
        map[a.id] = a.status || "Not recorded"
      })
      setAttendanceMap(map)

      // Calculate attendance percentage
      if (attendanceData.length > 0) {
        const presentCount = attendanceData.filter((a: any) => a.status === 'Present').length
        const percentage = Math.round((presentCount / attendanceData.length) * 100)
        setAttendancePercentage(`${percentage}%`)
      }

      // Get contribution data for current member
      const contribRes = await fetch(`/api/members/${user?.id}/contributions`)
      const contribData = await contribRes.json()
      const contributions = contribData.contributions || []

      // Calculate total contributions and normalize dates
      const total = contributions.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
      setTotalContributions(total)

      const contribRows = contributions.map((c: any) => {
        const evt = c
        if (evt?.date) {
          const dd = new Date(evt.date)
          evt.date = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate())
        }
        return { event: evt, contribution: { id: c.id, amount: c.amount, type: c.type } }
      }).slice(0, 8)

      setContributions(contribRows)
    } finally {
      setLoading(false)
    }
  }

  const rwf = (n: number) => new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(n)

  if (!user) return null
  if (loading) return <div className="h-96 w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>

  return (
    <div className="w-full min-h-screen space-y-6 md:space-y-8 lg:space-y-12 pb-16 md:pb-20 px-3 sm:px-4 md:px-6 pt-3 md:pt-4 lg:pt-8 text-foreground bg-background">
      
      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 py-2 sm:py-3 md:py-4 lg:py-6 border-b border-border/50">
        {[
          { label: "My Name", val: user.fullName, icon: User },
          { label: "Attendance %", val: attendancePercentage, icon: CalendarCheck },
          { label: "Total Contributions", val: rwf(totalContributions), icon: HandCoins },
          { label: "Activities", val: activities.length, icon: AlertCircle },
        ].map((item, i) => (
          <div key={i} className="space-y-0.5 sm:space-y-1 p-1.5 sm:p-2 md:p-3 lg:p-4 rounded-lg hover:bg-muted/30 transition-colors">
            <p className="text-[6px] sm:text-[7px] md:text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-0.5 md:gap-1">
              <item.icon size={10} className="md:w-3 md:h-3 lg:w-4 lg:h-4 text-primary flex-shrink-0" /> {item.label}
            </p>
            <h2 className="text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-black tracking-tighter hover:text-primary transition-colors line-clamp-2">{item.val}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-12">
        
        {/* LEFT: ANNOUNCEMENTS & CONTRIBUTIONS */}
        <div className="lg:col-span-7 space-y-4 md:space-y-6 lg:space-y-8">
          <div className="space-y-2 md:space-y-3">
            <h3 className="text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1">
              <Megaphone size={12} className="text-primary flex-shrink-0" /> Announcements
            </h3>
          </div>

          <div className="space-y-2 sm:space-y-2.5 md:space-y-3 max-h-80 sm:max-h-96 md:max-h-none overflow-y-auto pr-2">
            {announcements.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No announcements yet.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="border-l-2 border-primary/20 pl-1.5 sm:pl-2 md:pl-3 lg:pl-4 py-1.5 sm:py-2 md:py-3 bg-card rounded-md">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 md:gap-2">
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-black uppercase tracking-tight text-primary">{ann.author || 'System'}</span>
                      <span className="text-[6px] sm:text-[7px] md:text-[8px] lg:text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                        {timeAgo(ann.time || ann.createdAt)}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-foreground/90 leading-relaxed break-words line-clamp-2 sm:line-clamp-3 md:line-clamp-none">{ann.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CONTRIBUTIONS */}
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4 pt-2 sm:pt-3 md:pt-4 lg:pt-6 border-t border-border/30">
            <button 
              onClick={() => setShowContributions(!showContributions)}
              className="flex items-center justify-between w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-lg bg-gradient-to-r from-primary/15 to-primary/10 border border-primary/40 hover:border-primary/70 hover:from-primary/25 hover:to-primary/15 transition-all duration-200 group shadow-sm hover:shadow-md active:scale-95"
            >
              <h3 className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 md:gap-2 group-hover:gap-2 md:group-hover:gap-2.5 transition-all">
                <HandCoins size={13} className="md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 flex-shrink-0" /> Contributions
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-sm sm:text-base md:text-lg font-bold text-primary transition-transform duration-300 ${showContributions ? 'rotate-0' : 'rotate-180'}`}>
                  ▼
                </span>
              </div>
            </button>
            {showContributions && (
              <div className="space-y-1.5 sm:space-y-2 md:space-y-3 animate-in fade-in duration-300">
                {contributions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No contributions yet.</p>
                ) : (
                  contributions.map((c) => (
                    <div key={c.contribution.id} className="flex flex-col gap-1.5 p-1.5 sm:p-2 md:p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/40 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs md:text-sm font-bold text-foreground truncate">{c.event.name}</p>
                          <p className="text-[6px] sm:text-[7px] md:text-[9px] lg:text-[10px] font-medium text-muted-foreground">
                            {c.event?.date ? new Date(c.event.date).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <p className="font-black text-primary text-[10px] md:text-xs lg:text-sm whitespace-nowrap flex-shrink-0 bg-primary/10 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-md">
                          {Number(c.contribution.amount || 0).toFixed(0)} RWF
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded bg-primary/15 text-primary whitespace-nowrap">
                          {c.contribution.type || 'General'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: ATTENDANCE */}
        <div className="lg:col-span-5 space-y-4 md:space-y-6 lg:space-y-8">
          
          {/* UPCOMING ATTENDANCE */}
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1 md:gap-1.5 lg:gap-2">
                <AlertCircle size={10} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 flex-shrink-0" /> Upcoming
              </h3>
            </div>
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3 max-h-56 sm:max-h-64 md:max-h-none overflow-y-auto pr-2">
              {upcoming.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No upcoming activities.</p>
              ) : (
                upcoming.slice(0, 3).map((act) => (
                  <div key={act.id} className="block">
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2 p-1.5 sm:p-2 md:p-3 rounded-lg bg-muted/20 border border-transparent hover:border-primary/40 transition-all">
                      <div className="flex gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <div className="w-0.5 sm:w-1 bg-primary rounded-full flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[9px] sm:text-xs md:text-sm font-black uppercase tracking-tighter truncate">{act.name}</p>
                          <p className="text-[6px] sm:text-[7px] md:text-[9px] lg:text-[10px] font-bold text-muted-foreground uppercase truncate">
                            {act.date ? (act.date as Date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : ''} @ {act.time || "TBA"}
                          </p>
                        </div>
                      </div>
                      <div className="text-[5px] sm:text-[6px] md:text-[7px] lg:text-[8px] font-black px-1 sm:px-1.5 md:px-2 py-0.5 bg-primary text-primary-foreground rounded uppercase tracking-tighter whitespace-nowrap flex-shrink-0">Soon</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RECENT ATTENDANCE */}
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4 pt-2 sm:pt-3 md:pt-4 lg:pt-6 border-t border-border/30">
            <button 
              onClick={() => setShowRecentAttendance(!showRecentAttendance)}
              className="flex items-center justify-between w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-lg bg-gradient-to-r from-emerald-600/15 to-emerald-600/10 border border-emerald-600/40 hover:border-emerald-600/70 hover:from-emerald-600/25 hover:to-emerald-600/15 transition-all duration-200 group shadow-sm hover:shadow-md active:scale-95"
            >
              <h3 className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 md:gap-2 group-hover:gap-2 md:group-hover:gap-2.5 transition-all">
                <CheckCircle2 size={13} className="md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 flex-shrink-0" /> Recent
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-sm sm:text-base md:text-lg font-bold text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ${showRecentAttendance ? 'rotate-0' : 'rotate-180'}`}>
                  ▼
                </span>
              </div>
            </button>
            {showRecentAttendance && (
              <div className="space-y-1.5 sm:space-y-2 md:space-y-3 animate-in fade-in duration-300">
                {recent.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic opacity-60">No recent activities.</p>
                ) : (
                  recent.map((act) => (
                    <div key={act.id} className="block">
                      <div className="flex gap-1.5 sm:gap-2 items-center justify-between flex-wrap text-[10px] sm:text-xs md:text-sm p-1.5 sm:p-2 md:p-3 rounded-lg bg-gradient-to-r from-emerald-50/30 to-emerald-100/20 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/30 dark:border-emerald-800/30 hover:border-emerald-400/50 dark:hover:border-emerald-600/50 hover:shadow-md transition-all">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <div className="w-0.5 sm:w-1 bg-emerald-500 rounded-full flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold uppercase tracking-tighter text-foreground truncate text-[9px] sm:text-xs md:text-sm">{act.name}</p>
                            <p className="text-[6px] sm:text-[7px] md:text-[9px] lg:text-[10px] font-medium text-muted-foreground uppercase">{act.date ? (act.date as Date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : ''}</p>
                          </div>
                        </div>
                        <div className={`text-[7px] sm:text-[9px] md:text-xs lg:text-sm font-bold px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap flex-shrink-0 transition-all ${attendanceMap[act.id] === 'Present' ? 'bg-emerald-600 text-white shadow-md' : attendanceMap[act.id] === 'Absent' ? 'bg-rose-500 text-white shadow-md' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'}`}>
                          {attendanceMap[act.id] === 'Present' ? 'Present' : attendanceMap[act.id] === 'Absent' ? 'Absent' : 'Pending'}
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

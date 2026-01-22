"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Save, Pencil, Check, X, Clock } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

// Updated type to include Excused
type AttendanceStatus = "Present" | "Absent" | "Excused"

export default function AttendancePage() {
  const { activityId } = useParams<{ activityId: string }>()
  const { user } = useAuth()

  const [activity, setActivity] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [hasSavedAttendance, setHasSavedAttendance] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attendanceLocked, setAttendanceLocked] = useState(false)
  const [lockMessage, setLockMessage] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'All' | 'Present' | 'Absent' | 'Excused'>('All')
  const [assignedLeaderId, setAssignedLeaderId] = useState<string | null>(null)
  const [accessAllowed, setAccessAllowed] = useState<boolean>(true)

  // 🔹 LOAD DATA (Correctly handling the new Role object from API)
  useEffect(() => {
    if (!activityId) return

    async function load() {
      try {
        const [aRes, mRes, attRes] = await Promise.all([
          fetch(`/api/activities/${activityId}`),
          fetch(`/api/members`),
          fetch(`/api/activities/${activityId}/attendance`),
        ])

        const aJson = await aRes.json()
        const mJson = await mRes.json()
        const attJson = await attRes.json()

        // Normalize activity date to preserve calendar day (no timezone shift)
        if (aJson.activity && aJson.activity.date) {
          const dd = new Date(aJson.activity.date)
          aJson.activity.date = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate())
        }

        setActivity(aJson.activity)
        setMembers(mJson.members || [])

        // Check authorization: only Admin or the assigned leader can take attendance
        const assignedLeader = aJson.activity?.attendanceBy
        const userIsAdmin = user?.role === "Admin"
        const userIsAssignedLeader = user?.fullName === assignedLeader
        const isAuthorized = userIsAdmin || userIsAssignedLeader

        console.log('Attendance authorization check:', {
          assignedLeader,
          currentUser: user?.fullName,
          userIsAdmin,
          userIsAssignedLeader,
          isAuthorized
        })

        setAccessAllowed(isAuthorized)

        const map: Record<string, AttendanceStatus> = {}
        const savedFlag = attJson && typeof attJson.saved === 'boolean' ? attJson.saved : (Array.isArray(attJson.attendance) && attJson.attendance.length > 0)

        if (savedFlag) {
          for (const r of attJson.attendance) {
            const raw = (r.status || '').toLowerCase()
            let normalized: AttendanceStatus = 'Absent'
            if (raw.startsWith('p')) normalized = 'Present'
            else if (raw.startsWith('e')) normalized = 'Excused'
            map[r.memberId] = normalized
          }
          setHasSavedAttendance(true)
          setIsEditing(false)
        } else {
          // Default everyone to Absent for first time
          for (const m of mJson.members || []) {
            map[m.id] = "Absent"
          }
          setHasSavedAttendance(false)
          
          // Only check time locks if user is authorized
          if (isAuthorized) {
            // determine if we should allow taking attendance now
            try {
              const now = new Date()
              let eventDateOnly: Date | null = null
              let eventAt: Date | null = null
              if (aJson.activity) {
                // activity.date was normalized above; treat as Date if present
                eventDateOnly = aJson.activity.date ? (aJson.activity.date instanceof Date ? aJson.activity.date : new Date(aJson.activity.date)) : null
                if (eventDateOnly) {
                  // Set event date to midnight for comparison
                  eventDateOnly.setHours(0, 0, 0, 0)
                  
                  // start-of-next-day lock (attendance locked starting at 00:00 of the day AFTER activity.date)
                  const lockAt = new Date(eventDateOnly)
                  lockAt.setDate(lockAt.getDate() + 1)
                  lockAt.setHours(0, 0, 0, 0)

                  console.log('Attendance lock check:', {
                    now: now.toLocaleString(),
                    eventDate: eventDateOnly.toLocaleDateString(),
                    lockAt: lockAt.toLocaleString(),
                    isLocked: now >= lockAt
                  })

                  // if a time is provided, compute eventAt (specific scheduled time)
                  if (aJson.activity.time) {
                    eventAt = new Date(eventDateOnly)
                    const parts = String(aJson.activity.time).split(':')
                    if (parts.length >= 2) {
                      const hh = Number(parts[0]) || 0
                      const mm = Number(parts[1]) || 0
                      eventAt.setHours(hh, mm, 0, 0)
                    }
                  }

                  // If current time is on/after the lock boundary, disallow (activity date passed)
                  if (now >= lockAt) {
                    setAttendanceLocked(true)
                    setIsEditing(false)
                    setLockMessage(`Activity date has passed - attendance locked`)
                  } else if (eventAt && now < eventAt) {
                    // before scheduled time on the day: locked until event time
                    const timeStr = eventAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    setAttendanceLocked(true)
                    setIsEditing(false)
                    setLockMessage(`Activity locked until ${timeStr}`)
                  } else {
                    // allowed (either we're on the day after event time but before midnight, or no specific time)
                    setAttendanceLocked(false)
                    setIsEditing(true)
                    setLockMessage(null)
                  }
                } else {
                  setAttendanceLocked(false)
                  setIsEditing(true)
                  setLockMessage(null)
                }
              } else {
                setAttendanceLocked(false)
                setIsEditing(true)
                setLockMessage(null)
              }
            } catch (e) {
              console.error('Lock logic error:', e)
              setAttendanceLocked(false)
              setIsEditing(true)
            }
          } else {
            // User not authorized, lock attendance
            setAttendanceLocked(true)
            setIsEditing(false)
          }
        }
        setAttendance(map)
      } catch (e) {
        console.error("Failed to load attendance page", e)
      }
    }
    load()
  }, [activityId, user])

  // 🔹 DEDICATED ACCESS CONTROL EFFECT
  // This runs separately to ensure assignedLeaderId is available before checking access
  useEffect(() => {
    if (!user) {
      setAccessAllowed(false)
      return
    }

    const userRole = typeof user.role === 'object' && user.role ? user.role.name : user.role

    console.log('DEBUG Access Control:', {
      userId: user?.id,
      assignedLeaderId,
      userRole,
      userIdType: typeof user?.id,
      assignedIdType: typeof assignedLeaderId,
      isMatch: String(user?.id) === String(assignedLeaderId)
    })

    if (userRole === 'Admin') {
      setAccessAllowed(true)
      return
    }

    if (userRole === 'Leader') {
      // Only the assigned leader can take attendance
      // Convert both to strings to handle any type mismatches
      const isAssigned = String(user.id) === String(assignedLeaderId)
      setAccessAllowed(isAssigned)
      return
    }

    setAccessAllowed(false)
  }, [user, assignedLeaderId])

  // 🔹 STATUS CHANGE
  const setStatus = (memberId: string, status: AttendanceStatus) => {
    if (!isEditing) return
    setAttendance((prev) => ({ ...prev, [memberId]: status }))
  }

  // 🔹 SAVE OR UPDATE
  const saveAttendance = async () => {
    if (!activityId) return
    
    // Safety check for user role object vs string
    const userRole: any = typeof user?.role === 'object' && user?.role ? user.role.name : user?.role
    if (!user || !["Admin", "Leader"].includes(userRole)) {
      return alert("Not allowed")
    }
    if (!accessAllowed) return alert('You are not allowed to save attendance for this activity')

    const attendees = Object.entries(attendance).map(([memberId, status]) => ({
      memberId,
      status: status,
    }))

    if (attendanceLocked) return alert(lockMessage || 'Attendance is locked until the scheduled time')
    setLoading(true)
    try {
      const res = await fetch(`/api/activities/${activityId}/attendance`, {
        method: hasSavedAttendance ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendees }),
      })

      const json = await res.json()
      if (!res.ok) {
        alert(json.error || "Failed to save attendance")
        return
      }

      setHasSavedAttendance(true)
      setIsEditing(false)
      window.dispatchEvent(new Event("attendance:changed"))
      alert("Attendance saved")
    } catch (e) {
      alert("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="rounded-full h-10 w-10">
          <Link href="/dashboard/activities">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">{activity?.name || "Attendance"}</h2>
          <p className="text-muted-foreground">
            {activity?.date ? new Date(activity.date).toLocaleDateString() : ""} — {hasSavedAttendance ? "Viewing Mode" : "Taking Attendance"}
          </p>
        </div>
      </div>

      {/* Access control message for non-assigned leaders */}
      {!accessAllowed && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200">
          <p className="text-sm font-bold text-rose-600">❌ You are not allowed to take attendance for this activity.</p>
          {activity?.attendanceBy ? (
            <p className="text-xs text-muted-foreground mt-1">
              This activity is assigned to <strong>{activity.attendanceBy}</strong>. Only they or an admin can take attendance.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Only the assigned leader or an admin can take attendance.</p>
          )}
        </div>
      )}

      {/* Attendance locked message */}
      {accessAllowed && attendanceLocked && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200">
          <p className="text-sm font-bold text-amber-700">🔒 Attendance is locked</p>
          <p className="text-xs text-muted-foreground mt-1">{lockMessage || 'Attendance cannot be marked at this time.'}</p>
        </div>
      )}

      {/* ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Filter List:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)} 
              className="border border-input rounded-md p-2 text-sm bg-background"
            >
              <option value="All">All Members</option>
              <option value="Present">Present</option>
              <option value="Excused">Excused</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
          {activity?.attendanceBy && (
            <p className="text-xs text-muted-foreground">
              <strong>Attendance Leader:</strong> {activity.attendanceBy}
            </p>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {accessAllowed && hasSavedAttendance && !isEditing && !attendanceLocked && (
            <Button className="w-full sm:w-auto" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}

          {accessAllowed && isEditing && (
            <Button className="w-full sm:w-auto bg-primary text-primary-foreground" onClick={saveAttendance} disabled={loading}>
              <Save className="mr-2 h-4 w-4" /> {loading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      {/* MEMBER TABLE */}
      <Card className="border shadow-md overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-foreground">Member Info</TableHead>
              <TableHead className="text-foreground">Role</TableHead>
              <TableHead className="text-center text-foreground">Status Selection</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members
              .filter((m) => {
                if (filterStatus === 'All') return true
                return attendance[m.id] === filterStatus
              })
              .map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="font-bold text-foreground">{m.fullName}</div>
                    <div className="text-xs text-muted-foreground">{m.phone || "No phone"}</div>
                  </TableCell>
                  <TableCell>
                    {/* 🔹 FIX: Safely rendering Role string instead of Object */}
                    <Badge variant="outline" className="font-normal">
                      {typeof m.role === 'object' ? m.role?.name : (m.role || 'Member')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        size="sm"
                        disabled={!isEditing}
                        variant={attendance[m.id] === "Present" ? "default" : "outline"}
                        className={attendance[m.id] === "Present" ? "bg-emerald-600 hover:bg-emerald-700" : "text-emerald-600 border-emerald-600/20"}
                        onClick={() => setStatus(m.id, "Present")}
                      >
                        <Check className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Present</span>
                      </Button>

                      <Button
                        size="sm"
                        disabled={!isEditing}
                        variant={attendance[m.id] === "Excused" ? "default" : "outline"}
                        className={attendance[m.id] === "Excused" ? "bg-orange-500 hover:bg-orange-600" : "text-orange-500 border-orange-500/20"}
                        onClick={() => setStatus(m.id, "Excused")}
                      >
                        <Clock className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Excused</span>
                      </Button>

                      <Button
                        size="sm"
                        disabled={!isEditing}
                        variant={attendance[m.id] === "Absent" ? "default" : "outline"}
                        className={attendance[m.id] === "Absent" ? "bg-destructive hover:bg-destructive/90" : "text-destructive border-destructive/20"}
                        onClick={() => setStatus(m.id, "Absent")}
                      >
                        <X className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Absent</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
      
      {!isEditing && hasSavedAttendance && (
        <div className="text-center p-4 border border-dashed rounded-lg bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Attendance is currently in <strong>View Mode</strong>. Click the Edit button above to make changes.
          </p>
        </div>
      )}
    </div>
  )
}
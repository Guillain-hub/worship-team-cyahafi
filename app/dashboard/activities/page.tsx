"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  Loader2,
  Pencil,
  Trash2,
  Plus,
  UserCheck,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"

type Activity = {
  id: string
  name: string
  date: Date
  time?: string
  location?: string
  attendanceBy?: string | null
  attendanceCount?: number
  missedCount?: number
  excusedCount?: number
}

export default function ActivitiesPage() {
  const { user } = useAuth()

  const [activities, setActivities] = useState<Activity[]>([])
  const [members, setMembers] = useState<any[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  /* ============== HELPER FUNCTIONS FOR DATE HANDLING ============== */
  const parseLocalDate = (dateStr: any): Date => {
    if (!dateStr) return new Date()
    const date = new Date(dateStr)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /* Check if activity is locked (cannot mark attendance) */
  const isActivityLocked = (activity: Activity): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activityDate = new Date(activity.date)
    activityDate.setHours(0, 0, 0, 0)

    if (activityDate > today) return true      // Future: cannot mark yet
    if (activityDate < today) return true      // Past: history
    return false                               // Today: mark allowed
  }

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showMembersDialog, setShowMembersDialog] = useState(false)

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [assignedLeader, setAssignedLeader] = useState<string>("")
  const [selectedMembersStatus, setSelectedMembersStatus] = useState<'present' | 'excused' | 'missed' | null>(null)
  const [selectedMembersList, setSelectedMembersList] = useState<string[]>([])

  const [createForm, setCreateForm] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
  })

  const [editForm, setEditForm] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
  })

  /* ---------------- LOAD DATA ---------------- */
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [aRes, mRes] = await Promise.all([
        fetch("/api/activities"),
        fetch("/api/members"),
      ])

      console.log('Activities response:', { status: aRes.status, ok: aRes.ok, statusText: aRes.statusText })
      console.log('Members response:', { status: mRes.status, ok: mRes.ok, statusText: mRes.statusText })

      if (!aRes.ok) {
        let errData: any = {}
        try {
          errData = await aRes.clone().json()
        } catch (e) {
          const text = await aRes.text()
          console.error('Activities API raw response:', text)
          errData = { rawBody: text }
        }
        console.error('Activities API error:', errData)
        throw new Error(`Activities API error: ${aRes.status} ${aRes.statusText}`)
      }

      if (!mRes.ok) {
        let errData: any = {}
        try {
          errData = await mRes.clone().json()
        } catch (e) {
          const text = await mRes.text()
          console.error('Members API raw response:', text)
          errData = { rawBody: text }
        }
        console.error('Members API error:', errData)
        throw new Error(`Members API error: ${mRes.status} ${mRes.statusText}`)
      }

      const aJson = await aRes.json()
      const mJson = await mRes.json()

      console.log('Parsed activities:', aJson)
      console.log('Parsed members:', mJson)

      let parsedActivities = (aJson.activities || []).map((a: any) => ({
        ...a,
        date: parseLocalDate(a.date),
        attendanceCount: 0,
        attendanceBy: a.attendanceBy || null,
        missedCount: 0,
        excusedCount: 0,
      }))

      // Fetch attendance data for each activity
      parsedActivities = await Promise.all(
        parsedActivities.map(async (act: Activity) => {
          try {
            const res = await fetch(`/api/activities/${act.id}/attendance`)
            const data = await res.json()
            const attendance = data.attendance || []

            const present = attendance.filter((r: any) =>
              String(r.status).toLowerCase().startsWith("p")
            ).length
            const excused = attendance.filter((r: any) =>
              String(r.status).toLowerCase().startsWith("e")
            ).length
            const missed = Math.max(0, (mJson.members || []).length - present - excused)

            return {
              ...act,
              attendanceCount: present,
              missedCount: missed,
              excusedCount: excused,
            }
          } catch (e) {
            console.error(`Failed to fetch attendance for activity ${act.id}:`, e)
            return act
          }
        })
      )

      setActivities(parsedActivities)
      setMembers(mJson.members || [])
      console.log('Activities page loaded successfully')
    } catch (e) {
      console.error('Load data error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  /* Auto-refresh at midnight to move activities to history */
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const msUntilMidnight = tomorrow.getTime() - now.getTime()
    
    const timer = setTimeout(() => {
      loadData()
    }, msUntilMidnight)
    
    return () => clearTimeout(timer)
  }, [activities])

  /* ---------------- FILTER ---------------- */
  const displayList = useMemo(() => {
    // Get today's date at midnight in local time (no timezone shifts)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Activities already have dates normalized to local dates, so compare directly
    return showHistory
      ? activities.filter(a => a.date < today)
      : activities.filter(a => a.date >= today)
  }, [activities, showHistory])

  /* ---------------- FILTER LEADERS BY ROLE ---------------- */
  const leaders = useMemo(() => {
    return (members || []).filter((m: any) => {
      // Handle both string role and object role with name property
      const roleValue = typeof m.role === 'object' && m.role?.name 
        ? m.role.name 
        : m.role
      return roleValue === "Leader"
    })
  }, [members])

  /* ---------------- SHOW MEMBERS BY STATUS ---------------- */
  const handleShowMembers = async (
    activity: Activity,
    status: "present" | "excused" | "missed"
  ) => {
    try {
      const res = await fetch(`/api/activities/${activity.id}/attendance`)
      const data = await res.json()
      const attendance = data.attendance || []

      let filteredMembers: string[] = []

      if (status === "present") {
        filteredMembers = attendance
          .filter((r: any) => String(r.status).toLowerCase().startsWith("p"))
          .map((r: any) => {
            const member = members.find((m: any) => m.id === r.memberId)
            return member?.fullName || member?.name || "Unknown"
          })
      } else if (status === "excused") {
        filteredMembers = attendance
          .filter((r: any) => String(r.status).toLowerCase().startsWith("e"))
          .map((r: any) => {
            const member = members.find((m: any) => m.id === r.memberId)
            return member?.fullName || member?.name || "Unknown"
          })
      } else if (status === "missed") {
        const presentIds = attendance
          .filter((r: any) =>
            String(r.status).toLowerCase().startsWith("p") ||
            String(r.status).toLowerCase().startsWith("e")
          )
          .map((r: any) => r.memberId)

        filteredMembers = members
          .filter((m: any) => !presentIds.includes(m.id))
          .map((m: any) => m.fullName || m.name)
      }

      setSelectedMembersStatus(status)
      setSelectedMembersList(filteredMembers)
      setSelectedActivity(activity)
      setShowMembersDialog(true)
    } catch (e) {
      console.error(e)
    }
  }

  /* ---------------- CREATE ---------------- */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    })
    setShowCreateDialog(false)
    setCreateForm({ name: "", date: "", time: "", location: "" })
    loadData()
  }

  /* ---------------- EDIT ACTIVITY ---------------- */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedActivity) return
    
    await fetch(`/api/activities/${selectedActivity.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    setShowEditDialog(false)
    setSelectedActivity(null)
    loadData()
  }

  const openEditDialog = (activity: Activity) => {
    setSelectedActivity(activity)
    setEditForm({
      name: activity.name,
      date: formatDateForInput(activity.date),
      time: activity.time || "",
      location: activity.location || "",
    })
    setShowEditDialog(true)
  }

  /* ---------------- ASSIGN ATTENDANCE LEADER ---------------- */
  const handleAssignLeader = async () => {
    if (!selectedActivity || !assignedLeader) return

    await fetch(`/api/activities/${selectedActivity.id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceBy: assignedLeader }),
    })

    setShowAssignDialog(false)
    setAssignedLeader("")
    setSelectedActivity(null)
    loadData()
  }

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete activity?")) return
    await fetch(`/api/activities/${id}`, { method: "DELETE" })
    loadData()
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-8 space-y-6 md:space-y-8 pb-20 bg-background">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">

        {/* HEADER */}
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
                {showHistory ? "Activity History" : "Service Schedule"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-bold uppercase tracking-widest mt-1">
                {showHistory ? "Completed activities" : "Upcoming activities"}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap w-full sm:w-auto">
              {user?.role === "Admin" && (
                <Button 
                  size="sm" 
                  onClick={() => setShowCreateDialog(true)}
                  className="rounded-full font-black text-xs md:text-sm gap-1 md:gap-2 flex-1 sm:flex-none"
                >
                  <Plus size={14} className="md:w-4 md:h-4" /> 
                  <span className="hidden sm:inline">ADD ACTIVITY</span>
                  <span className="sm:hidden">ADD</span>
                </Button>
              )}
              <Button 
                size="sm" 
                variant={showHistory ? "default" : "outline"}
                onClick={() => setShowHistory(!showHistory)}
                className="rounded-full font-black text-xs md:text-sm flex-1 sm:flex-none"
              >
                {showHistory ? "CURRENT" : "HISTORY"}
              </Button>
            </div>
          </div>
        </div>

        {/* TABLE CONTAINER - Stack on Mobile */}
        <div className="rounded-xl md:rounded-2xl border border-border/50 bg-card shadow-lg overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-muted/40">
                  <TableHead className="font-black uppercase text-xs tracking-wider">Activity</TableHead>
                  <TableHead className="font-black uppercase text-xs tracking-wider">Schedule</TableHead>
                  <TableHead className="font-black uppercase text-xs tracking-wider">Attendance</TableHead>
                  <TableHead className="font-black uppercase text-xs tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <p className="text-muted-foreground text-sm">
                        {showHistory ? "No completed activities yet." : "No upcoming activities."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayList.map((act, idx) => (
                    <TableRow 
                      key={act.id}
                      className="hover:bg-muted/30 transition-colors border-b border-border/30"
                    >
                      {/* ACTIVITY NAME & LOCATION */}
                      <TableCell className="py-4">
                        <div className="space-y-2">
                          <div className="font-bold text-sm md:text-base text-foreground">
                            {act.name}
                          </div>
                          {act.location && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin size={14} className="flex-shrink-0" />
                              {act.location}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* DATE & TIME */}
                      <TableCell className="py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Calendar size={14} className="flex-shrink-0 text-primary" />
                            {act.date.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          {act.time && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Clock size={14} className="flex-shrink-0" />
                              {act.time}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* ATTENDANCE BADGES */}
                      <TableCell className="py-4">
                        <div className="space-y-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleShowMembers(act, "present")}
                              className="inline-block hover:scale-105 transition-transform"
                              title="Click to see names"
                            >
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer">
                                P: {act.attendanceCount ?? 0}
                              </Badge>
                            </button>
                            <button
                              onClick={() => handleShowMembers(act, "excused")}
                              className="inline-block hover:scale-105 transition-transform"
                              title="Click to see names"
                            >
                              <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs cursor-pointer">
                                E: {act.excusedCount ?? 0}
                              </Badge>
                            </button>
                            <button
                              onClick={() => handleShowMembers(act, "missed")}
                              className="inline-block hover:scale-105 transition-transform"
                              title="Click to see names"
                            >
                              <Badge className="bg-destructive hover:bg-destructive/80 text-white font-black text-xs cursor-pointer">
                                M: {act.missedCount ?? 0}
                              </Badge>
                            </button>
                          </div>
                          {act.attendanceBy && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/40 px-2.5 py-1.5 rounded-md w-fit">
                              <UserCheck size={13} className="flex-shrink-0" />
                              <span className="font-medium">{act.attendanceBy}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="py-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <Link href={`/dashboard/activities/${act.id}/attendance`}>
                            <Button 
                              size="sm"
                              variant={showHistory || isActivityLocked(act) ? "outline" : "default"}
                              className="font-black text-xs rounded-full"
                              disabled={isActivityLocked(act) && !showHistory}
                            >
                              {showHistory ? "View Only" : "Mark"}
                            </Button>
                          </Link>

                          {user?.role === "Admin" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                  setSelectedActivity(act)
                                  setAssignedLeader("")
                                  setShowAssignDialog(true)
                                }}
                                title="Assign attendance leader"
                              >
                                <UserCheck size={14} />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => openEditDialog(act)}
                                title="Edit activity"
                              >
                                <Pencil size={14} />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full text-destructive hover:text-destructive"
                                onClick={() => handleDelete(act.id)}
                                title="Delete activity"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-3 sm:p-4">
            {displayList.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                {showHistory ? "No completed activities yet." : "No upcoming activities."}
              </p>
            ) : (
              displayList.map((act) => (
                <div
                  key={act.id}
                  className="p-3 sm:p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3"
                >
                  {/* Name & Location */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm sm:text-base">{act.name}</h3>
                    {act.location && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin size={12} className="flex-shrink-0" />
                        {act.location}
                      </div>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar size={12} className="flex-shrink-0 text-primary" />
                      {act.date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    {act.time && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock size={12} className="flex-shrink-0" />
                        {act.time}
                      </div>
                    )}
                  </div>

                  {/* Attendance Badges */}
                  <div className="space-y-2">
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleShowMembers(act, "present")}
                        className="inline-block hover:scale-105 transition-transform"
                      >
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer">
                          P: {act.attendanceCount ?? 0}
                        </Badge>
                      </button>
                      <button
                        onClick={() => handleShowMembers(act, "excused")}
                        className="inline-block hover:scale-105 transition-transform"
                      >
                        <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer">
                          E: {act.excusedCount ?? 0}
                        </Badge>
                      </button>
                      <button
                        onClick={() => handleShowMembers(act, "missed")}
                        className="inline-block hover:scale-105 transition-transform"
                      >
                        <Badge className="bg-destructive hover:bg-destructive/80 text-white font-bold text-xs cursor-pointer">
                          M: {act.missedCount ?? 0}
                        </Badge>
                      </button>
                    </div>
                    {act.attendanceBy && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/40 px-2 py-1 rounded w-fit">
                        <UserCheck size={11} className="flex-shrink-0" />
                        <span className="font-medium">{act.attendanceBy}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link href={`/dashboard/activities/${act.id}/attendance`}>
                      <Button
                        size="sm"
                        variant={showHistory || isActivityLocked(act) ? "outline" : "default"}
                        className="font-bold text-xs rounded-lg w-full"
                        disabled={isActivityLocked(act) && !showHistory}
                      >
                        {showHistory ? "View" : "Mark"}
                      </Button>
                    </Link>

                    {user?.role === "Admin" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => {
                            setSelectedActivity(act)
                            setAssignedLeader("")
                            setShowAssignDialog(true)
                          }}
                          title="Assign"
                        >
                          <UserCheck size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => openEditDialog(act)}
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-destructive hover:text-destructive"
                          onClick={() => handleDelete(act.id)}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>      </div>

      {/* CREATE DIALOG */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-full sm:max-w-md mx-2">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add New Activity</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name" className="text-sm">Activity Name</Label>
              <Input
                id="create-name"
                placeholder="e.g., Sunday Service"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-date" className="text-sm">Date</Label>
              <Input
                id="create-date"
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-time" className="text-sm">Time</Label>
              <Input
                id="create-time"
                type="time"
                value={createForm.time}
                onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-location" className="text-sm">Location</Label>
              <Input
                id="create-location"
                placeholder="e.g., Church Hall"
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                className="text-sm"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 flex-col-reverse sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">Create Activity</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-full sm:max-w-md mx-2">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Activity</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm">Activity Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Sunday Service"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date" className="text-sm">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-time" className="text-sm">Time</Label>
              <Input
                id="edit-time"
                type="time"
                value={editForm.time}
                onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location" className="text-sm">Location</Label>
              <Input
                id="edit-location"
                placeholder="e.g., Church Hall"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="text-sm"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 flex-col-reverse sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ASSIGN LEADER DIALOG */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-full sm:max-w-md mx-2">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Assign Attendance Leader</DialogTitle>
            {selectedActivity && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{selectedActivity.name}</p>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leader-select" className="text-sm">Select Leader</Label>
              <Select value={assignedLeader} onValueChange={setAssignedLeader}>
                <SelectTrigger id="leader-select" className="text-sm">
                  <SelectValue placeholder="Choose a leader..." />
                </SelectTrigger>
                <SelectContent className="max-w-xs">
                  {leaders.length === 0 ? (
                    <div className="p-3 text-xs sm:text-sm space-y-2">
                      <p className="text-muted-foreground font-medium">No leaders available</p>
                      <p className="text-xs text-muted-foreground">Please create members with Leader role first.</p>
                    </div>
                  ) : (
                    leaders.map((leader) => (
                      <SelectItem key={leader.id} value={leader.fullName || leader.name}>
                        <span className="font-medium text-sm">{leader.fullName || leader.name}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 flex-col-reverse sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setShowAssignDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={handleAssignLeader}
                disabled={!assignedLeader}
                className="w-full sm:w-auto"
              >
                Assign Leader
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* MEMBERS LIST DIALOG */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-full sm:max-w-md mx-2">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedMembersStatus === "present"
                ? "Members Present"
                : selectedMembersStatus === "excused"
                  ? "Members Excused"
                  : "Members Absent"}
            </DialogTitle>
            {selectedActivity && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{selectedActivity.name}</p>
            )}
          </DialogHeader>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedMembersList.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-6">No members in this category</p>
            ) : (
              <ul className="space-y-2">
                {selectedMembersList.map((name, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-center gap-3 p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                  >
                    <div 
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        selectedMembersStatus === "present"
                          ? "bg-emerald-600"
                          : selectedMembersStatus === "excused"
                            ? "bg-amber-600"
                            : "bg-destructive"
                      }`}
                    />
                    <span className="font-medium">{name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMembersDialog(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

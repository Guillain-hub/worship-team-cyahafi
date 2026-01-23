"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2, Loader2, Phone, Fingerprint, ShieldCheck, Cake, UserPlus, UserMinus } from "lucide-react"
import { useAuth } from '@/components/auth-provider'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const localDateString = (d?: any) => {
  if (!d) return ''
  const dt = new Date(d)
  return [dt.getFullYear(), String(dt.getMonth() + 1).padStart(2, '0'), String(dt.getDate()).padStart(2, '0')].join('-')
}

export default function MembersPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [memberDetails, setMemberDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Per-member processing flags and dialog save state
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    idNumber: '',
    birthDate: '',
    memberType: 'STUDENT',
    roleName: 'Member' 
  })

  useEffect(() => { loadMembers() }, [])

  async function loadMembers() {
    setLoading(true)
    try {
      const res = await fetch('/api/members')
      const json = await res.json()
      setMembers(json.members || [])
    } catch (e) { 
      console.error("Failed to load members:", e) 
    } finally { 
      setLoading(false) 
    }
  }

  async function loadMemberDetails(memberId: string) {
    setLoadingDetails(true)
    try {
      // Fetch attendance records directly for this member
      const attendanceRes = await fetch(`/api/members/${memberId}`)
      const attendanceData = await attendanceRes.json()
      
      // Fetch contribution records directly for this member
      const contributionRes = await fetch(`/api/members/${memberId}/contributions`)
      const contributionData = await contributionRes.json()
      
      setMemberDetails({
        attendances: attendanceData.attendance || [],
        contributions: contributionData.contributions || []
      })
    } catch (e) {
      console.error("Failed to load member details:", e)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleMemberClick = (member: any) => {
    setSelectedMember(member)
    loadMemberDetails(member.id)
  }

  const openEditDialog = (member: any) => {
    setEditingMember(member)
    setFormData({
      fullName: member.fullName || '',
      email: member.email || '',
      phone: member.phone || '',
      idNumber: member.idNumber || '',
      birthDate: member.birthDate ? localDateString(member.birthDate) : '',
      memberType: member.memberType || 'STUDENT',
      roleName: typeof member.role === 'object' ? member.role?.name : (member.role || 'Member')
    })
    setIsDialogOpen(true)
  }

  // 🔹 QUICK PROMOTE/DEMOTE LOGIC
  async function toggleRole(member: any) {
    const currentRoleName = typeof member.role === 'object' ? member.role?.name : member.role
    const newRole = currentRoleName === "Leader" ? "Member" : "Leader"

    setProcessing(prev => ({ ...prev, [member.id]: true }))
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roleName: newRole }),
      })
      if (res.ok) {
        loadMembers()
      } else {
        const err = await res.json().catch(() => null)
        alert(err?.error || "Failed to update role")
      }
    } catch (e) {
      alert("Network error updating role")
    } finally {
      setProcessing(prev => ({ ...prev, [member.id]: false }))
    }
  }

  // 🔹 UPDATED DELETE: Now performs Soft Delete (Deactivation)
  async function handleDelete(id: string) {
    if (!confirm("Deactivate this member? Their history will be saved but they will be removed from the active list.")) return
    setProcessing(prev => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        loadMembers()
      } else {
        const err = await res.json().catch(() => null)
        alert(err?.error || "Could not deactivate member")
      }
    } catch (e) { 
      alert("Error deleting member") 
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }))
    }
  }

  async function handleSubmit() {
    const method = editingMember ? 'PUT' : 'POST'
    const url = editingMember ? `/api/members/${editingMember.id}` : '/api/members'
    setIsSaving(true)
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })
      if (res.ok) { 
        loadMembers()
        setIsDialogOpen(false)
      } else {
        const err = await res.json().catch(() => null)
        alert(err?.error || "Failed to save")
      }
    } catch (e) { alert('Network error') } finally { setIsSaving(false) }
  }

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Choir Members</h2>
            <Badge className="text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full border-none bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">{members.length} active</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Manage roles, payment categories, and personal info.</p>
        </div>
        {user?.role === 'Admin' && (
          <Button onClick={() => { setEditingMember(null); setFormData({fullName: '', email: '', phone: '', idNumber: '', birthDate: '', memberType: 'STUDENT', roleName: 'Member'}); setIsDialogOpen(true); }} className="bg-primary w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Member
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name..." 
          className="pl-10 text-sm" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs w-8 sm:w-10">#</TableHead>
                <TableHead className="text-xs">Member Info</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Identity</TableHead>
                <TableHead className="text-xs text-center">Status & Role</TableHead>
                <TableHead className="text-right text-xs px-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary"/></TableCell></TableRow>
              ) : filteredMembers.map((m, index) => {
                const roleName = typeof m.role === 'object' ? m.role?.name : (m.role || "Member");
                return (
                  <TableRow key={m.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => handleMemberClick(m)}>
                    <TableCell className="text-xs sm:text-sm font-mono text-muted-foreground text-center py-2 sm:py-4">{index + 1}</TableCell>
                    <TableCell className="py-2 sm:py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs sm:text-sm truncate max-w-[90px] sm:max-w-[120px]">{m.fullName}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-2 w-2 flex-shrink-0" /> <span className="truncate">{m.phone || "---"}</span>
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] flex items-center gap-1"><Fingerprint className="h-2 w-2 flex-shrink-0"/> {m.idNumber || "No ID"}</span>
                        <span className="text-[10px] flex items-center gap-1"><Cake className="h-2 w-2 flex-shrink-0"/> {m.birthDate ? new Date(m.birthDate).toLocaleDateString() : "---"}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-2 sm:py-4">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant="outline" className={`text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 ${roleName === 'Leader' ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-primary/40 text-primary'}`}>
                          <ShieldCheck className="h-2 w-2 mr-0.5 flex-shrink-0" /> 
                          <span className="truncate">{roleName}</span>
                        </Badge>
                        <Badge className={`text-[8px] sm:text-[9px] border-none px-1.5 sm:px-2 py-0.5 ${
                          m.memberType === 'STUDENT' ? 'bg-blue-500/10 text-blue-600' : 
                          m.memberType === 'EMPLOYED' ? 'bg-purple-500/10 text-purple-600' : 'bg-orange-500/10 text-orange-600'
                        }`}>
                          {m.memberType}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="text-right py-2 sm:py-4 px-1">
                      <div className="flex justify-end gap-0.5 sm:gap-1">
                        {/* QUICK ROLE TOGGLE - Only visible to Admins */}
                        {user?.role === 'Admin' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-7 w-7 sm:h-8 sm:w-8 ${roleName === 'Leader' ? 'text-orange-500' : 'text-emerald-500'}`} 
                            onClick={(e) => { e.stopPropagation(); toggleRole(m) }}
                            title={roleName === 'Leader' ? "Demote to Member" : "Promote to Leader"}
                            disabled={!!processing[m.id] || roleName === 'Admin'}
                          >
                            {processing[m.id] ? <Loader2 className="animate-spin h-3 w-3 sm:h-4 sm:w-4" /> : (roleName === 'Leader' ? <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" /> : <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />)}
                          </Button>
                        )}

                        {user?.role === 'Admin' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" onClick={(e) => { e.stopPropagation(); openEditDialog(m) }} disabled={roleName === 'Admin'}>
                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        )}
                        {user?.role === 'Admin' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }} disabled={!!processing[m.id] || roleName === 'Admin'}>
                            {processing[m.id] ? <Loader2 className="animate-spin h-3 w-3 sm:h-4 sm:w-4" /> : <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[450px] w-[95vw] max-h-[90vh] rounded-xl overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base sm:text-lg">{editingMember ? 'Edit Profile' : 'Add New Member'}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-2 text-xs sm:text-sm">
            <div className="space-y-1"><Label className="text-xs sm:text-sm">Full Name</Label><Input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="text-xs sm:text-sm" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">System Role</Label>
                <Select value={formData.roleName} onValueChange={(v) => setFormData({...formData, roleName: v})}>
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {user?.role === 'Admin' ? <SelectItem value="Admin">Admin</SelectItem> : null}
                    <SelectItem value="Leader">Leader</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Category (Employment)</Label>
                <Select value={formData.memberType} onValueChange={(v) => setFormData({...formData, memberType: v})}>
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="EMPLOYED">Employed</SelectItem>
                    <SelectItem value="SELF_EMPLOYED">Self-Employed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-1"><Label className="text-xs sm:text-sm">ID Number</Label><Input value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} className="text-xs sm:text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs sm:text-sm">Birth Date</Label><Input type="date" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} className="text-xs sm:text-sm" /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs sm:text-sm">Phone Number</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="text-xs sm:text-sm" /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit} className="w-full h-10" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save Member Record'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Detail Modal */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedMember.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">Attendance & Contribution History</p>
              </DialogHeader>

              {loadingDetails ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : memberDetails ? (
                <div className="space-y-6">
                  {/* Member Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phone</p>
                      <p className="text-sm font-medium">{selectedMember.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ID Number</p>
                      <p className="text-sm font-medium">{selectedMember.idNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Member Type</p>
                      <Badge variant="outline" className="text-xs">{selectedMember.type || 'N/A'}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Role</p>
                      <Badge variant={selectedMember.role?.name === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">{selectedMember.role?.name || 'Member'}</Badge>
                    </div>
                  </div>

                  {/* Recent Attendance Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span>📅</span> Recent Attendance
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {memberDetails.attendances.length > 0 ? (
                        memberDetails.attendances.map((att: any) => (
                          <div key={att.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-md">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{att.name}</p>
                              <p className="text-xs text-muted-foreground">{new Date(att.date).toLocaleDateString()}</p>
                            </div>
                            <p className={`text-sm font-medium ${att.status === 'Present' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {att.status === 'Present' ? 'Present' : 'Missed'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No attendance records</p>
                      )}
                    </div>
                  </div>

                  {/* Contributions Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span>💰</span> Contributions
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {memberDetails.contributions.length > 0 ? (
                        memberDetails.contributions.map((cont: any) => (
                          <div key={cont.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-md">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{cont.name} <span className="text-xs text-muted-foreground ml-1">({cont.type})</span></p>
                              <p className="text-xs text-muted-foreground">{new Date(cont.date).toLocaleDateString()}</p>
                            </div>
                            <Badge variant={cont.amount > 0 ? 'default' : 'secondary'} className="text-xs">
                              {cont.amount > 0 ? `${cont.amount.toFixed(0)} RWF` : 'Not Contributed'}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No contribution records</p>
                      )}
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-primary/5 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Attendance %</p>
                      <p className="text-3xl font-black text-primary">{memberDetails.attendances.length > 0 ? Math.round((memberDetails.attendances.filter((a: any) => a.status === 'Present').length / memberDetails.attendances.length) * 100) : 0}%</p>
                    </div>
                    <div className="p-4 bg-emerald-500/5 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Contributions</p>
                      <p className="text-3xl font-black text-emerald-600">{memberDetails.contributions.reduce((sum: number, c: any) => sum + (c.amount || 0), 0).toFixed(0)} RWF</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
              )}

              <DialogFooter>
                <Button onClick={() => setSelectedMember(null)} variant="outline" className="w-full">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
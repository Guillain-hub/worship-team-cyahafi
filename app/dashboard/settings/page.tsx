"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { SettingsIcon, Save, RotateCcw } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  // Only profile editing is needed on this page.
  const { user, refresh } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '', idNumber: '', birthDate: '' })
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setProfile({ 
        fullName: user.fullName || '', 
        email: user.email || '', 
        phone: user.phone || '', 
        idNumber: (user as any).idNumber || '',
        birthDate: (user as any).birthDate ? String((user as any).birthDate).slice(0,10) : ''
      })
    }
  }, [user])

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">My Profile</h2>
          <p className="text-muted-foreground text-sm">Update your personal information.</p>
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium">Saved ID:</span> {(user as any)?.idNumber || '—'}
            <span className="mx-3">•</span>
            <span className="font-medium">Birthday:</span> {((user as any)?.birthDate ? String((user as any).birthDate).slice(0,10) : '—')}
          </div>
        </div>
      </div>

      <Card className="border-none shadow-md bg-white dark:bg-slate-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-primary" />
            Profile
          </CardTitle>
          <CardDescription className="text-xs">Edit your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input value={profile.idNumber} onChange={(e) => setProfile({ ...profile, idNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Birthday</Label>
              <Input type="date" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} />
            </div>
          </div>

          {/* Password change */}
          <div className="pt-2 border-t">
            <h4 className="text-sm font-bold">Change password</h4>
            <p className="text-xs text-muted-foreground">Leave blank to keep your current password.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <Input placeholder="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <Input placeholder="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Input placeholder="Confirm new" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => { if (user) setProfile({ fullName: user.fullName || '', email: user.email || '', phone: user.phone || '', idNumber: (user as any).idNumber || '', birthDate: (user as any).birthDate ? String((user as any).birthDate).slice(0,10) : '' }) }}>Discard</Button>
            <Button onClick={async () => {
              setSaving(true)
              try {
                // Validate password fields if present
                if (newPassword) {
                  if (newPassword !== confirmPassword) throw new Error('New password and confirmation do not match')
                  if (!currentPassword) throw new Error('Current password is required to change password')
                }

                const payloadToSend: any = { ...profile }
                if (newPassword) payloadToSend.currentPassword = currentPassword
                if (newPassword) payloadToSend.newPassword = newPassword

                const res = await fetch('/api/members/me', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadToSend) })
                const json = await res.json()
                if (!res.ok) throw new Error(json.error || 'Failed to save')
                toast({ title: 'Saved', description: 'Profile updated' })
                await refresh()
                // clear password fields after success
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
              } catch (err: any) {
                toast({ title: 'Error', description: err?.message || 'Update failed' })
              } finally {
                setSaving(false)
              }
            }} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
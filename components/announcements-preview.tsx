type Announcement = {
  id: string
  title?: string
  content?: string
  date?: Date | string
  time?: string
  createdAt?: string
}

export function AnnouncementsPreview({ announcements }: { announcements: Announcement[] }) {
  if (!announcements || announcements.length === 0) return null

  const formatDate = (a: Announcement) => {
    const raw = a.date ?? a.time ?? a.createdAt
    if (!raw) return null
    try {
      const d = typeof raw === 'string' ? new Date(raw) : raw
      if (isNaN(d.getTime())) return null
      return d.toDateString()
    } catch (e) {
      return null
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Latest Announcements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {announcements.map((a) => (
          <div key={a.id} className="p-4 border rounded bg-white">
            <div className="flex items-start gap-3">
              {a.image && (
                <img src={a.image} alt="announcement" className="w-20 h-20 object-cover rounded-md border" />
              )}
              <div className="flex-1">
                <h3 className="font-medium">{a.title || (a.content ? a.content.split('\n')[0].slice(0, 60) : 'Announcement')}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-500">{a.author || 'System'}</p>
                  {formatDate(a) && <p className="text-xs text-slate-500">• {formatDate(a)}</p>}
                </div>
                {a.content && <p className="mt-2 text-sm text-slate-700">{a.content}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

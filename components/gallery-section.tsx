type MediaItem = {
  id: string
  type: "video" | "image"
  title: string
  thumbnailUrl?: string
  url?: string
  date?: Date
}

export function GallerySection({ items, compact = false }: { items: MediaItem[], compact?: boolean }) {
  if (!items || items.length === 0) return null

  const thumbHeight = compact ? 'h-24' : 'h-36'

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Photos</h2>
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3`}> 
        {items.map((it) => (
          <div key={it.id} className="rounded overflow-hidden shadow bg-white">
            {it.thumbnailUrl ? (
              <div className={`${thumbHeight} bg-cover bg-center`} style={{ backgroundImage: `url(${it.thumbnailUrl})` }} />
            ) : it.type === 'image' && it.url ? (
              <div className={`${thumbHeight} bg-cover bg-center`} style={{ backgroundImage: `url(${it.url})` }} />
            ) : (
              <div className={`${thumbHeight} bg-slate-100 flex items-center justify-center`}>No Image</div>
            )}
            <div className="p-2 text-sm">
              <div className="font-medium truncate">{it.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

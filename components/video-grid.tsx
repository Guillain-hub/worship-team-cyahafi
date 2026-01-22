type VideoItem = {
  id: string
  title: string
  url: string
  thumbnailUrl?: string
}

export function VideoGrid({ items }: { items: VideoItem[] }) {
  if (!items || items.length === 0) return null

  const inferThumb = (it: VideoItem) => {
    if (it.thumbnailUrl) return it.thumbnailUrl
    try {
      const u = new URL(it.url, typeof window !== 'undefined' ? window.location.origin : undefined)
      if (u.hostname.includes('youtube.com')) {
        const id = u.searchParams.get('v')
        if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
      }
      if (u.hostname.includes('youtu.be')) {
        const id = u.pathname.replace('/', '')
        if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
      }
    } catch (e) {}
    return undefined
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-semibold">Videos</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map(it => (
          <a key={it.id} href={it.url} target="_blank" rel="noreferrer" className="block rounded overflow-hidden shadow bg-white">
            <div className="relative h-28 bg-slate-100">
              {inferThumb(it) ? (
                <img src={inferThumb(it)} alt={it.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-slate-500">No Preview</div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/40 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-play"><path d="M5 3v18l15-9z"></path></svg>
                </div>
              </div>
            </div>
            <div className="p-2 text-sm">
              <div className="font-medium truncate">{it.title}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

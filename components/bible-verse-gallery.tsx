type Verse = {
  id: string
  text: string
  reference?: string
  imageUrl?: string
}

export function BibleVerseGallery({ verses }: { verses: Verse[] }) {
  if (!verses || verses.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {verses.map((v) => (
        <article key={v.id} className="rounded-lg overflow-hidden shadow">
          {v.imageUrl && (
            <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${v.imageUrl})` }} />
          )}
          <div className="p-4 bg-white">
            <p className="text-sm text-slate-800">{v.text}</p>
            {v.reference && <p className="mt-2 text-xs text-slate-500">{v.reference}</p>}
          </div>
        </article>
      ))}
    </div>
  )
}

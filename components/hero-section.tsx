type Props = {
  title: string
  subtitle?: string
}

export function HeroSection({ title, subtitle }: Props) {
  return (
    <section className="relative bg-slate-50 py-20">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-4 text-lg text-slate-700">{subtitle}</p>}
        <div className="mt-8 flex justify-center gap-3">
          <a href="#announcements" className="px-4 py-2 bg-sky-600 text-white rounded">See Announcements</a>
          <a href="#gallery" className="px-4 py-2 border rounded text-slate-700">View Gallery</a>
        </div>
      </div>
    </section>
  )
}

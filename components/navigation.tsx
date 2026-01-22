import Link from "next/link"

export function Navigation() {
  return (
    <header className="w-full bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="text-base sm:text-xl font-semibold whitespace-nowrap">Church</Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="text-xs sm:text-sm text-slate-700 hover:text-slate-900 font-medium">Login</Link>
          <Link href="/register" className="text-xs sm:text-sm text-white bg-sky-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded font-medium hover:bg-sky-700 transition-colors">Register</Link>
        </nav>
      </div>
    </header>
  )
}

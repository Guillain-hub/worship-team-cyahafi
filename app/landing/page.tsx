'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Music,
  LogIn,
  ChevronRight,
  ChevronLeft,
  X,
  Calendar,
  MapPin,
  Image as ImageIcon,
  PlayCircle,
  ArrowRight,
  Heart,
  Users,
  Star,
  MessageCircle,
} from 'lucide-react';

// --- Interfaces (Preserved) ---
interface GalleryItem { id: number; type: 'image' | 'video'; url: string; caption: string; duration?: string; }
interface Event { id: number; title: string; date: string; location: string; image: string; }
interface LandingContent {
  hero: { title: string; description: string };
  about: { title: string; content: string };
  events: Event[];
  upcomingEvents: Event[];
}

export default function LandingPage() {
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([]);
  const [aboutImages, setAboutImages] = useState<GalleryItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video'; index: number } | null>(null);
  const [aboutLightboxIndex, setAboutLightboxIndex] = useState<number>(0);
  const [aboutLightboxOpen, setAboutLightboxOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [landingContent, setLandingContent] = useState<LandingContent>({
    hero: { title: 'UNITE YOUR\nWORSHIP TEAM', description: 'Coordinate schedules, share resources, and build community. Worship Team ADEPR Cyahafi brings your ministry together...' },
    about: { title: 'Worship Team ADEPR Cyahafi - Serving with Excellence', content: 'We are the worship ministry of ADEPR Cyahafi, dedicated to leading our congregation...' },
    events: [],
    upcomingEvents: [],
  });

  const loadData = useCallback(async () => {
    try {
      const [galleryRes, contentRes, aboutRes] = await Promise.all([
        fetch('/api/gallery'),
        fetch('/api/landing-content'),
        fetch('/api/about-images'),
      ]);
      if (galleryRes.ok) { const g = await galleryRes.json(); setGalleryImages(g.items || []); }
      if (contentRes.ok) { const c = await contentRes.json(); setLandingContent(c); }
      if (aboutRes.ok) { const a = await aboutRes.json(); setAboutImages(a.items || []); }
    } catch (err) { console.error('Failed to load content:', err); }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', savedTheme === 'dark' || (!savedTheme && prefersDark));
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedMedia === null && !aboutLightboxOpen) return;
      if (aboutLightboxOpen) {
        if (e.key === 'ArrowLeft') setAboutLightboxIndex(i => i > 0 ? i - 1 : aboutImages.length - 1);
        if (e.key === 'ArrowRight') setAboutLightboxIndex(i => i < aboutImages.length - 1 ? i + 1 : 0);
        if (e.key === 'Escape') closeAboutLightbox();
        return;
      }
      if (selectedMedia) {
        const items = selectedMedia.type === 'image' ? imageItems : videoItems;
        if (e.key === 'ArrowLeft') setSelectedMedia(s => s ? { ...s, index: s.index > 0 ? s.index - 1 : items.length - 1 } : null);
        if (e.key === 'ArrowRight') setSelectedMedia(s => s ? { ...s, index: s.index < items.length - 1 ? s.index + 1 : 0 } : null);
        if (e.key === 'Escape') closeMedia();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, aboutLightboxOpen, aboutImages, galleryImages]);

  const galleryRef = useRef<HTMLDivElement | null>(null);
  const videosRef = useRef<HTMLDivElement | null>(null);

  const scrollGalleryRef = (ref: HTMLDivElement | null, dir: 'next' | 'prev') => {
    if (!ref) return;
    ref.scrollBy({ left: dir === 'next' ? 320 : -320, behavior: 'smooth' });
  };

  const openGalleryAt = (type: 'image' | 'video', idx: number = 0) => {
    setSelectedMedia({ type, index: idx });
    document.body.style.overflow = 'hidden';
  };

  const openAboutLightbox = (idx: number) => {
    setAboutLightboxIndex(idx);
    setAboutLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeAboutLightbox = () => {
    setAboutLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const closeMedia = () => {
    setSelectedMedia(null);
    document.body.style.overflow = 'auto';
  };

  const imageItems = galleryImages.filter(g => g.type === 'image');
  const videoItems = galleryImages.filter(g => g.type === 'video');

  const getYouTubeId = (url: string) => {
    try {
      const ytMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
      if (ytMatch?.[1]) return ytMatch[1];
      const short = url.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
      return short ? short[1] : null;
    } catch { return null; }
  };

  const getVideoThumbnail = (url: string) => {
    const ytId = getYouTubeId(url);
    return ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;
  };

  // Mission & Vision data
  const pillars = [
    { icon: <Music size={22} />, title: 'Worship Excellence', desc: 'We pursue musical and spiritual excellence in every service, rehearsal, and performance.' },
    { icon: <Heart size={22} />, title: 'Servant Hearts', desc: 'Our ministry is built on humility — we serve the congregation before ourselves.' },
    { icon: <Users size={22} />, title: 'Community First', desc: 'We are a family. We grow together, pray together, and celebrate every milestone.' },
    { icon: <Star size={22} />, title: 'Spirit-Led', desc: 'Every note we play and every word we sing is surrendered to the Holy Spirit.' },
  ];

  return (
    <div className="w-full min-h-screen cursor-default transition-colors duration-300 bg-[#0a0612] text-white">
      <link rel="stylesheet" href="/css/landing.css" />
      <link rel="stylesheet" href="/css/lightbox.css" />

      {/* Ambient Background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] bg-amber-900/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-yellow-500/8 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* ─── NAVIGATION ─────────────────────────────────────────────── */}
      <nav className="fixed z-50 top-0 inset-x-0 h-16 md:h-20 px-4 md:px-10 flex justify-between items-center bg-[#0a0612]/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        {/* Brand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-black to-amber-500 flex items-center justify-center">
            <Music size={14} className="text-white" />
          </div>
          <span className="text-sm md:text-base font-bold text-white">Worship Team</span>
        </div>

        {/* Desktop Nav — order matches page flow: Gallery → About → Events → Contact */}
        <div className="hidden md:flex items-center gap-8">
          {[['#gallery', 'Gallery'], ['#about', 'About Us'], ['#events', 'Events'], ['#footer', 'Contact']].map(([href, label]) => (
            <a key={href} href={href} className="text-sm font-medium text-gray-300 hover:text-amber-300 transition-colors">{label}</a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/register" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-amber-500/30 text-white hover:border-amber-500/60 hover:bg-amber-500/10 transition-all">
            Register
          </Link>
          <Link href="/login" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-lg shadow-amber-500/20">
            <LogIn size={14} /> Login
          </Link>
          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-white/70 hover:text-white" onClick={() => setMobileMenuOpen(o => !o)}>
            <div className="w-5 flex flex-col gap-1.5">
              <span className={`h-0.5 bg-current transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`h-0.5 bg-current transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 bg-current transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="fixed top-16 inset-x-0 z-40 bg-[#0d0918]/95 backdrop-blur-xl border-b border-white/10 flex flex-col py-4 px-6 gap-4">
          {[['#gallery', 'Gallery'], ['#about', 'About Us'], ['#events', 'Events'], ['#footer', 'Contact']].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-300 hover:text-amber-300 transition-colors py-1">{label}</a>
          ))}
          <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-amber-300 border border-amber-500/30 rounded-full px-4 py-2 text-center hover:bg-amber-500/10 transition-all">
            Register
          </Link>
        </div>
      )}

      {/* ─── 1. HERO ────────────────────────────────────────────────── */}
      <section className="min-h-[85vh] flex flex-col overflow-hidden w-full pt-20 px-4 md:px-12 pb-12 relative justify-center bg-[#0a0612]" id="hero">
        <div className="absolute inset-0 z-0">
          <img
            src="/uploads/hero/worship-team.jpeg"
            alt="Worship Team ADEPR Cyahafi leading congregation"
            className="w-full h-full object-cover opacity-60 saturate-0"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0612]/50 via-[#0a0612]/75 to-[#0a0612]" />
        </div>

        <div className="dot-grid absolute inset-0 z-0 opacity-10 pointer-events-none hidden md:block"
          style={{ backgroundImage: 'radial-gradient(rgba(147,51,234,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)' }} />

        <div className="relative z-10 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(217,119,6,0.6)] animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-widest text-amber-300">ADEPR Cyahafi Worship Ministry</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[9rem] leading-[0.85] font-bold tracking-tighter select-none text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(115deg, rgba(255,255,255,0.2) 30%, #ffffff 50%, rgba(255,255,255,0.2) 70%)', backgroundSize: '200% auto', animation: 'light-scan 6s linear infinite' }}>
            {landingContent.hero.title.split('\n').map((line, idx) => <div key={idx}>{line}</div>)}
          </h1>

          <p className="mt-6 max-w-xl font-light text-sm md:text-base lg:text-lg leading-relaxed text-gray-300">
            {landingContent.hero.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login"
              className="group flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02]">
              Login to Dashboard
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#gallery"
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium border border-white/20 text-white hover:border-amber-400/50 hover:bg-white/5 transition-all">
              View Gallery
            </a>
          </div>

          {/* Quick stats row */}
          <div className="mt-12 flex flex-wrap gap-6 md:gap-10">
            {[['Worship Services', 'Every Sunday'], ['Members', '30+ Active'], ['Years of Ministry', '10+ Years']].map(([label, val]) => (
              <div key={label} className="flex flex-col">
                <span className="text-xl md:text-2xl font-bold text-amber-300">{val}</span>
                <span className="text-xs text-gray-400 mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. GALLERY ─────────────────────────────────────────────── */}
      <section id="gallery" className="relative z-10 w-full py-12 lg:py-20 px-4 md:px-8 lg:px-12 bg-[#0a0612]">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="mb-10 lg:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Media</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white">
              Our Ministry <span className="text-amber-300">in Action</span>
            </h2>
            <p className="mt-2 text-sm text-gray-400 max-w-md">
              A glimpse into our worship services, rehearsals, and special events.
            </p>
          </div>

          {/* PHOTO GRID GALLERY */}
          {imageItems.length > 0 && (
            <div className="mb-16">
              {/* Responsive grid: 1 col mobile, 2 tablet, 3 desktop, 4 lg */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {imageItems.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openGalleryAt('image', idx)}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-amber-400/50 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 bg-[#0f0b1a] shadow-md hover:shadow-xl hover:shadow-amber-500/10"
                    aria-label={`Open photo: ${item.caption}`}
                  >
                    {/* Image */}
                    <img
                      src={item.url}
                      alt={item.caption}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      draggable={false}
                    />
                    
                    {/* Hover overlay with caption */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-end justify-end p-4">
                      <p className="text-sm font-medium text-white line-clamp-2 text-right">{item.caption}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Photo count info */}
              <div className="mt-8 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-400">{imageItems.length} Photo{imageItems.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* VIDEO CARD GRID */}
          {videoItems.length > 0 && (
            <div>
              <div className="h-px bg-white/8 mb-8" />

              <div className="flex items-center gap-3 mb-6">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                <h3 className="text-lg font-semibold text-white">Video Gallery</h3>
                <span className="ml-auto text-xs font-medium text-gray-500 border border-white/10 rounded-full px-3 py-1">
                  {videoItems.length} video{videoItems.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videoItems.map((item, idx) => {
                  const thumbnail = getVideoThumbnail(item.url);
                  const ytId = getYouTubeId(item.url);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openGalleryAt('video', idx)}
                      className="group text-left rounded-2xl overflow-hidden border border-white/10 hover:border-amber-400/50 transition-all duration-300 bg-[#0f0b1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      aria-label={`Play video: ${item.caption}`}
                    >
                      <div
                        className="relative h-[160px] overflow-hidden"
                        style={
                          thumbnail
                            ? { backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { background: 'linear-gradient(135deg, #1c0a2e, #3b1f5e)' }
                        }
                      >
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />

                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#92400e">
                              <polygon points="5,3 19,12 5,21" />
                            </svg>
                          </div>
                        </div>

                        {item.duration && (
                          <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
                            {item.duration}
                          </span>
                        )}

                        {ytId && (
                          <span className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 text-[10px] font-medium text-white px-2 py-0.5 rounded backdrop-blur-sm">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF0000">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            YouTube
                          </span>
                        )}
                      </div>

                      <div className="px-4 py-3 border-t border-white/8">
                        <p className="text-sm font-medium text-white leading-snug line-clamp-2 group-hover:text-amber-100 transition-colors">
                          {item.caption || 'Worship Video'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {imageItems.length === 0 && videoItems.length === 0 && (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-3 text-center">
                <ImageIcon size={48} className="text-amber-400/30" />
                <p className="text-sm text-gray-500">Gallery is being built — check back soon!</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* About Images Lightbox Modal */}
      {aboutLightboxOpen && aboutImages.length > 0 && (
        <div 
          className="fixed inset-0 z-[1001] flex items-center justify-center backdrop-blur-2xl bg-black/90"
          role="dialog"
          aria-label="Full screen about images lightbox viewer"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAboutLightbox();
            }
          }}
        >
          {/* Close Button */}
          <button 
            onClick={closeAboutLightbox}
            className="absolute top-8 right-8 z-[9999] text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full backdrop-blur-md pointer-events-auto"
            aria-label="Close about images"
            title="Close (ESC)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          <div className="relative max-w-5xl w-full px-4 flex flex-col items-center">
            {/* Image Container */}
            <div className="relative group w-full aspect-[4/5] md:aspect-video max-h-[70vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900">
              <img 
                src={aboutImages[aboutLightboxIndex]?.url} 
                className="w-full h-full object-contain" 
                alt={aboutImages[aboutLightboxIndex]?.caption}
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Elegant Caption Area */}
            <div className="mt-8 text-center max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4 backdrop-blur-sm">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-[0.15em]">
                  Image {aboutLightboxIndex + 1} of {aboutImages.length}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight leading-snug">
                {aboutImages[aboutLightboxIndex]?.caption || 'About Us'}
              </h3>
              <p className="mt-3 text-white/40 text-sm font-light">ADEPR Cyahafi Worship Team</p>
            </div>

            {/* Navigation Controls */}
            <div className="absolute top-1/2 -translate-y-1/2 inset-x-4 md:inset-x-12 flex justify-between pointer-events-none">
              <button 
                onClick={() => setAboutLightboxIndex(aboutLightboxIndex > 0 ? aboutLightboxIndex - 1 : aboutImages.length - 1)}
                className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all pointer-events-auto backdrop-blur-md hover:scale-110 shadow-lg"
                aria-label="View previous image"
                title="Previous (← arrow)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button 
                onClick={() => setAboutLightboxIndex(aboutLightboxIndex < aboutImages.length - 1 ? aboutLightboxIndex + 1 : 0)}
                className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all pointer-events-auto backdrop-blur-md hover:scale-110 shadow-lg"
                aria-label="View next image"
                title="Next (→ arrow)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>

            {/* Keyboard Navigation */}
            {aboutLightboxOpen && (() => {
              const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'ArrowLeft') {
                  setAboutLightboxIndex(aboutLightboxIndex > 0 ? aboutLightboxIndex - 1 : aboutImages.length - 1);
                } else if (e.key === 'ArrowRight') {
                  setAboutLightboxIndex(aboutLightboxIndex < aboutImages.length - 1 ? aboutLightboxIndex + 1 : 0);
                } else if (e.key === 'Escape') {
                  closeAboutLightbox();
                }
              };
              if (typeof window !== 'undefined') {
                window.addEventListener('keydown', handleKeyDown);
              }
              return null;
            })()}
          </div>
        </div>
      )}

      {/* ─── 3. ABOUT ───────────────────────────────────────────────── */}
      <section id="about" className="relative w-full py-12 lg:py-20 bg-gradient-to-b from-[#0a0612] to-[#0d0918]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-start">

          {/* Left: Text */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">Who We Are</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
              {landingContent.about.title.split(' - ')[0]}
              <span className="text-amber-300"> — {landingContent.about.title.split(' - ')[1]}</span>
            </h2>
            <div className="space-y-4 text-sm md:text-base font-light leading-relaxed text-gray-300">
              {landingContent.about.content.split('\n').map((p, idx) => <p key={idx}>{p}</p>)}
            </div>
          </div>

          {/* Right: Stacked Image Collage */}
          <div className="relative h-[320px] sm:h-[420px] lg:h-[500px] flex items-center justify-center" style={{ perspective: '1200px' }}>
            {aboutImages.length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {aboutImages.slice(0, 4).map((item, idx) => {
                  const isMain = idx === 0;
                  return (
                    <div key={item.id} onClick={() => openAboutLightbox(aboutImages.findIndex(i => i.id === item.id))}
                      className={`absolute transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer group select-none pointer-events-auto ${isMain ? 'z-30 hover:scale-[1.05]' : 'z-10'}`}
                      role="button" tabIndex={0} aria-label={`View: ${item.caption}`}
                      style={{ transform: isMain ? 'rotate(0deg)' : `rotate(${idx % 2 === 0 ? -8 : 8}deg) translateX(${idx % 2 === 0 ? -40 : 40}px) translateY(${idx * 15}px) scale(0.95)` }}>
                      <div className="relative overflow-hidden rounded-2xl border shadow-2xl w-40 sm:w-48 lg:w-72 h-56 sm:h-64 lg:h-[480px] border-amber-500/40 bg-gray-900"
                        style={{ boxShadow: '0 25px 50px -12px rgba(245,158,11,0.25), 0 10px 15px -3px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                        <img src={item.url} alt={item.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        {isMain && (
                          <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/90 to-transparent flex flex-col gap-1 translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                            <div className="flex items-center gap-1.5 text-amber-400">
                              <Music size={13} />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Featured Moment</span>
                            </div>
                            <p className="text-white text-xs font-semibold line-clamp-2 leading-snug">{item.caption}</p>
                          </div>
                        )}
                        {!isMain && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div className="backdrop-blur-md p-3 rounded-full border-2 bg-black/70 border-amber-400/60">
                              <ArrowRight size={20} className="text-amber-400" strokeWidth={3} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="absolute -bottom-2 right-8 md:right-16 z-40 px-4 py-1.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-tight shadow-xl">
                  +{aboutImages.length} Featured Moments
                </div>
              </div>
            ) : (
              <div className="w-56 h-72 rounded-2xl border-2 border-dashed border-amber-500/20 bg-amber-500/5 flex flex-col items-center justify-center gap-2">
                <ImageIcon className="text-amber-300/40" size={36} />
                <span className="text-[11px] font-bold uppercase tracking-tight text-amber-300/50">Archive Empty</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 4. MISSION & VISION ────────────────────────────────────── */}
      <section className="relative w-full py-12 lg:py-20 px-4 md:px-12 bg-[#0d0918]">
        {/* Subtle divider glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-10 lg:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">What Drives Us</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white">
              Our Mission <span className="text-amber-300">&amp; Vision</span>
            </h2>
            <p className="mt-3 text-sm text-gray-400 max-w-lg mx-auto">
              To glorify God through excellent, Spirit-led worship — and to raise a generation of worshippers who love His presence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {pillars.map((pillar) => (
              <div key={pillar.title}
                className="group relative p-6 rounded-2xl border border-white/8 bg-white/3 hover:bg-amber-500/5 hover:border-amber-500/30 transition-all duration-500 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/25 transition-colors">
                  {pillar.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">{pillar.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{pillar.desc}</p>
                </div>
                {/* Subtle hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-amber-500/0 group-hover:bg-amber-500/3 transition-colors pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. UPCOMING EVENTS ─────────────────────────────────────── */}
      <section id="events" className="relative w-full py-12 lg:py-20 px-4 md:px-8 lg:px-12 bg-[radial-gradient(ellipse_at_top,_#1a1228_0%,_#0a0612_70%)]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Calendar</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
                Upcoming <span className="text-amber-300">Events</span>
              </h2>
              <p className="mt-2 text-sm text-gray-400 max-w-md">
                Join us for worship, fellowship, and moments of spiritual growth.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            {landingContent.upcomingEvents?.length > 0 ? (
              landingContent.upcomingEvents.map((event, idx) => (
                <div key={event.id}
                  className="group relative rounded-xl overflow-hidden border border-amber-500/20 bg-gray-900/40 hover:border-amber-400/40 hover:bg-gray-900/60 backdrop-blur-lg transition-all duration-500 flex flex-col sm:flex-row items-stretch sm:items-center p-3 sm:p-4 gap-3 sm:gap-5"
                  style={{ animation: `slideUp 0.6s ease-out ${idx * 0.1}s both` }}>
                  {/* Image */}
                  <div className="relative w-full sm:w-24 h-36 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    {event.image ? (
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-500/30 to-black/50 flex items-center justify-center">
                        <Calendar size={28} className="text-amber-300/50" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-white/90 group-hover:text-amber-50 line-clamp-2 leading-snug">{event.title}</h3>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap bg-amber-500/20 border border-amber-400/40 text-amber-200">Upcoming</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-amber-100/60">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-amber-400 flex-shrink-0" />
                        <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-amber-400 flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-center py-16 px-4">
                <div className="text-center max-w-sm">
                  <Calendar size={44} className="mx-auto mb-4 text-amber-400/30" />
                  <p className="text-sm font-medium text-gray-400">No events scheduled yet</p>
                  <p className="text-xs text-gray-500 mt-1">Check back soon for upcoming worship events!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 6. CTA ─────────────────────────────────────────────────── */}
      <section className="relative w-full py-14 lg:py-20 px-4 md:px-12 overflow-hidden bg-gradient-to-b from-[#0a0612] to-[#0a0612]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[30rem] rounded-full blur-[120px] bg-amber-600/10 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        <div className="max-w-[800px] mx-auto relative z-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">Join the Team</p>
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
            Ready to join our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-300">worship community?</span>
          </h3>
          <p className="text-sm md:text-base font-light text-gray-300 max-w-lg mx-auto mt-4 leading-relaxed">
            Whether you are a musician, singer, or technical enthusiast, there is a place for you to serve alongside us.
          </p>

          {/* Action buttons — now populated */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register"
              className="group flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02]">
              Create an Account
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="https://wa.me/250787275157" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium border border-white/20 text-white hover:border-green-400/50 hover:bg-green-500/5 transition-all">
              <MessageCircle size={16} className="text-green-400" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer id="footer" className="relative w-full pt-10 pb-8 px-4 md:px-10 bg-[#0a0612]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-16 mb-10">
            {/* Brand */}
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-black to-amber-500 flex items-center justify-center flex-shrink-0">
                  <Music size={16} className="text-white" />
                </div>
                <span className="text-base font-semibold text-white">Worship Team ADEPR Cyahafi</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Connecting people with God through music, worship, and community in the ADEPR Cyahafi ministry.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-8 lg:gap-16">
              <div className="flex flex-col gap-3">
                <h4 className="text-white text-xs font-semibold mb-1 uppercase tracking-wider">Follow Us</h4>
                <a href="https://www.youtube.com/@WorshipTeamADEPRCyahafi" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  YouTube
                </a>
                <a href="https://www.instagram.com/worshipteamadeprcyahafi" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-pink-500 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#E1306C"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3z" /></svg>
                  Instagram
                </a>
                <a href="https://vm.tiktok.com/ZS91edG1d2jWo-2LYu4/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74a2.89 2.89 0 0 1 2.31-4.64a2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                  TikTok
                </a>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-white text-xs font-semibold mb-1 uppercase tracking-wider">Contact Us</h4>
                <a href="tel:+250782365998" className="text-xs text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  +250 782 365 998
                </a>
                <a href="tel:+250788564306" className="text-xs text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  +250 788 564 306
                </a>
                <a href="https://wa.me/250787275157" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-green-500 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.781 1.149c-1.488.464-2.792 1.311-3.822 2.407C3.368 11.721 2.75 13.475 2.75 15.298c0 1.973.523 3.88 1.51 5.594l-1.605 5.856 6.006-1.575c1.64.89 3.5 1.36 5.479 1.36 5.517 0 10-4.484 10-10s-4.483-10-10-10z" /></svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500" />
              </span>
              <span>All systems operational</span>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-4">
              <span>© 2026 Worship Team ADEPR Cyahafi</span>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── MEDIA LIGHTBOX ─────────────────────────────────────────── */}
      {selectedMedia !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300" onClick={closeMedia}>
          <button type="button" onClick={(e) => { e.stopPropagation(); closeMedia(); }}
            className="fixed top-6 right-6 z-[999] p-3 bg-white/10 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all">
            <X size={24} />
          </button>

          <div className="relative max-w-5xl w-full h-[70vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {selectedMedia.type === 'image' ? (
              <img src={imageItems[selectedMedia.index]?.url} alt={imageItems[selectedMedia.index]?.caption}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-amber-500/10" />
            ) : (() => {
              const vid = videoItems[selectedMedia.index];
              if (!vid) return null;
              const yt = getYouTubeId(vid.url || '');
              return yt
                ? <iframe title={vid.caption} src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`} className="w-full h-full max-h-[70vh] rounded-lg" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                : <video src={vid.url} controls className="max-w-full max-h-full rounded-lg" />;
            })()}

            {/* Nav arrows */}
            {(() => {
              const items = selectedMedia.type === 'image' ? imageItems : videoItems;
              return <>
                <button onClick={() => setSelectedMedia(s => s ? { ...s, index: s.index > 0 ? s.index - 1 : items.length - 1 } : null)} className="absolute left-2 md:-left-16 p-3 text-white/50 hover:text-white"><ChevronLeft size={40} /></button>
                <button onClick={() => setSelectedMedia(s => s ? { ...s, index: s.index < items.length - 1 ? s.index + 1 : 0 } : null)} className="absolute right-2 md:-right-16 p-3 text-white/50 hover:text-white"><ChevronRight size={40} /></button>
              </>;
            })()}
          </div>

          <div className="mt-6 text-center">
            <p className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-1">
              {selectedMedia.type === 'image' ? `Photo ${selectedMedia.index + 1} / ${imageItems.length}` : `Video ${selectedMedia.index + 1} / ${videoItems.length}`}
            </p>
            <h3 className="text-white text-lg font-medium max-w-xl px-4">
              {selectedMedia.type === 'image' ? imageItems[selectedMedia.index]?.caption : videoItems[selectedMedia.index]?.caption}
            </h3>
          </div>
        </div>
      )}

      {/* ─── ABOUT LIGHTBOX ─────────────────────────────────────────── */}
      {aboutLightboxOpen && aboutImages.length > 0 && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center backdrop-blur-2xl bg-black/90" role="dialog" aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) closeAboutLightbox(); }}>
          <button onClick={closeAboutLightbox} className="absolute top-6 right-6 z-[9999] text-white/50 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={28} />
          </button>

          <div className="relative max-w-4xl w-full px-4 flex flex-col items-center">
            <div className="relative w-full aspect-video max-h-[65vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900">
              <img src={aboutImages[aboutLightboxIndex]?.url} className="w-full h-full object-contain" alt={aboutImages[aboutLightboxIndex]?.caption} loading="lazy" />
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{aboutLightboxIndex + 1} / {aboutImages.length}</span>
              </div>
              <h3 className="text-lg font-semibold text-white">{aboutImages[aboutLightboxIndex]?.caption || 'About Us'}</h3>
            </div>

            <div className="absolute top-1/3 inset-x-2 md:inset-x-8 flex justify-between pointer-events-none">
              <button onClick={() => setAboutLightboxIndex(i => i > 0 ? i - 1 : aboutImages.length - 1)}
                className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/15 transition-all pointer-events-auto backdrop-blur-md">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setAboutLightboxIndex(i => i < aboutImages.length - 1 ? i + 1 : 0)}
                className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/15 transition-all pointer-events-auto backdrop-blur-md">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
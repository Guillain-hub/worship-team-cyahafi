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
  Moon, 
  Sun, 
  Image as ImageIcon, 
  PlayCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Upload
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video'; index: number } | null>(null);
  const [aboutLightboxIndex, setAboutLightboxIndex] = useState<number>(0);
  const [aboutLightboxOpen, setAboutLightboxOpen] = useState(false);
  const [landingContent, setLandingContent] = useState<LandingContent>({
    hero: { title: 'UNITE YOUR\nWORSHIP TEAM', description: 'Coordinate schedules, share resources, and build community. Worship Team ADEPR Cyahafi brings your ministry together...' },
    about: { title: 'Worship Team ADEPR Cyahafi - Serving with Excellence', content: 'We are the worship ministry of ADEPR Cyahafi, dedicated to leading our congregation...' },
    events: [],
    upcomingEvents: [],
  });

  // --- Logic (Preserved & Cleaned) ---
  const loadData = useCallback(async () => {
    try {
      const [galleryRes, contentRes, aboutRes] = await Promise.all([
        fetch('/api/gallery'),
        fetch('/api/landing-content'),
        fetch('/api/about-images'),
      ]);
      if (galleryRes.ok) {
        const gallery = await galleryRes.json();
        setGalleryImages(gallery.items || []);
      }
      if (contentRes.ok) {
        const content = await contentRes.json();
        setLandingContent(content);
      }
      if (aboutRes.ok) {
        const about = await aboutRes.json();
        setAboutImages(about.items || []);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
    }
  }, []);

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
    
    // Load data
    loadData();

    // Keyboard navigation for lightbox
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedMedia === null) return;

      if (e.key === 'ArrowLeft') {
        const imageItems = galleryImages.filter(g => g.type === 'image');
        const videoItems = galleryImages.filter(g => g.type === 'video');
        const items = selectedMedia.type === 'image' ? imageItems : videoItems;
        const newIndex = selectedMedia.index > 0 ? selectedMedia.index - 1 : items.length - 1;
        setSelectedMedia({ type: selectedMedia.type, index: newIndex });
      } else if (e.key === 'ArrowRight') {
        const imageItems = galleryImages.filter(g => g.type === 'image');
        const videoItems = galleryImages.filter(g => g.type === 'video');
        const items = selectedMedia.type === 'image' ? imageItems : videoItems;
        const newIndex = selectedMedia.index < items.length - 1 ? selectedMedia.index + 1 : 0;
        setSelectedMedia({ type: selectedMedia.type, index: newIndex });
      } else if (e.key === 'Escape') {
        closeMedia();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadData, selectedMedia]);

  const galleryRef = useRef<HTMLDivElement | null>(null);
  const videosRef = useRef<HTMLDivElement | null>(null);

  const scrollGallery = (dir: 'next' | 'prev') => {
    const container = galleryRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;
    const currentScroll = container.scrollLeft;
    if (dir === 'next') {
      const next = children.find(ch => ch.offsetLeft > currentScroll + 5);
      const target = next || children[children.length - 1];
      container.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    } else {
      const prevs = children.filter(ch => ch.offsetLeft < currentScroll - 5);
      const target = prevs.length ? prevs[prevs.length - 1] : children[0];
      container.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    }
  };

  const scrollGalleryRef = (ref: HTMLDivElement | null, dir: 'next' | 'prev') => {
    if (!ref) return;
    ref.scrollBy({ left: dir === 'next' ? 300 : -300, behavior: 'smooth' });
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
    setSelectedIndex(null);
    setSelectedMedia(null);
    document.body.style.overflow = 'auto';
  };

  const imageItems = galleryImages.filter(g => g.type === 'image');
  const videoItems = galleryImages.filter(g => g.type === 'video');

  const getYouTubeId = (url: string) => {
    try {
      const ytMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
      if (ytMatch && ytMatch[1]) return ytMatch[1];
      const short = url.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
      return short ? short[1] : null;
    } catch (e) { return null; }
  };

  const getVideoThumbnail = (url: string) => {
    const ytId = getYouTubeId(url);
    if (ytId) {
      // YouTube thumbnail URL - use maxresdefault first, fallback to hqdefault
      return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }
    // For non-YouTube videos, return null (will use gradient background)
    return null;
  };

  return (
    <div className={`w-full min-h-screen cursor-default transition-colors duration-300 bg-[#0a0612] text-white`}>
      <link rel="stylesheet" href="/css/landing.css" />
      <link rel="stylesheet" href="/css/lightbox.css" />

      {/* Optimized Ambient Background Glows */}
      <div className="glow-bg fixed top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] bg-amber-900/15 rounded-full blur-[80px] md:blur-[120px] pointer-events-none -z-10"></div>
      <div className="glow-bg fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-yellow-500/8 rounded-full blur-[60px] md:blur-[100px] pointer-events-none -z-10"></div>

      {/* Fixed Navigation Header */}
      <nav className="fixed z-50 top-0 inset-x-0 h-auto md:h-20 p-2 md:p-6 flex justify-between items-center bg-[#0a0612] border-b border-white/10 shadow-lg">
        {/* Logo/Brand - Left Side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-base md:text-lg font-bold text-white pointer-events-none">Worship Team</span>
        </div>

        {/* Navigation Links - Center */}
        <div className="hidden md:flex items-center gap-8 pointer-events-auto">
          <a href="#gallery" className="text-sm font-medium transition-colors cursor-pointer text-gray-300 hover:text-white pointer-events-auto">
            Gallery
          </a>
          <a href="#about" className="text-sm font-medium transition-colors cursor-pointer text-gray-300 hover:text-white pointer-events-auto">
            About Us
          </a>
          <a href="#footer" className="text-sm font-medium transition-colors cursor-pointer text-gray-300 hover:text-white pointer-events-auto">
            Contact Us
          </a>
        </div>

        {/* Action Buttons - Right Side */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 pointer-events-auto" style={{ touchAction: 'manipulation' }}>
          <Link href="/register" className="hidden sm:inline-flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all border border-amber-500/30 text-white hover:border-amber-500/60 hover:bg-amber-500/10 cursor-pointer pointer-events-auto" aria-label="Register for an account" style={{ touchAction: 'manipulation' }}>
            Register
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-1 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all shadow-lg text-black bg-amber-500 hover:bg-amber-400 cursor-pointer pointer-events-auto z-[60]" aria-label="Login to your account" style={{ touchAction: 'manipulation' }}>
            <LogIn width="16" height="16" />
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-[30vh] flex flex-col overflow-hidden w-full pt-32 md:pt-32 px-4 md:px-12 pb-8 md:pb-12 relative justify-center transition-colors duration-300 bg-[#0a0612]" id="hero">
        <div className="absolute inset-0 z-0">
          <img 
            src="/uploads/hero/worship-team.jpeg" 
            alt="Worship Team ADEPR Cyahafi leading congregation in worship with musical instruments and passionate engagement"
            className="w-full h-full object-cover will-change-transform opacity-75 saturate-0"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0612]/60 via-[#0a0612]/80 to-[#0a0612]"></div>
        </div>

        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none hidden md:block" style={{backgroundImage: 'radial-gradient(rgba(147, 51, 234, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)'}}></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 w-full max-w-[1400px] z-10 mx-auto relative gap-8 md:gap-12 items-center">
          {/* Left: Typography */}
          <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(217,119,6,0.6)] animate-pulse"></span>
              <span className="text-xs md:text-sm font-medium uppercase tracking-widest text-amber-300">ADEPR Cyahafi Worship Ministry</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[9rem] leading-[0.85] flex flex-col items-start gap-2 font-bold tracking-tighter select-none text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(115deg, rgba(255,255,255,0.2) 30%, #ffffff 50%, rgba(255,255,255,0.2) 70%)', backgroundSize: '200% auto', animation: 'light-scan 6s linear infinite'}}>
              {landingContent.hero.title.split('\n').map((line, idx) => <div key={idx}>{line}</div>)}
            </h1>

            <p className="mt-3 md:mt-8 max-w-xl font-light text-sm md:text-base lg:text-lg leading-relaxed text-gray-300">
              {landingContent.hero.description}
            </p>

            <div className="mt-4 md:mt-8 flex justify-start">
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-fit">
                <Link href="/login" className="group flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm lg:text-base font-semibold transition-all text-white shadow-lg hover:scale-[1.02] bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-500/30 hover:shadow-amber-500/40 pointer-events-auto" aria-label="Log in to your dashboard" style={{ touchAction: 'manipulation' }}>
                  <span>Login to Dashboard</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          {/* Right: 3D App Preview - Hidden on Mobile */}
          <div className="hidden lg:flex lg:col-span-5 h-full items-center justify-center relative pointer-events-none select-none">
            {/* Empty space for balance */}
          </div>
        </div>
      </section>

      {/* Media Lightbox (image or video) */}
      {selectedMedia !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={closeMedia}
        >
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeMedia(); }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); closeMedia(); }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); closeMedia(); }}
            aria-label="Close media"
            style={{ touchAction: 'manipulation' }}
            className="fixed top-8 right-8 z-[99999] p-4 bg-white/10 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all pointer-events-auto"
          >
            <X size={32} />
          </button>

          <div className="relative max-w-5xl w-full h-[70vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.type === 'image' ? (
              <img
                src={imageItems[selectedMedia.index]?.url}
                alt={imageItems[selectedMedia.index]?.caption}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-amber-500/10"
              />
            ) : (
              (() => {
                const vid = videoItems[selectedMedia.index];
                if (!vid) return null;
                const yt = getYouTubeId(vid.url || '');
                return yt ? (
                  <iframe
                    title={vid.caption || 'Video'}
                    src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`}
                    className="w-full h-full max-h-[70vh] rounded-lg"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={vid.url} controls className="max-w-full max-h-full rounded-lg" />
                );
              })()
            )}

            {selectedMedia.type === 'image' ? (
              <>
                <button
                  onClick={() => setSelectedMedia(s => s ? { type: 'image', index: s.index > 0 ? s.index - 1 : imageItems.length - 1 } : null)}
                  className="absolute left-2 md:-left-16 p-4 text-white/50 hover:text-white transition-colors"
                >
                  <ChevronLeft size={48} />
                </button>
                <button
                  onClick={() => setSelectedMedia(s => s ? { type: 'image', index: s.index < imageItems.length - 1 ? s.index + 1 : 0 } : null)}
                  className="absolute right-2 md:-right-16 p-4 text-white/50 hover:text-white transition-colors"
                >
                  <ChevronRight size={48} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectedMedia(s => s ? { type: 'video', index: s.index > 0 ? s.index - 1 : videoItems.length - 1 } : null)}
                  className="absolute left-2 md:-left-16 p-4 text-white/50 hover:text-white transition-colors"
                >
                  <ChevronLeft size={48} />
                </button>
                <button
                  onClick={() => setSelectedMedia(s => s ? { type: 'video', index: s.index < videoItems.length - 1 ? s.index + 1 : 0 } : null)}
                  className="absolute right-2 md:-right-16 p-4 text-white/50 hover:text-white transition-colors"
                >
                  <ChevronRight size={48} />
                </button>
              </>
            )}
          </div>

          <div className="mt-8 text-center animate-in slide-in-from-bottom-4 duration-500">
            <p className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-2">
              {selectedMedia.type === 'image' ? `Archive ${selectedMedia.index + 1} / ${imageItems.length}` : `Video ${selectedMedia.index + 1} / ${videoItems.length}`}
            </p>
            <h3 className="text-white text-xl font-medium max-w-2xl px-4">
              {selectedMedia.type === 'image' ? imageItems[selectedMedia.index]?.caption : videoItems[selectedMedia.index]?.caption}
            </h3>
          </div>
        </div>
      )}

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
      <section id="about" className="relative w-full py-8 md:py-12 transition-colors duration-300 bg-gradient-to-b from-[#0a0612] to-[#0a0612]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
          
          {/* Left: Text Content */}
          <div className="order-2 lg:order-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 tracking-tight text-white">
              {landingContent.about.title.split(' - ')[0]}
              <span className="text-amber-300"> - {landingContent.about.title.split(' - ')[1]}</span>
            </h2>
            
            <div className="space-y-3 md:space-y-4 text-sm md:text-base lg:text-lg xl:text-xl font-light leading-relaxed max-w-2xl text-gray-300">
              {landingContent.about.content.split('\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Right: Layered Image Stack */}
          <div 
            className="order-1 lg:order-2 relative h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] flex items-center justify-center" 
            style={{ perspective: '1200px' }}
          >
            {aboutImages.length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {aboutImages.slice(0, 4).map((item, idx) => {
                  const isMain = idx === 0;
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => openAboutLightbox(aboutImages.findIndex(img => img.id === item.id))}
                      className={`
                        absolute transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                        cursor-pointer group select-none pointer-events-auto
                        ${isMain ? 'z-30 hover:scale-[1.05]' : 'z-10 hover:scale-100'}
                      `}
                      role="button"
                      tabIndex={0}
                      aria-label={`View image: ${item.caption}`}
                      style={{
                        // Elegant initial fanned-out state
                        transform: isMain 
                          ? 'rotate(0deg) translateY(0)' 
                          : `rotate(${idx % 2 === 0 ? -8 : 8}deg) translateX(${idx % 2 === 0 ? -40 : 40}px) translateY(${idx * 15}px) scale(0.95)`,
                      }}
                    >
                      {/* The Image Container - Portrait Aspect Ratio like Polaroid */}
                      <div className="
                        relative overflow-hidden rounded-2xl border shadow-2xl
                        w-40 sm:w-48 md:w-56 lg:w-72 h-56 sm:h-64 md:h-80 lg:h-[480px]
                        border-amber-500/40 bg-gray-900
                      "
                      style={{
                        boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.25), 0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                        pointerEvents: 'none',
                      }}>
                        <img
                          src={item.url}
                          alt={item.caption}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
                          loading="lazy"
                          decoding="async"
                        />
                        
                        {/* Glossy Overlay Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        
                        {/* Subtle Rim Light on Hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ring-2 ring-amber-400/30" />
                        
                        {isMain && (
                          <div className={`absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-500`}>
                            <div className="flex items-center gap-2 text-amber-400 mb-2">
                              <Music size={16} className="drop-shadow-lg" />
                              <span className="text-[11px] font-bold uppercase tracking-widest drop-shadow-lg">✨ Featured Moment</span>
                            </div>
                            <p className="text-white text-sm font-semibold line-clamp-2 drop-shadow-lg leading-snug">{item.caption}</p>
                          </div>
                        )}
                      </div>

                      {/* Hint Badge for non-main images on hover - Premium Style */}
                      {!isMain && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                          <div className="backdrop-blur-md p-4 rounded-full border-2 transition-all bg-black/70 border-amber-400/60 shadow-xl shadow-amber-500/20">
                            <ArrowRight size={24} className="text-amber-400" strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Floating Counter Badge */}
                <div className="absolute -bottom-4 right-10 md:right-20 z-40 px-4 py-2 rounded-full backdrop-blur-md border text-[10px] font-black uppercase tracking-tighter shadow-xl bg-amber-500 text-black border-amber-400">
                  +{aboutImages.length} Featured Moments
                </div>
              </div>
            ) : (
              <div className="w-64 h-80 rounded-2xl border-2 border-dashed border-amber-500/20 bg-amber-500/5">
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <ImageIcon className="text-amber-300/40 mb-2" size={40} />
                  <span className="text-xs font-bold uppercase tracking-tighter text-amber-300/60">Archive Empty</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
<section
  id="gallery"
  className="relative z-10 w-full py-8 md:py-12 lg:py-20 px-4 md:px-8 lg:px-12 bg-[#0a0612]"
>
  <div className="max-w-[1400px] mx-auto">
    {/* Header */}
    <div className="text-center mb-6 md:mb-10 lg:mb-14 select-none">
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white">
        Our Ministry <span className="text-amber-300">in Action</span>
      </h2>
    </div>

    {/* Images Row */}
    {imageItems.length > 0 && (
      <div className="relative mb-12 group/row">
        {/* Fade edges - pointer-events-none is correct, but z-index should be lower than buttons */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-[#0a0612] to-transparent z-20" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#0a0612] to-transparent z-20" />

        {/* Scroll buttons - Added opacity-0 group-hover/row:opacity-100 for a cleaner look */}
        <button
          type="button"
          onClick={() => scrollGallery('prev')}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 text-white hover:bg-amber-500 transition-all opacity-0 group-hover/row:opacity-100 hidden md:flex"
          aria-label="Previous image"
        >
          <ChevronLeft />
        </button>

        <button
          type="button"
          onClick={() => scrollGallery('next')}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 text-white hover:bg-amber-500 transition-all opacity-0 group-hover/row:opacity-100 hidden md:flex"
          aria-label="Next image"
        >
          <ChevronRight />
        </button>

        {/* Gallery Row */}
        <div
          ref={galleryRef}
          className="flex flex-nowrap gap-4 overflow-x-auto scroll-smooth pb-6 relative z-10 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {imageItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openGalleryAt('image', idx)}
              className="relative flex-shrink-0 w-[150px] sm:w-[200px] md:w-[280px] lg:w-[300px] h-[120px] sm:h-[160px] md:h-[200px] lg:h-[220px] rounded-xl overflow-hidden border border-white/10 hover:border-amber-400/70 hover:scale-[1.02] transition-all duration-300 active:scale-95"
            >
              <img 
                src={item.url} 
                alt={item.caption || 'Ministry Action'} 
                className="w-full h-full object-cover" 
                draggable={false} 
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Video Gallery Header (Inside loop check) */}
    {videoItems.length > 0 && (
      <div className="relative group/vidrow">
        <div className="mb-4">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-amber-300">Video Gallery</h3>
        </div>

        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-[#0a0612] to-transparent z-20" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#0a0612] to-transparent z-20" />

        {/* Scroll buttons */}
        <button
          type="button"
          onClick={() => scrollGalleryRef(videosRef.current, 'prev')}
          className="absolute left-4 top-[60%] -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 text-white hover:bg-amber-500 transition-all opacity-0 group-hover/vidrow:opacity-100 hidden md:flex"
        >
          <ChevronLeft />
        </button>

        <button
          type="button"
          onClick={() => scrollGalleryRef(videosRef.current, 'next')}
          className="absolute right-4 top-[60%] -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 text-white hover:bg-amber-500 transition-all opacity-0 group-hover/vidrow:opacity-100 hidden md:flex"
        >
          <ChevronRight />
        </button>

        <div
          ref={videosRef}
          className="flex flex-nowrap gap-4 overflow-x-auto scroll-smooth pb-6 relative z-10 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {videoItems.map((item, idx) => {
            const thumbnail = getVideoThumbnail(item.url);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openGalleryAt('video', idx)}
                className="relative flex-shrink-0 w-[150px] sm:w-[200px] md:w-[280px] lg:w-[300px] h-[120px] sm:h-[160px] md:h-[200px] lg:h-[220px] rounded-xl overflow-hidden border border-white/10 hover:border-amber-400/70 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center group/item bg-gray-900"
                style={thumbnail ? { backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/20 to-black/60 group-hover/item:via-black/10 transition-all flex items-center justify-center">
                  <PlayCircle size={48} className="text-amber-300 group-hover/item:scale-110 transition-transform drop-shadow-xl opacity-90" />
                </div>
                {item.caption && (
                  <span className="absolute bottom-2 left-2 right-2 text-[10px] md:text-xs text-white font-medium truncate bg-black/70 px-2 py-1 rounded backdrop-blur-sm">
                    {item.caption}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    )}
  </div>
</section>


      {/* Upcoming Events Section */}
      <section
        className="relative w-full py-8 md:py-12 lg:py-20 px-3 sm:px-4 md:px-8 lg:px-12 transition-colors duration-500 bg-[radial-gradient(ellipse_at_top,_#1a1228_0%,_#0a0612_70%)]"
      >
        <div className="max-w-[1400px] mx-auto">
    {/* Header */}
    <div className="flex flex-col gap-3 mb-6 sm:mb-8 md:mb-10">
      <div>
        <h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-1 sm:mb-2 text-white"
        >
          Upcoming{' '}
          <span className="text-amber-300">
            Events
          </span>
        </h2>
        <p
          className="text-xs sm:text-sm leading-relaxed max-w-md text-gray-400"
        >
          Join us for worship, fellowship, and moments of spiritual growth
        </p>
      </div>
    </div>

    {/* Events Grid */}
    <div className="flex flex-col gap-3 sm:gap-4 w-full">
      {landingContent.upcomingEvents &&
      landingContent.upcomingEvents.length > 0 ? (
        landingContent.upcomingEvents.map((event, idx) => (
          <div
            key={event.id}
            className={`group relative rounded-lg overflow-hidden border/50 backdrop-blur-lg
            transition-all duration-700 hover:shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center p-3 sm:p-4 gap-3 sm:gap-4
            border-amber-500/20 bg-gray-900/40 hover:border-amber-400/40`}
            style={{
              animation: `slideUp 0.6s ease-out ${idx * 0.1}s both`,
            }}
          >
            {/* Image */}
            <div className="relative w-full sm:w-24 sm:h-24 h-40 sm:flex-shrink-0 rounded-lg overflow-hidden">
              {event.image ? (
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                  loading="lazy"
                />
              ) : (
                <div
                  className="flex items-center justify-center w-full h-full bg-gradient-to-br from-amber-500/30 to-black/50"
                >
                  <Calendar
                    size={32}
                    className="text-amber-300/50"
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-2 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <h3
                  className="text-sm sm:text-base font-semibold leading-snug text-white/90 group-hover:text-amber-50 line-clamp-2"
                >
                  {event.title}
                </h3>
                <div
                  className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0
                  backdrop-blur-md border bg-amber-500/20 border-amber-400/40 text-amber-200"
                >
                  Upcoming
                </div>
              </div>

              <div
                className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-amber-100/70"
              >
                {/* Date */}
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar
                    size={14}
                    className="flex-shrink-0 text-amber-400"
                  />
                  <span className="line-clamp-1">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin
                    size={14}
                    className="flex-shrink-0 text-amber-400"
                  />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        /* Empty State */
        <div className="col-span-full flex justify-center py-12 sm:py-16 md:py-20 px-4">
          <div
            className="rounded-2xl border-2 border-dashed text-center max-w-md border-amber-500/30 text-gray-400"
          >
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium">No events scheduled yet</p>
            <p className="text-xs opacity-75 mt-2">Check back soon for upcoming worship events!</p>
          </div>
        </div>
      )}
    </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full py-6 md:py-8 lg:py-12 px-4 md:px-8 lg:px-12 overflow-hidden transition-colors duration-300 bg-gradient-to-b from-[#0a0612] to-[#0a0612]">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[25rem] rounded-full blur-[100px] bg-amber-600/8"></div>
        </div>

        <div className="max-w-[900px] mx-auto relative z-10 text-center">
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight text-white px-2">
            Ready to join our <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-300">worship community?</span>
          </h3>
          
          <p className="text-xs sm:text-sm md:text-base leading-relaxed font-light max-w-lg mx-auto mt-2 md:mt-3 text-gray-300 px-2">
            Whether you are a musician, singer, or technical enthusiast, there is a place for you to serve.
          </p>


        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className={`relative w-full pt-6 md:pt-8 lg:pt-10 pb-6 md:pb-8 px-4 md:px-8 lg:px-12 bg-[#0a0612]`}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between gap-8 md:gap-12 lg:gap-16 mb-8 md:mb-12 lg:mb-16">
            {/* Brand */}
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-black to-amber-500 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                  </svg>
                </div>
                <span className="text-lg md:text-xl font-semibold text-white">Worship Team ADEPR Cyahafi</span>
              </div>
              <p className="text-xs md:text-sm text-purple-100/60 leading-relaxed mb-4 md:mb-6">
                Connecting people with God through music, worship, and community in the ADEPR Cyahafi ministry.
              </p>

            </div>

            {/* Links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 lg:gap-16">
              <div className="flex flex-col gap-3 md:gap-4">
                <h4 className="text-white text-xs md:text-sm font-semibold mb-1 md:mb-2">Follow Us</h4>
                <a href="https://www.youtube.com/@WorshipTeamADEPRCyahafi" target="_blank" rel="noopener noreferrer" className="text-xs md:text-sm text-purple-200/60 hover:text-red-500 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#FF0000">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
                  </svg>
                  YouTube
                </a>
                <a href="https://www.instagram.com/worshipteamadepr?igsh=Zjc4cDA5c3o5b2Zs" target="_blank" rel="noopener noreferrer" className="text-xs md:text-sm text-purple-200/60 hover:text-pink-500 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#E1306C">
                    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3z"></path>
                  </svg>
                  Instagram
                </a>
                <a href="https://vm.tiktok.com/ZS91edG1d2jWo-2LYu4/" target="_blank" rel="noopener noreferrer" className="text-xs md:text-sm text-purple-200/60 hover:text-white transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74a2.89 2.89 0 0 1 2.31-4.64a2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"></path>
                  </svg>
                  TikTok
                </a>
              </div>

              <div className="flex flex-col gap-3 md:gap-4">
                <h4 className="text-white text-xs md:text-sm font-semibold mb-1 md:mb-2">Contact Us</h4>
                <a href="tel:+250782365998" className="text-xs md:text-sm text-purple-200/60 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#0066CC" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  +250 782 365 998
                </a>
                <a href="tel:+250788564306" className="text-xs md:text-sm text-purple-200/60 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#0066CC" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  +250 788 564 306
                </a>
                <a href="https://wa.me/250787275157" target="_blank" rel="noopener noreferrer" className="text-xs md:text-sm text-purple-200/60 hover:text-green-500 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.781 1.149c-1.488.464-2.792 1.311-3.822 2.407C3.368 11.721 2.75 13.475 2.75 15.298c0 1.973.523 3.88 1.51 5.594l-1.605 5.856 6.006-1.575c1.64.89 3.5 1.36 5.479 1.36 5.517 0 10-4.484 10-10s-4.483-10-10-10z"></path>
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 md:mt-12 lg:mt-16 pt-6 md:pt-8 lg:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-purple-300/50">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span>All systems operational</span>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-6">
              <span>© 2026 Worship Team ADEPR Cyahafi</span>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
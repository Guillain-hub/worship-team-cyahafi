'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

interface GalleryItem {
  id: number;
  type: 'image' | 'video';
  url: string;
  caption: string;
  duration?: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  image: string;
}

interface LandingContent {
  hero: { title: string; description: string };
  about: { title: string; content: string };
  events: Event[];
  upcomingEvents: Event[];
}

interface AboutImage {
  id: number;
  url: string;
  caption: string;
  order: number;
}

export default function ContentManagement() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('gallery');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [landingContent, setLandingContent] = useState<LandingContent>({
    hero: { title: '', description: '' },
    about: { title: '', content: '' },
    events: [],
    upcomingEvents: [],
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: 'gallery' | 'event' | 'upcoming' | 'about-image' } | null>(null);
  const [galleryCaption, setGalleryCaption] = useState('');
  const [galleryItemType, setGalleryItemType] = useState<'image' | 'video'>('image');
  const [galleryVideoUrl, setGalleryVideoUrl] = useState('');
  const [eventForm, setEventForm] = useState({ title: '', date: '', location: '' });
  const [upcomingForm, setUpcomingForm] = useState({ title: '', date: '', location: '', image: '' });
  const [upcomingImageFile, setUpcomingImageFile] = useState<File | null>(null);
  const [upcomingImagePreview, setUpcomingImagePreview] = useState<string>('');
  const [aboutImages, setAboutImages] = useState<AboutImage[]>([]);
  const [showAboutImageModal, setShowAboutImageModal] = useState(false);
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [aboutImageCaption, setAboutImageCaption] = useState('');
  const [aboutImagePreview, setAboutImagePreview] = useState<string>('');

  useEffect(() => {
    if (loading) return;

    // Check if user is admin
    const userRole = user?.role ? (typeof user.role === 'object' ? (user.role as any)?.name : user.role) : null;
    const isAdmin = userRole === 'Leader' || userRole === 'Admin';

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    setIsAuthorized(true);

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);

    // Load gallery and content
    loadData();
  }, [loading, user, router]);

  const handleUpcomingImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUpcomingImageFile(file);
      const preview = URL.createObjectURL(file);
      setUpcomingImagePreview(preview);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/gallery', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setUpcomingForm({ ...upcomingForm, image: result.url });
        }
      } catch (err) {
        console.error('Failed to upload image:', err);
      }
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [galleryRes, contentRes, aboutImagesRes] = await Promise.all([
        fetch('/api/gallery'),
        fetch('/api/landing-content'),
        fetch('/api/about-images'),
      ]);

      if (galleryRes.ok) {
        const gallery = await galleryRes.json();
        setGalleryItems(gallery.items || []);
      }

      if (contentRes.ok) {
        const content = await contentRes.json();
        const fullContent = {
          hero: content.hero || { title: '', description: '' },
          about: content.about || { title: '', content: '' },
          events: content.events || [],
          upcomingEvents: content.upcomingEvents || [],
        };
        setLandingContent(fullContent);
        setEvents(fullContent.events);
      }

      if (aboutImagesRes.ok) {
        const aboutData = await aboutImagesRes.json();
        setAboutImages(aboutData.items || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

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
      return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }
    return null;
  };

  const saveHeroContent = async () => {
    setIsSaving(true);
    try {
      const heroTitle = (document.querySelector('#hero-title') as HTMLInputElement)?.value;
      const heroDesc = (document.querySelector('#hero-description') as HTMLTextAreaElement)?.value;

      if (!heroTitle || !heroDesc) {
        alert('Please fill in all fields');
        setIsSaving(false);
        return;
      }

      const updatedContent = {
        ...landingContent,
        hero: {
          title: heroTitle,
          description: heroDesc,
        },
      };

      const res = await fetch('/api/landing-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedContent),
      });

      if (res.ok) {
        const saved = await res.json();
        setLandingContent(saved);
        alert('Hero content saved successfully!');
      } else {
        alert('Failed to save. Please try again.');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save hero content: ' + err);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAboutContent = async () => {
    setIsSaving(true);
    try {
      const aboutTitle = (document.querySelector('#about-title') as HTMLInputElement)?.value;
      const aboutText = (document.querySelector('#about-content') as HTMLTextAreaElement)?.value;

      if (!aboutTitle || !aboutText) {
        alert('Please fill in all fields');
        setIsSaving(false);
        return;
      }

      const updatedContent = {
        ...landingContent,
        about: {
          title: aboutTitle,
          content: aboutText,
        },
      };

      const res = await fetch('/api/landing-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedContent),
      });

      if (res.ok) {
        const saved = await res.json();
        setLandingContent(saved);
        alert('About content saved successfully!');
      } else {
        alert('Failed to save. Please try again.');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save about content: ' + err);
    } finally {
      setIsSaving(false);
    }
  };

  const addGalleryItem = async () => {
    if (galleryItemType === 'image') {
      if (!uploadFile) {
        alert('Please select an image file');
        return;
      }
    } else {
      if (!galleryVideoUrl) {
        alert('Please enter a video URL');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (galleryItemType === 'image') {
        // Handle image upload
        const formData = new FormData();
        formData.append('file', uploadFile!);
        formData.append('caption', galleryCaption || 'Untitled');
        formData.append('type', 'image');

        const res = await fetch('/api/gallery', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const newItem = await res.json();
          setGalleryItems([...galleryItems, newItem]);
          setShowGalleryModal(false);
          setGalleryCaption('');
          setUploadFile(null);
          alert('Image added successfully!');
        } else {
          alert('Failed to upload image');
        }
      } else {
        // Handle video URL
        const newVideo: GalleryItem = {
          id: Date.now(),
          type: 'video',
          url: galleryVideoUrl,
          caption: galleryCaption || 'Video',
          duration: '',
        };

        const res = await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newVideo),
        });

        if (res.ok) {
          const savedItem = await res.json();
          setGalleryItems([...galleryItems, savedItem]);
          setShowGalleryModal(false);
          setGalleryCaption('');
          setGalleryVideoUrl('');
          setGalleryItemType('image');
          alert('Video added successfully!');
        } else {
          alert('Failed to add video');
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  const addEvent = async () => {
    if (eventForm.title && eventForm.date && eventForm.location) {
      setIsLoading(true);
      try {
        const newEvent: Event = {
          id: Date.now(),
          title: eventForm.title,
          date: eventForm.date,
          location: eventForm.location,
          image: 'https://via.placeholder.com/400',
        };

        const updatedContent = {
          ...landingContent,
          events: [...landingContent.events, newEvent],
        };

        const res = await fetch('/api/landing-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedContent),
        });

        if (res.ok) {
          setLandingContent(updatedContent);
          setEvents(updatedContent.events);
          setShowEventModal(false);
          setEventForm({ title: '', date: '', location: '' });
        } else {
          alert('Failed to add event');
        }
      } catch (err) {
        console.error('Add event error:', err);
        alert('Failed to add event');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const addUpcomingEvent = async () => {
    if (upcomingForm.title && upcomingForm.date && upcomingForm.location) {
      setIsLoading(true);
      try {
        const newEvent: Event = {
          id: Date.now(),
          title: upcomingForm.title,
          date: upcomingForm.date,
          location: upcomingForm.location,
          image: upcomingForm.image || 'https://via.placeholder.com/400',
        };

        const updatedContent = {
          ...landingContent,
          upcomingEvents: [...landingContent.upcomingEvents, newEvent],
        };

        const res = await fetch('/api/landing-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedContent),
        });

        if (res.ok) {
          setLandingContent(updatedContent);
          setShowUpcomingModal(false);
          setUpcomingForm({ title: '', date: '', location: '', image: '' });
          setUpcomingImageFile(null);
          setUpcomingImagePreview('');
        } else {
          alert('Failed to add upcoming event');
        }
      } catch (err) {
        console.error('Add upcoming event error:', err);
        alert('Failed to add upcoming event');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deleteItem = (id: number, type: 'gallery' | 'event' | 'upcoming' | 'about-image') => {
    setDeleteTarget({ id, type });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsLoading(true);
    try {
      if (deleteTarget.type === 'gallery') {
        const res = await fetch('/api/gallery', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: deleteTarget.id }),
        });

        if (res.ok) {
          setGalleryItems(galleryItems.filter(item => item.id !== deleteTarget.id));
        }
      } else if (deleteTarget.type === 'event') {
        // Update events in landing content
        const updatedContent = {
          ...landingContent,
          events: landingContent.events.filter((e: Event) => e.id !== deleteTarget.id),
        };
        const res = await fetch('/api/landing-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedContent),
        });

        if (res.ok) {
          setLandingContent(updatedContent);
          setEvents(updatedContent.events);
        }
      } else if (deleteTarget.type === 'upcoming') {
        // Update upcoming events in landing content
        const updatedContent = {
          ...landingContent,
          upcomingEvents: landingContent.upcomingEvents.filter((e: Event) => e.id !== deleteTarget.id),
        };
        const res = await fetch('/api/landing-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedContent),
        });

        if (res.ok) {
          setLandingContent(updatedContent);
        }
      } else if (deleteTarget.type === 'about-image') {
        const res = await fetch('/api/about-images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: deleteTarget.id }),
        });

        if (res.ok) {
          setAboutImages(aboutImages.filter(item => item.id !== deleteTarget.id));
        }
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete item');
    } finally {
      setIsLoading(false);
    }
  };

  const addAboutImage = async () => {
    if (!aboutImageFile) {
      alert('Please select a file');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', aboutImageFile);
      formData.append('caption', aboutImageCaption || 'Untitled');

      const res = await fetch('/api/about-images', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newItem = await res.json();
        setAboutImages([...aboutImages, newItem]);
        setShowAboutImageModal(false);
        setAboutImageCaption('');
        setAboutImageFile(null);
      } else {
        alert('Failed to upload file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAboutImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAboutImageFile(file);
    }
  };

  return (
    <div className="w-full min-h-screen dark:bg-[#0a0612] overflow-x-hidden">
      {!isAuthorized || loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block px-6 py-3 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600 mx-auto">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading...</h2>
            <p className="text-gray-600 dark:text-purple-200/60">Verifying access permissions</p>
          </div>
        </div>
      ) : (
        <>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-panel border-b dark:border-white/10 border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-amber-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">ADEPR Cyahafi Admin</h1>
              <p className="text-xs text-gray-600 dark:text-purple-300/60">Content Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="px-4 py-2 rounded-full glass-panel text-sm font-medium hover:bg-purple-50 dark:hover:bg-white/10 transition-all">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="w-full px-4 md:px-8 py-8 overflow-x-hidden">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b dark:border-white/10 border-gray-200 overflow-x-auto">
          {['gallery', 'about-images', 'events', 'upcoming', 'hero', 'about'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 dark:text-purple-300/60 hover:text-purple-600'
              }`}
            >
              {tab === 'gallery' && 'Gallery Management'}
              {tab === 'about-images' && 'About Images'}
              {tab === 'events' && 'Past Activities'}
              {tab === 'upcoming' && 'Upcoming Events'}
              {tab === 'hero' && 'Hero Content'}
              {tab === 'about' && 'About Section'}
            </button>
          ))}
        </div>

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div>
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Gallery Management</h2>
                <p className="text-sm text-gray-600 dark:text-purple-200/60">Add, edit, or delete images and videos from your gallery</p>
              </div>
              <button
                onClick={() => setShowGalleryModal(true)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Add Item
              </button>
            </div>

            {galleryItems.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                    <circle cx="9" cy="9" r="2"></circle>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No gallery items yet</h3>
                <p className="text-gray-600 dark:text-purple-200/60">Add your first image or video to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {galleryItems.map((item) => {
                  const displayImageUrl = item.type === 'video' ? getVideoThumbnail(item.url) : item.url;
                  return (
                    <div key={item.id} className="rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/5 to-transparent group relative">
                      <div className="aspect-square relative">
                        {displayImageUrl ? (
                          <img src={displayImageUrl} alt={item.caption} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-purple-900/30 flex items-center justify-center">
                            <span className="text-gray-500">No image</span>
                          </div>
                        )}
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                          </button>
                          <button onClick={() => deleteItem(item.id, 'gallery')} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-red-500/80 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      {item.caption && <div className="p-3"><p className="text-sm font-medium text-gray-900 dark:text-white">{item.caption}</p></div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* About Images Tab */}
        {activeTab === 'about-images' && (
          <div>
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">About Section Images</h2>
                <p className="text-sm text-gray-600 dark:text-purple-200/60">Upload images specifically for the about section (separate from gallery)</p>
              </div>
              <button
                onClick={() => setShowAboutImageModal(true)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Add Image
              </button>
            </div>

            {aboutImages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                    <circle cx="9" cy="9" r="2"></circle>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No about images yet</h3>
                <p className="text-gray-600 dark:text-purple-200/60">Add images to showcase in the about section</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {aboutImages.map((item) => (
                  <div key={item.id} className="rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/5 to-transparent group relative">
                    <div className="aspect-square relative">
                      <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </button>
                        <button onClick={() => deleteItem(item.id, 'about-image')} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-red-500/80 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    {item.caption && <div className="p-3"><p className="text-sm font-medium text-gray-900 dark:text-white">{item.caption}</p></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Past Activities</h2>
                <p className="text-sm text-gray-600 dark:text-purple-200/60">Manage past events and activities</p>
              </div>
              <button
                onClick={() => setShowEventModal(true)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Add Event
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No past activities yet</h3>
                <p className="text-gray-600 dark:text-purple-200/60">Add your first event to showcase your ministry activities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={event.id} className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/5 to-transparent p-4 md:p-6 group flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <span className="font-mono text-sm text-gray-500 dark:text-purple-400/60">{String(index + 1).padStart(2, '0')}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{event.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-purple-300/50">
                        <span className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                            <line x1="16" x2="16" y1="2" y2="6"></line>
                            <line x1="8" x2="8" y1="2" y2="6"></line>
                            <line x1="3" x2="21" y1="10" y2="10"></line>
                          </svg>
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          {event.location}
                        </span>
                      </div>
                    </div>
                    <img src={event.image} alt={event.title} className="w-20 h-20 rounded-lg object-cover" />
                    <div className="flex gap-2">
                      <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-purple-50 dark:hover:bg-white/10 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                      <button onClick={() => deleteItem(event.id, 'event')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hover:stroke-red-600">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Events Tab */}
        {activeTab === 'upcoming' && (
          <div>
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Upcoming Events</h2>
                <p className="text-sm text-gray-600 dark:text-purple-200/60">Plan and manage upcoming events for the year</p>
              </div>
              <button
                onClick={() => setShowUpcomingModal(true)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Add Upcoming Event
              </button>
            </div>

            {landingContent.upcomingEvents.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No upcoming events yet</h3>
                <p className="text-gray-600 dark:text-purple-200/60">Plan your worship team's upcoming events and activities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {landingContent.upcomingEvents.map((event, index) => (
                  <div key={event.id} className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/5 to-transparent p-4 md:p-6 group flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <span className="font-mono text-sm text-gray-500 dark:text-purple-400/60">{String(index + 1).padStart(2, '0')}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{event.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-purple-300/50">
                        <span className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                            <line x1="16" x2="16" y1="2" y2="6"></line>
                            <line x1="8" x2="8" y1="2" y2="6"></line>
                            <line x1="3" x2="21" y1="10" y2="10"></line>
                          </svg>
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          {event.location}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-purple-50 dark:hover:bg-white/10 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                      <button onClick={() => deleteItem(event.id, 'upcoming')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hover:stroke-red-600">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'hero' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Hero Section Content</h2>
            <div className="max-w-3xl space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Hero Title</label>
                <input id="hero-title" type="text" defaultValue={landingContent.hero.title} className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Hero Description</label>
                <textarea id="hero-description" rows={4} defaultValue={landingContent.hero.description} className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <button onClick={saveHeroContent} disabled={isSaving} className="w-full px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600 transition-all disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">About Section Content</h2>
            <div className="max-w-3xl space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Section Title</label>
                <input id="about-title" type="text" defaultValue={landingContent.about.title} className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Content</label>
                <textarea id="about-content" rows={8} defaultValue={landingContent.about.content} className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <button onClick={saveAboutContent} disabled={isSaving} className="w-full px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600 transition-all disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-2xl bg-white dark:bg-[#0a0612] border dark:border-white/10 border-gray-200 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Gallery Item</h3>
              <button onClick={() => { setShowGalleryModal(false); setGalleryItemType('image'); setGalleryVideoUrl(''); }} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {/* Type Toggle */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => { setGalleryItemType('image'); setUploadFile(null); setGalleryVideoUrl(''); }}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    galleryItemType === 'image'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  📷 Image
                </button>
                <button
                  onClick={() => { setGalleryItemType('video'); setUploadFile(null); }}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    galleryItemType === 'video'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  🎥 Video
                </button>
              </div>

              {/* Image Upload Section */}
              {galleryItemType === 'image' && (
                <div className="border-2 border-dashed dark:border-white/20 border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer" onClick={() => document.getElementById('file-input')?.click()}>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-4 text-gray-400">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" x2="12" y1="3" y2="15"></line>
                  </svg>
                  <p className="text-sm text-gray-600 dark:text-purple-200/60">
                    {uploadFile ? uploadFile.name : 'Click to upload an image or drag and drop'}
                  </p>
                </div>
              )}

              {/* Video URL Section */}
              {galleryItemType === 'video' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Video URL</label>
                  <input
                    type="url"
                    value={galleryVideoUrl}
                    onChange={(e) => setGalleryVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
                    className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-purple-200/50 mt-1">Supports YouTube links and direct video URLs (MP4, WebM, etc.)</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Caption (Optional)</label>
                <input
                  type="text"
                  value={galleryCaption}
                  onChange={(e) => setGalleryCaption(e.target.value)}
                  placeholder={galleryItemType === 'image' ? "Sunday Service" : "Worship Time"}
                  className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setShowGalleryModal(false); setGalleryItemType('image'); setGalleryVideoUrl(''); }} className="flex-1 px-8 py-4 rounded-full border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button onClick={addGalleryItem} disabled={isLoading} className="flex-1 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600 transition-all disabled:opacity-50">
                  {isLoading ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-2xl bg-white dark:bg-[#0a0612] border dark:border-white/10 border-gray-200 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Past Activity</h3>
              <button onClick={() => setShowEventModal(false)} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Event Title</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Christmas Eve Candlelight Service"
                  className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Date</label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Main Sanctuary"
                  className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowEventModal(false)} className="flex-1 px-8 py-4 rounded-full border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button onClick={addEvent} className="flex-1 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600 transition-all">
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events Modal */}
      {showUpcomingModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-2xl bg-white dark:bg-[#0a0612] border dark:border-white/10 border-gray-200 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Upcoming Event</h3>
              <button onClick={() => setShowUpcomingModal(false)} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Event Image</label>
                <div className="relative">
                  {upcomingImagePreview ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border dark:border-white/10 border-gray-200">
                      <img src={upcomingImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          setUpcomingImageFile(null);
                          setUpcomingImagePreview('');
                          setUpcomingForm({ ...upcomingForm, image: '' });
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-48 border-2 border-dashed dark:border-white/10 border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2 text-gray-400">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <path d="m21 15-5-5L5 21"></path>
                        </svg>
                        <p className="text-sm text-gray-600 dark:text-purple-200/60">Click to upload image</p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleUpcomingImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Event Title</label>
                <input
                  type="text"
                  value={upcomingForm.title}
                  onChange={(e) => setUpcomingForm({ ...upcomingForm, title: e.target.value })}
                  placeholder="Easter Sunrise Service"
                  className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Date</label>
                <input
                  type="date"
                  value={upcomingForm.date}
                  onChange={(e) => setUpcomingForm({ ...upcomingForm, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Location</label>
                <input
                  type="text"
                  value={upcomingForm.location}
                  onChange={(e) => setUpcomingForm({ ...upcomingForm, location: e.target.value })}
                  placeholder="Church Grounds"
                  className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowUpcomingModal(false)} className="flex-1 px-8 py-4 rounded-full border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button onClick={addUpcomingEvent} className="flex-1 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600 transition-all">
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#0a0612] border dark:border-white/10 border-gray-200 p-6 md:p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Item?</h3>
            <p className="text-gray-600 dark:text-purple-200/60 mb-6">This action cannot be undone. Are you sure?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-8 py-4 rounded-full border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 px-8 py-4 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Image Modal */}
      {showAboutImageModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-2xl bg-white dark:bg-[#0a0612] border dark:border-white/10 border-gray-200 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add About Image</h3>
              <button onClick={() => setShowAboutImageModal(false)} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed dark:border-white/20 border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer" onClick={() => document.getElementById('about-image-input')?.click()}>
                <input
                  id="about-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAboutImageUpload}
                  className="hidden"
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-4 text-gray-400">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" x2="12" y1="3" y2="15"></line>
                </svg>
                <p className="text-sm text-gray-600 dark:text-purple-200/60">
                  {aboutImageFile ? aboutImageFile.name : 'Click to upload or drag and drop'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Caption (Optional)</label>
                <input
                  type="text"
                  value={aboutImageCaption}
                  onChange={(e) => setAboutImageCaption(e.target.value)}
                  placeholder="Team Worship"
                  className="w-full px-4 py-3 rounded-lg border dark:border-white/10 border-gray-200 text-gray-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAboutImageModal(false)} className="flex-1 px-8 py-4 rounded-full border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button onClick={addAboutImage} className="flex-1 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-500 hover:to-purple-600 transition-all">
                  Add Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

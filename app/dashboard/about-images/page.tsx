'use client';

import { useEffect, useState } from 'react';
import { Upload, Trash2, GripVertical, Plus } from 'lucide-react';

interface AboutImage {
  id: number;
  url: string;
  caption: string;
  order: number;
}

export default function AboutImagesManagement() {
  const [images, setImages] = useState<AboutImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [newCaption, setNewCaption] = useState('');

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    setIsDark(theme === 'dark');
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const res = await fetch('/api/about-images');
      if (res.ok) {
        const data = await res.json();
        setImages(data.items || []);
      }
    } catch (error) {
      console.error('Error loading about images:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCaption = (id: number, newCaption: string) => {
    setImages(images.map(img => 
      img.id === id ? { ...img, caption: newCaption } : img
    ));
  };

  const deleteImage = (id: number) => {
    setImages(images.filter(img => img.id !== id));
  };

  const addImage = () => {
    if (!newCaption.trim()) return;
    
    const newImage: AboutImage = {
      id: Math.max(...images.map(i => i.id), 0) + 1,
      url: 'https://via.placeholder.com/500x600?text=Upload+Image',
      caption: newCaption,
      order: images.length + 1,
    };
    setImages([...images, newImage]);
    setNewCaption('');
  };

  const saveChanges = async () => {
    try {
      const res = await fetch('/api/about-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: images }),
      });
      if (res.ok) {
        alert('About images updated successfully!');
      }
    } catch (error) {
      console.error('Error saving about images:', error);
      alert('Failed to save changes');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0612]' : 'bg-white'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className={isDark ? 'text-white' : 'text-black'}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 md:p-8 ${isDark ? 'bg-[#0a0612]' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
            About Section <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>Photos</span>
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage the photos displayed in the about section of your landing page
          </p>
        </div>

        {/* Add New Image */}
        <div className={`mb-8 p-6 rounded-xl border ${isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-300/30 bg-amber-100/10'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
            Add New Photo
          </h2>
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="text"
              placeholder="Enter photo caption..."
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
            />
            <button
              onClick={addImage}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
            >
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {images.map((image) => (
            <div
              key={image.id}
              className={`rounded-xl overflow-hidden border ${isDark ? 'border-amber-500/20 bg-gray-900' : 'border-amber-300/30 bg-gray-50'}`}
            >
              {/* Image Preview */}
              <div className="relative aspect-video bg-gray-800 overflow-hidden group">
                <img
                  src={image.url}
                  alt={image.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="cursor-pointer p-2 bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors">
                    <input type="file" accept="image/*" className="hidden" />
                    <Upload size={20} className="text-white" />
                  </label>
                </div>
              </div>

              {/* Caption Input */}
              <div className="p-4">
                <input
                  type="text"
                  value={image.caption}
                  onChange={(e) => updateCaption(image.id, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border mb-4 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
                  placeholder="Photo caption"
                />

                {/* Actions */}
                <div className="flex gap-2 items-center justify-between">
                  <div className="flex gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-200 text-amber-800'}`}>
                      Order: {image.order}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteImage(image.id)}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={saveChanges}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
          >
            Save Changes
          </button>
          <button
            onClick={loadImages}
            className={`px-8 py-3 rounded-lg font-semibold border transition-all ${isDark ? 'border-gray-700 text-white hover:bg-gray-800' : 'border-gray-300 text-black hover:bg-gray-100'}`}
          >
            Reload
          </button>
        </div>

        {images.length === 0 && (
          <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>No about images yet. Add your first photo above!</p>
          </div>
        )}
      </div>
    </div>
  );
}

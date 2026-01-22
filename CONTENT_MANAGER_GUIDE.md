# Content Manager Integration Guide

## Overview
The **Content Manager** is an admin-only dashboard feature that allows authorized administrators to manage all landing page content in real-time without editing code.

## Access
- **URL**: `/dashboard/content-management`
- **Requirements**: User must be logged in with `Admin` or `Leader` role
- **Authorization**: Automatically redirects to dashboard if user lacks permissions

## Managed Sections

### 1. **Hero Section** 📱
**Manages**: Landing page hero banner content
- **Title**: Main heading displayed on hero section
- **Description**: Hero description/subtitle text
- **Location on Landing Page**: Top banner section after navigation header
- **API Endpoint**: `/api/landing-content` (POST/GET)
- **Data File**: `data/landing-content.json` → `hero`

**How it syncs:**
```
Admin edits hero content → Saves to API → Updates JSON file → 
Landing page fetches on load → Hero content displays updated
```

---

### 2. **About Section** ℹ️
**Manages**: About Us section content
- **Title**: About section heading
- **Content**: Multi-line about text (supports line breaks)
- **Location on Landing Page**: "About Us" section with images
- **API Endpoint**: `/api/landing-content` (POST/GET)
- **Data File**: `data/landing-content.json` → `about`

**Features:**
- Rich text support (line breaks preserved)
- Multi-paragraph content support
- Real-time preview

---

### 3. **Gallery** 🖼️
**Manages**: Gallery images and videos
- **Upload**: Add new images/videos from local files
- **Caption**: Add descriptive text for each item
- **Type**: Automatically detects image or video
- **Location on Landing Page**: "Our Ministry in Action" section + About section featured images
- **API Endpoint**: `/api/gallery` (POST/GET/DELETE)
- **Data File**: `data/gallery.json`

**Features:**
- Drag & drop upload
- Image preview before save
- Delete functionality
- Video support with duration
- Caption management

**Sync Flow:**
```
Admin uploads image → Saves to /uploads/gallery/ → Creates gallery.json entry → 
Landing page fetches gallery items → Displays in gallery grid + about section
```

---

### 4. **Upcoming Events** 📅
**Manages**: Upcoming worship events displayed on landing page
- **Title**: Event name
- **Date**: Event date
- **Location**: Event venue
- **Image**: Event cover image (uploaded or URL)
- **Location on Landing Page**: "Upcoming Events" section
- **API Endpoint**: `/api/landing-content` (POST/GET/DELETE)
- **Data File**: `data/landing-content.json` → `upcomingEvents`

**Features:**
- Add multiple events
- Image upload or external URL
- Date picker
- Delete existing events
- Real-time display updates

**Sync Flow:**
```
Admin creates event → Saves to landing-content.json → 
Landing page fetches upcomingEvents → Displays in events section
```

---

### 5. **About Images (Separate)** 📸
**Manages**: Dedicated images for About section gallery stack
- **Location on Landing Page**: Layered image stack in About section
- **API Endpoint**: `/api/about-images` (POST/GET/PUT)
- **Data File**: `data/about-images.json`
- **Dashboard Access**: `/dashboard/about-images`

---

## Data Structure

### Hero Content
```json
{
  "hero": {
    "title": "UNITE YOUR\nWORSHIP TEAM",
    "description": "Coordinate schedules, share resources, and build community..."
  }
}
```

### About Content
```json
{
  "about": {
    "title": "Worship Team ADEPR Cyahafi - Serving with Excellence",
    "content": "We are the worship ministry of ADEPR Cyahafi, dedicated to leading our congregation..."
  }
}
```

### Upcoming Events
```json
{
  "upcomingEvents": [
    {
      "id": 1768745787133,
      "title": "Festival",
      "date": "2026-01-18",
      "location": "Dove Hotel",
      "image": "/uploads/gallery/filename.jpeg"
    }
  ]
}
```

### Gallery Items
```json
{
  "items": [
    {
      "id": 1234567890,
      "type": "image",
      "url": "/uploads/gallery/filename.jpeg",
      "caption": "Worship Team in Action",
      "duration": null
    },
    {
      "id": 1234567891,
      "type": "video",
      "url": "/uploads/gallery/video.mp4",
      "caption": "Live Worship Performance",
      "duration": "3:45"
    }
  ]
}
```

---

## API Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/landing-content` | GET | Fetch all landing content | `{ hero, about, events, upcomingEvents }` |
| `/api/landing-content` | POST | Save/update landing content | Updated content object |
| `/api/gallery` | GET | Fetch gallery items | `{ items: [...] }` |
| `/api/gallery` | POST | Upload new gallery item | `{ url, id }` |
| `/api/gallery` | DELETE | Delete gallery item | `{ success: true }` |
| `/api/about-images` | GET | Fetch about images | `{ items: [...] }` |
| `/api/about-images` | POST | Add about image | New image object |
| `/api/about-images` | PUT | Update about images | Updated items |

---

## Real-Time Sync Flow

```
┌─────────────────────────────────────────────────────────┐
│           ADMIN CONTENT MANAGER DASHBOARD                │
│   (app/dashboard/content-management/page.tsx)           │
└────────┬────────────────────────────────────────────────┘
         │ Admin edits & clicks "Save"
         ↓
┌─────────────────────────────────────────────────────────┐
│              API ENDPOINTS                               │
│   • /api/landing-content                                │
│   • /api/gallery                                        │
│   • /api/about-images                                   │
└────────┬────────────────────────────────────────────────┘
         │ Writes to JSON files
         ↓
┌─────────────────────────────────────────────────────────┐
│           DATA FILES (in /data/)                        │
│   • landing-content.json                                │
│   • gallery.json                                        │
│   • about-images.json                                   │
└────────┬────────────────────────────────────────────────┘
         │ Landing page fetches on load/refresh
         ↓
┌─────────────────────────────────────────────────────────┐
│         LANDING PAGE (app/landing/page.tsx)             │
│   Displays updated:                                      │
│   • Hero section                                        │
│   • About section                                       │
│   • Gallery grid                                        │
│   • Upcoming events                                     │
└─────────────────────────────────────────────────────────┘
```

---

## Key Features of Content Manager

✅ **Role-Based Access**: Only Admin/Leader can access
✅ **Real-Time Updates**: Changes appear on landing page immediately after refresh
✅ **Multiple Sections**: Manage hero, about, gallery, and events from one page
✅ **File Upload**: Direct image/video upload to server
✅ **Modals**: Clean UI with dedicated modals for each action
✅ **Preview**: See image previews before saving
✅ **Delete**: Remove items with confirmation
✅ **Dark/Light Theme**: Admin panel supports theme toggle
✅ **Error Handling**: User-friendly error messages
✅ **Responsive**: Works on desktop and tablets

---

## How Landing Page Fetches Content

### On Page Load
```typescript
// app/landing/page.tsx
const loadData = useCallback(async () => {
  const [galleryRes, contentRes, aboutRes] = await Promise.all([
    fetch('/api/gallery'),           // Get gallery items
    fetch('/api/landing-content'),   // Get hero, about, events
    fetch('/api/about-images'),      // Get about section images
  ]);
  // Updates displayed content
}, []);
```

### Content Updates
When admin saves changes in Content Manager:
1. Data is sent to API endpoint
2. API updates JSON file
3. User sees confirmation message
4. Landing page fetches fresh data on next visit/refresh
5. Updated content displays immediately

---

## Steps to Use Content Manager

### To Edit Hero Section:
1. Log in as Admin
2. Go to `/dashboard/content-management`
3. Select "Hero" tab
4. Edit title and description
5. Click "Save Hero Content"
6. Refresh landing page to see changes

### To Add Gallery Item:
1. Click "+ Add Gallery Item"
2. Upload image/video
3. Add caption
4. Click "Add Item"
5. Gallery refreshes with new item

### To Add Upcoming Event:
1. Click "+ Add Event"
2. Fill in title, date, location
3. Upload event image (optional)
4. Click "Add Event"
5. Event appears in "Upcoming Events" section

### To Edit About Section:
1. Select "About" tab
2. Edit title and content
3. Click "Save About Content"
4. Changes sync to landing page

---

## Troubleshooting

**Changes not appearing on landing page?**
- Refresh the landing page (`Ctrl+R` or `Cmd+R`)
- Check browser console for API errors
- Verify user has Admin/Leader role

**Upload failing?**
- Check file size (recommended: < 5MB)
- Verify file format (JPG, PNG, MP4)
- Check server has write access to `/uploads/gallery/`

**Can't access Content Manager?**
- Ensure you're logged in with Admin account
- Check user role in database (should be "Admin" or "Leader")
- Try logging out and back in

---

## Data Files Location
All content is stored in:
- `data/landing-content.json` - Hero, About, Events
- `data/gallery.json` - Gallery images/videos
- `data/about-images.json` - About section images
- `public/uploads/gallery/` - Uploaded media files

---

## Security Notes
✅ Content Manager requires Admin/Leader authentication
✅ All API endpoints check user authorization
✅ File uploads validated before saving
✅ JSON files have proper error handling
✅ No sensitive data exposed in responses

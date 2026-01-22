# 🎬 Complete Workflow - Content Manager ↔ Landing Page

## System Overview

```
                    ┌──────────────────────────┐
                    │   ADMIN DASHBOARD        │
                    │  (Authenticated Users)   │
                    └──────┬───────────────────┘
                           │
                    ┌──────▼───────────────────┐
                    │  CONTENT MANAGER PAGE    │
                    │  /dashboard/             │
                    │  content-management      │
                    └──────┬───────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼────┐  ┌──────┐ ┌─▼──────┐ ┌──────▼──┐
    │  Hero  │  │About │ │Gallery │ │ Events  │
    │Manager │  │Mgr   │ │Upload  │ │ Manager │
    └───┬────┘  └──┬───┘ └─┬──────┘ └──┬──────┘
        │          │       │           │
    ┌───▼──────────▼───────▼───────────▼─────┐
    │     API ENDPOINTS (Node.js Routes)     │
    │                                        │
    │  POST /api/landing-content            │
    │  GET  /api/landing-content            │
    │  POST /api/gallery                    │
    │  GET  /api/gallery                    │
    │  DELETE /api/gallery/:id              │
    └───┬──────────────────────────────────┘
        │
    ┌───▼────────────────────────────────┐
    │  JSON DATA FILES (Server Storage)   │
    │                                    │
    │  📄 data/landing-content.json      │
    │     ├─ hero                        │
    │     ├─ about                       │
    │     ├─ events                      │
    │     └─ upcomingEvents              │
    │                                    │
    │  📄 data/gallery.json              │
    │     └─ items[]                     │
    │                                    │
    │  📁 public/uploads/gallery/        │
    │     └─ (image files)               │
    └───┬────────────────────────────────┘
        │
    ┌───▼──────────────────────────────────┐
    │   LANDING PAGE (Public)               │
    │   /landing (page.tsx)                │
    │                                      │
    │   Fetches from APIs on load:         │
    │   • GET /api/landing-content         │
    │   • GET /api/gallery                 │
    │   • GET /api/about-images            │
    └───┬──────────────────────────────────┘
        │
    ┌───▼──────────────────────────────────┐
    │   RENDERED SECTIONS                  │
    │                                      │
    │  1️⃣  Hero Section (managed)          │
    │  2️⃣  About Section (managed)         │
    │  3️⃣  Gallery Grid (managed)          │
    │  4️⃣  Upcoming Events (managed)       │
    │  5️⃣  Social Links (static)           │
    │  6️⃣  Footer (static)                 │
    └──────────────────────────────────────┘
```

---

## 📝 Step-by-Step: Edit Hero Section

### Step 1: Admin Access
```
Admin User
  └─ Logs in with credentials
     └─ System verifies role (Admin/Leader)
        └─ Redirected to: /dashboard/content-management
```

### Step 2: Content Manager Page Loads
```
ContentManagement Component Mounts
  └─ useEffect runs authorization check
     ├─ Check: Is user logged in? ✓
     ├─ Check: Is user Admin/Leader? ✓
     └─ Call: loadData()
        └─ fetch('/api/landing-content')
           └─ Sets state with hero: { title, description }
```

### Step 3: Admin Edits Hero
```
User sees Hero Tab
  └─ Inputs appear with current values
     ├─ Title input field (shows current title)
     └─ Description textarea (shows current description)

Admin types new content
  └─ State updates in real-time
     └─ User clicks "Save Hero Content" button
```

### Step 4: Save to Backend
```
saveHeroContent() function executes
  ├─ Collect form values:
  │  ├─ heroTitle = input value
  │  └─ heroDesc = textarea value
  │
  ├─ Validation: Both fields filled? ✓
  │
  ├─ Create request body:
  │  {
  │    hero: { title: heroTitle, description: heroDesc },
  │    about: {...},
  │    events: [...],
  │    upcomingEvents: [...]
  │  }
  │
  └─ POST to /api/landing-content
     └─ API receives update
```

### Step 5: API Processes Update
```
/api/landing-content route.ts (POST)
  ├─ Parse request body
  ├─ Validate data
  ├─ Write to data/landing-content.json
  │  └─ File system updates file
  ├─ Return success response
  │  {
  │    hero: { title: newTitle, description: newDesc },
  │    ...
  │  }
  └─ Response sent to admin
```

### Step 6: Admin Confirmation
```
Admin sees success message:
  "Hero content saved successfully!"

Updated data:
  └─ Reflected in local state
     └─ Ready for next edit
```

### Step 7: Landing Page Shows Changes
```
User visits /landing

Landing Page Component Mounts
  └─ useEffect triggers loadData()
     └─ fetch('/api/landing-content')
        ├─ Gets hero: { title: newTitle, description: newDesc }
        ├─ Gets about: {...}
        ├─ Gets events: [...]
        └─ Gets upcomingEvents: [...]

Hero Section Renders
  ├─ Displays: newTitle (updated! ✓)
  ├─ Displays: newDesc (updated! ✓)
  └─ All other sections also updated
```

---

## 🖼️ Gallery Upload Flow

### Admin Uploads Image

```
Step 1: Admin clicks "+ Add Gallery Item"
  └─ Gallery Modal opens

Step 2: Select image file
  └─ handleFileUpload() triggered
     ├─ File stored in state: uploadFile
     ├─ Preview shown to admin
     └─ Admin adds caption: "Sunday Worship"

Step 3: Admin clicks "Add Item"
  └─ uploadToGallery() function executes
     ├─ Create FormData
     │  ├─ Append file
     │  └─ Append caption: "Sunday Worship"
     │
     ├─ POST to /api/gallery
     │  └─ File uploaded to server
     │
     ├─ API response includes:
     │  {
     │    id: 1234567890,
     │    url: "/uploads/gallery/1234567890.jpg",
     │    caption: "Sunday Worship",
     │    type: "image"
     │  }
     │
     └─ Add to gallery.json

Step 4: Success feedback
  └─ Modal closes
     └─ Gallery list refreshes
        └─ New image appears in list
```

### Gallery Shows in Landing Page

```
Gallery Section (/landing)
  ├─ fetch('/api/gallery')
  │  └─ Gets all items from gallery.json
  │
  └─ Render Gallery Grid
     ├─ Item 1: Admin's uploaded image
     │  └─ Shows caption: "Sunday Worship"
     │
     ├─ Item 2: Previous images...
     │
     └─ Lightbox interaction
        └─ Click image → opens fullscreen
           ├─ Arrow keys to navigate
           └─ ESC to close
```

---

## 📅 Event Creation Flow

### Admin Creates Event

```
Step 1: Admin clicks "+ Add Event"
  └─ Event Modal opens
     ├─ Title input
     ├─ Date picker
     ├─ Location input
     └─ Image upload (optional)

Step 2: Fill event details
  └─ Form state updates:
     {
       title: "Festival Night",
       date: "2026-02-15",
       location: "Main Sanctuary"
     }

Step 3: Upload event image
  └─ Image uploaded to server
     └─ URL stored: "/uploads/gallery/event-123.jpg"

Step 4: Submit event
  └─ addEvent() function executes
     ├─ Generate unique ID: 1768745787133
     ├─ Create event object:
     │  {
     │    id: 1768745787133,
     │    title: "Festival Night",
     │    date: "2026-02-15",
     │    location: "Main Sanctuary",
     │    image: "/uploads/gallery/event-123.jpg"
     │  }
     │
     ├─ Add to upcomingEvents array
     │
     ├─ POST to /api/landing-content
     │  └─ Updates landing-content.json
     │
     └─ Success message shown
```

### Event Appears on Landing Page

```
User visits /landing

Upcoming Events Section
  ├─ fetch('/api/landing-content')
  │  └─ Gets upcomingEvents array
  │
  ├─ Find newly created event:
  │  {
  │    title: "Festival Night",
  │    date: "Feb 15, 2026",
  │    location: "Main Sanctuary",
  │    image: <card displays image>
  │  }
  │
  └─ Render Event Card
     ├─ Event image at top
     ├─ Event title
     ├─ Date formatted nicely
     ├─ Location with icon
     └─ "Upcoming" badge
```

---

## 🔄 Data Synchronization Timeline

### Example: 2-Minute Update Cycle

```
00:00 - Admin opens Content Manager
        └─ Loads current hero from API

00:15 - Admin edits hero title
        └─ Types in input field
           └─ Local state updates

00:30 - Admin clicks "Save"
        └─ Sends POST to /api/landing-content
           └─ Server receives data

00:35 - Server updates landing-content.json
        └─ File written to disk
           └─ API returns success

00:40 - Admin sees success message
        └─ Update is live on server

01:00 - User visits /landing in new browser
        └─ Landing page component mounts
           └─ Calls fetch('/api/landing-content')
              └─ Gets updated hero data

01:05 - Landing page renders
        └─ Shows new hero title (updated ✓)
           └─ Shows new hero description (updated ✓)

01:10 - User sees the updated content live!
```

---

## 🔐 Authorization Flow

### Accessing Content Manager

```
User visits /dashboard/content-management

Page Loads
  └─ useEffect checks authorization
     ├─ Is user logged in?
     │  ├─ YES → Continue
     │  └─ NO → Redirect to /login
     │
     ├─ Get user role from auth provider
     │  ├─ Possible values: "Admin", "Leader", "Member"
     │  └─ Parse role (handle object or string)
     │
     ├─ Is user Admin OR Leader?
     │  ├─ YES → Grant access ✓
     │  │       └─ Load data
     │  │          └─ Show Content Manager
     │  │
     │  └─ NO → Deny access ✗
     │          └─ Redirect to /dashboard
     │             └─ Show permission denied message
     │
     └─ Set state: isAuthorized = true/false

Content Renders
  ├─ If authorized: Show Content Manager UI
  └─ If not authorized: Blank page (redirecting)
```

---

## 📊 Complete Data Lifecycle

### From Creation to Display

```
CREATION (Content Manager)
  ├─ Admin types content in form
  ├─ Form validation passes
  ├─ Data sent to API
  │
STORAGE (Server)
  ├─ API receives data
  ├─ Data validated
  ├─ JSON file updated
  ├─ File system stores persistently
  │
RETRIEVAL (Landing Page)
  ├─ Page loads
  ├─ API endpoints called
  ├─ Data fetched from JSON files
  ├─ Data passed to React components
  │
DISPLAY (User Browser)
  ├─ Components render with data
  ├─ Content displayed beautifully
  ├─ User sees live content
  └─ Responsive design adapts to screen
```

---

## ✨ Key Integration Points

1. **Auth Context** - Manages user authentication
2. **Content Manager Dashboard** - Admin interface for editing
3. **API Layer** - Handles CRUD operations
4. **JSON Data Files** - Persistent storage
5. **Landing Page** - Public display of managed content
6. **File Upload Handler** - Processes image/video uploads

---

## 🎯 Summary

✅ **Admins** use Content Manager to update landing page content
✅ **Changes** are automatically synced to JSON files
✅ **Users** visit landing page and see updated content
✅ **No code changes** required for content updates
✅ **Real-time updates** appear after page refresh
✅ **Role-based access** ensures only admins can manage
✅ **Persistent storage** keeps data safe and accessible

**Everything works together seamlessly! 🚀**

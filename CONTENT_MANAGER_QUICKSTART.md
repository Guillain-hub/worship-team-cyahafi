# 🎯 Content Manager - Quick Start Guide

## What is the Content Manager?
The **Content Manager** is an admin dashboard that lets administrators update the landing page content **without touching code**. All changes sync automatically to the live landing page.

---

## 🔐 Access Instructions

### Step 1: Log In
Go to `/login` and sign in with your **Admin** or **Leader** account.

### Step 2: Navigate to Content Manager
Once logged in, go to:
```
/dashboard/content-management
```

Or click the link in your admin dashboard.

---

## 📋 What You Can Manage

### 1. **Hero Section** (Top Banner)
- Edit the main title
- Edit the description text
- Changes appear instantly when users visit the landing page

**To update:**
1. Click the "Hero" tab
2. Edit the title and description fields
3. Click "Save Hero Content"

---

### 2. **About Section**
- Edit the "About Us" title
- Edit the about description
- Supports multi-line text

**To update:**
1. Click the "About" tab
2. Edit the title and content
3. Click "Save About Content"

---

### 3. **Gallery** (Images & Videos)
- Upload worship photos and videos
- Add captions to each item
- These appear in the "Our Ministry in Action" section
- Also used in the About section featured images

**To add an item:**
1. Click "+ Add Gallery Item"
2. Upload an image or video
3. Add a caption
4. Click "Add Item"

**To remove:**
- Find the item in the list
- Click the delete button (trash icon)
- Confirm deletion

---

### 4. **Upcoming Events**
- Add new events
- Set date and location
- Upload event image
- Events appear in "Upcoming Events" section

**To add an event:**
1. Click "+ Add Event"
2. Enter event title
3. Select date
4. Enter location
5. Upload event image (optional)
6. Click "Add Event"

**To remove:**
- Find the event in the list
- Click delete
- Confirm

---

## 🔄 How It Works

```
You Update Content in Manager
            ↓
Content Saves to Server
            ↓
Landing Page Fetches Updates
            ↓
Visitors See New Content
```

**Updates appear on the landing page automatically after a page refresh!**

---

## ✅ Quick Checklist

- [ ] You're logged in with Admin account
- [ ] You can see the Content Manager dashboard
- [ ] You can see tabs for Hero, About, Gallery, Events
- [ ] You can upload images
- [ ] You can edit text content
- [ ] Changes show a success message

---

## ❓ Common Questions

**Q: Do changes appear immediately?**
A: Changes save to the server immediately, but the landing page shows them after a refresh.

**Q: Can I upload any file?**
A: Yes, JPG, PNG, MP4 formats recommended. Max 5MB file size.

**Q: What if I make a mistake?**
A: You can edit or delete any content and save again.

**Q: Who can access this?**
A: Only users with Admin or Leader role.

**Q: Where are the files stored?**
A: All content is stored in `/data/landing-content.json` and `/data/gallery.json` on the server.

---

## 📞 Need Help?

If something doesn't work:
1. Make sure you're logged in as Admin
2. Try refreshing the page
3. Check if the file uploaded successfully
4. Look for error messages in the dashboard

---

## 🎓 Behind the Scenes

The Content Manager connects to these APIs:
- `/api/landing-content` - Manages hero, about, events
- `/api/gallery` - Manages gallery images/videos
- `/api/about-images` - Manages about section images

All data syncs in real-time between the Content Manager and Landing Page!

---

**You're all set! Start managing your landing page content now! 🚀**

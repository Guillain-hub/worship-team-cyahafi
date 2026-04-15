# ✅ Vercel File Upload Fix - Setup Guide

## Problem
Gallery and about-images uploads/deletions were failing on Vercel but working locally because the code used the ephemeral filesystem (`fs` module). Vercel clears the `/public` directory after each deployment.

## Solution
Changed APIs to use **Supabase Storage** (persistent) instead of the filesystem.

---

## Setup Steps

### 1. Get Your Supabase Service Role Key
This is required for server-side operations.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `cbvkqblrckxxckbbqgma`
3. Navigate to **Settings** → **API**
4. Copy the **Service Role Key** (marked as `service_role`)

### 2. Add Environment Variable to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `worship-team-cyahafi`
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Paste the key from step 1
   - **Environments:** Select `Production`, `Preview`, and `Development`
5. Click **Add** and **Save**

### 3. Create Supabase Tables and Storage Buckets

Run the SQL migrations in your Supabase database:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `SUPABASE_MIGRATIONS.sql` (in this repo)
6. Click **Run**

### 4. Verify Storage Buckets

1. Go to **Storage** in Supabase
2. Confirm you see two buckets:
   - `gallery` (for photos/videos)
   - `about-images` (for about section images)
3. Both should be **Public** (not private)

### 5. Redeploy on Vercel

1. Push your changes to GitHub
2. Vercel will auto-deploy
3. Test the content manager on your live site

---

## How It Works

### Before (Local only, fails on Vercel)
```
User uploads → fs.writeFile() → /public/uploads/gallery/ → ❌ Deleted on redeploy
```

### After (Works everywhere)
```
User uploads → Supabase Storage → /gallery/ → ✅ Persistent
             → Database → Supabase Tables → ✅ Queryable
```

---

## Environment Variables Checklist

Make sure these are set in Vercel:

- ✅ `NEXT_PUBLIC_SUPABASE_URL` (already set)
- ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (already set)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (newly added - required!)
- ✅ `DATABASE_URL` (already set)

---

## Troubleshooting

### "Storage bucket not found" error
→ Run the SQL migrations again (step 3)

### "Permission denied" on upload
→ Check storage bucket policies are set to public in Supabase

### "SUPABASE_SERVICE_ROLE_KEY not defined"
→ Add it to Vercel environment variables (step 2)

### "Table does not exist" error
→ Run SQL migrations (step 3)

---

## Files Changed

- `app/api/gallery/route.ts` — Uses Supabase Storage + Database
- `app/api/about-images/route.ts` — Uses Supabase Storage + Database  
- `SUPABASE_MIGRATIONS.sql` — Database schema (new)

---

## Testing Locally

Your local setup will continue to work because you already have `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local`. Just make sure you've run the migrations once.

Test by:
1. Running `npm run dev`
2. Going to the content manager
3. Uploading a test image
4. Deleting it
5. Both should work instantly now!

---

## Questions?

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs (go to Supabase Dashboard → Logs)
3. Verify all environment variables are correctly set

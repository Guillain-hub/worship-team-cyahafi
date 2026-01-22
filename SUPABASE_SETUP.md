# ✅ Supabase Setup Complete

## Environment Variables Added

Your `.env` file now has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cbvkqblrckxxckbbqgma.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_kdxLgJ-6uV1s3HQi6naSTQ_uO6-Bv63
DATABASE_URL=postgresql://... (requires password)
```

## ⚠️ IMPORTANT: Set Database Password

Your DATABASE_URL is incomplete. You need to add your Supabase database password:

### Step 1: Get Your Supabase Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Database**
4. Find your **Database Password** (or reset it if needed)
5. Copy the password

### Step 2: Update DATABASE_URL

Edit `.env` and replace `[YOUR_SUPABASE_PASSWORD]`:

```env
DATABASE_URL="postgresql://postgres.cbvkqblrckxxckbbqgma:[YOUR_SUPABASE_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

Example (don't use this):
```env
DATABASE_URL="postgresql://postgres.cbvkqblrckxxckbbqgma:MyPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

## 🚀 Next Steps

### 1. Install PostgreSQL Prisma Support

```bash
pnpm install @prisma/client prisma
```

(Already installed, but ensure it supports PostgreSQL)

### 2. Push Schema to Supabase

```bash
pnpm prisma db push
```

This creates all tables in your Supabase database.

### 3. Create Your Admin Account

```bash
node scripts/create-admin.js
```

Or use your setup API endpoint.

### 4. Test Connection

```bash
pnpm prisma studio
```

This opens Prisma Studio to view your database.

### 5. Deploy to Vercel

```bash
git add .
git commit -m "Setup Supabase PostgreSQL"
git push
```

### 6. Add Environment Variables to Vercel

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:
   ```
   DATABASE_URL = your-supabase-connection-string
   NEXT_PUBLIC_SUPABASE_URL = https://cbvkqblrckxxckbbqgma.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = sb_publishable_kdxLgJ-6uV1s3HQi6naSTQ_uO6-Bv63
   JWT_SECRET = your-strong-secret-key
   ```

3. Redeploy your project

## 📊 Supabase Project Info

| Item | Value |
|------|-------|
| **Project URL** | https://cbvkqblrckxxckbbqgma.supabase.co |
| **Region** | AWS (us-east-1) |
| **Database** | postgres |
| **Host** | aws-0-us-east-1.pooler.supabase.com |
| **Port** | 6543 |
| **Username** | postgres |
| **Password** | Get from Supabase Settings |

## 🔑 Your API Keys

```
Supabase URL: https://cbvkqblrckxxckbbqgma.supabase.co
Publishable Key: sb_publishable_kdxLgJ-6uV1s3HQi6naSTQ_uO6-Bv63
```

⚠️ **Keep your keys safe!** The publishable key is OK to share (it's public), but keep API keys secret.

## ✅ Benefits of Supabase

- ✅ **Data Persistence** - Your data stays on Vercel
- ✅ **Admin Stays Admin** - No loss of roles after deployment
- ✅ **Auto Backups** - Supabase backs up your database
- ✅ **Scalable** - Handles growth easily
- ✅ **Free Tier** - Generous free limits
- ✅ **Real-time** - Built-in real-time features
- ✅ **Authentication** - Built-in auth (if you want to migrate)

## 🔍 Verify Connection

Run this to test your database connection:

```bash
pnpm prisma db push
```

If successful, you'll see:
```
✓ Your database is now in sync with your Prisma schema.
```

## 🗄️ Database Management

### View Your Data

```bash
# Open Prisma Studio
pnpm prisma studio

# Opens http://localhost:5555 in browser
# View and manage all your data
```

### Access Supabase Dashboard

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** or **Table Editor**
4. View/manage your data directly

### Backup Your Data

Supabase automatically backs up your database. To download:

1. Go to Supabase Dashboard
2. Settings → Backups
3. Download your backup

## 🚨 Troubleshooting

### Error: "password authentication failed"
- Check your DATABASE_URL password is correct
- Reset password in Supabase Settings if needed

### Error: "Connection refused"
- Verify the host and port match Supabase connection string
- Check internet connection

### Tables not created?
- Run: `pnpm prisma db push`
- Check for migration errors

### Can't log in after deploying?
- Admin may have been lost during migration
- Run: `node scripts/create-admin.js` with DATABASE_URL set

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Prisma Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## ✨ You're All Set!

Your app is now:
- ✅ Connected to Supabase PostgreSQL
- ✅ Ready to deploy with persistent data
- ✅ Ready to maintain admin status after deployment

**Next:** Get your Supabase password and update `.env`, then run `pnpm prisma db push`! 🚀

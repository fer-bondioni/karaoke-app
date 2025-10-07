# 🚀 Quick Deploy to Vercel

This is the fastest way to get your karaoke app deployed from GitHub to Vercel.

## Prerequisites

Have these ready before starting:
- GitHub account
- Supabase project URL, anon key, and service role key
- YouTube Data API v3 key

## 5-Minute Deployment Steps

### 1️⃣ Push to GitHub (2 minutes)

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2️⃣ Deploy to Vercel (3 minutes)

1. **Go to [vercel.com/new](https://vercel.com/new)**

2. **Sign in with GitHub** (authorize if needed)

3. **Import your repository**
   - Find your karaoke app repository
   - Click "Import"

4. **Add Environment Variables** - Click "Environment Variables" and add:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_key_here
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

   **Note**: For `NEXT_PUBLIC_APP_URL`, use your Vercel URL (you'll get this after deployment). You can update it later.

5. **Click "Deploy"** 🎉

6. **Wait 2-3 minutes** for the build to complete

### 3️⃣ Post-Deployment (1 minute)

1. **Copy your Vercel URL** (e.g., `https://karaoke-app-xyz.vercel.app`)

2. **Update Environment Variable**:
   - Go to Project Settings → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
   - Click "Save"
   - Click "Redeploy" to apply changes

3. **Update Supabase**:
   - Go to Supabase dashboard
   - Settings → Authentication → URL Configuration
   - Set "Site URL" to your Vercel URL
   - Add to "Redirect URLs": `https://your-app.vercel.app/**`

### 4️⃣ Verify Deployment

Visit your app and check:
- ✅ App loads without errors
- ✅ Health check: `https://your-app.vercel.app/api/health`
- ✅ No console errors in browser DevTools

## 🎊 Done!

Your app is now live! Every time you push to the `main` branch, Vercel will automatically deploy the changes.

## Common Issues

**Build failed?**
- Check you added all environment variables in Vercel
- Verify the build works locally: `npm run build`

**App loads but doesn't work?**
- Check browser console for errors
- Verify environment variables are correct
- Make sure Supabase schema is applied

**Need more help?**
- See [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) for detailed checks
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive guide

---

**Next Steps:**
- Set up a custom domain in Vercel (optional)
- Enable Vercel Analytics for traffic insights
- Monitor application health via `/api/health` endpoint

# Pre-Deployment Checklist

Complete this checklist before pushing to GitHub and deploying to Vercel.

## ✅ Local Development

- [ ] **Application builds successfully**
  ```bash
  npm run build
  ```
  - Should complete without errors
  - Check for any TypeScript errors or warnings

- [ ] **Linting passes**
  ```bash
  npm run lint
  ```
  - No ESLint errors

- [ ] **Application runs locally**
  ```bash
  npm run dev
  ```
  - Open http://localhost:3000 and verify basic functionality
  - Check browser console for errors

## ✅ Environment Setup

### Supabase Configuration

- [ ] **Supabase project created**
  - Visit https://supabase.com and create project
  
- [ ] **Database schema applied**
  - Run `supabase-schema.sql` in Supabase SQL Editor
  - Verify all tables are created: `users`, `sessions`, `songs`, `queue_entries`, etc.
  
- [ ] **Row Level Security (RLS) enabled**
  - Check that RLS policies are active
  
- [ ] **Supabase credentials collected**
  - ✓ Project URL
  - ✓ Anon/Public Key
  - ✓ Service Role Key (keep secret!)

### YouTube API

- [ ] **YouTube Data API v3 enabled**
  - Visit https://console.cloud.google.com
  - Enable YouTube Data API v3
  
- [ ] **API Key created**
  - Create API credentials
  - Restrict to YouTube Data API v3 only
  - Set quota alerts (recommended: 10,000 daily)

### Environment Variables Ready

- [ ] All required environment variables documented:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  NEXT_PUBLIC_YOUTUBE_API_KEY=
  NEXT_PUBLIC_APP_URL=
  ```

## ✅ Code Repository

- [ ] **Git repository initialized**
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  ```

- [ ] **No sensitive files in repository**
  - Check that `.env.local` is NOT committed
  - Check that `.env` is NOT committed
  - Verify `.gitignore` is working properly
  ```bash
  git status
  ```

- [ ] **Repository pushed to GitHub**
  ```bash
  git remote add origin <your-github-repo-url>
  git branch -M main
  git push -u origin main
  ```

## ✅ Vercel Setup

- [ ] **Vercel account created**
  - Sign up at https://vercel.com with GitHub

- [ ] **Repository imported to Vercel**
  - Go to https://vercel.com/new
  - Import your GitHub repository
  - Vercel should auto-detect Next.js framework

- [ ] **Environment variables configured in Vercel**
  - Go to Project Settings → Environment Variables
  - Add all required variables (see Environment Variables Ready above)
  - Set for: Production, Preview, and Development
  - ⚠️ **IMPORTANT**: Set `NEXT_PUBLIC_APP_URL` to your Vercel URL after first deployment

- [ ] **Deploy settings verified**
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`
  - Development Command: `npm run dev`

## ✅ Post-Deployment

- [ ] **First deployment successful**
  - Check deployment logs for errors
  - Visit your Vercel URL

- [ ] **Update NEXT_PUBLIC_APP_URL**
  - Copy your Vercel production URL
  - Update `NEXT_PUBLIC_APP_URL` environment variable in Vercel
  - Redeploy if necessary

- [ ] **Configure Supabase for production**
  - Go to Supabase → Authentication → URL Configuration
  - Set "Site URL" to your Vercel URL
  - Add your Vercel URL to "Redirect URLs": `https://your-app.vercel.app/**`

- [ ] **Test health check endpoint**
  - Visit: `https://your-app.vercel.app/api/health`
  - Should return JSON with `status: "ok"`
  - Verify all environment variables show as `true`

- [ ] **Verify YouTube integration**
  - Test song search functionality
  - Ensure videos load properly

- [ ] **Test Supabase connection**
  - Create a test session
  - Verify database operations work

- [ ] **Check browser console**
  - Open DevTools
  - Look for any errors or warnings
  - Verify no 404s or failed API calls

## ✅ Security & Performance

- [ ] **Security headers active**
  - Use https://securityheaders.com to test
  - Should have A or A+ rating

- [ ] **SSL certificate active**
  - Vercel provides this automatically
  - Ensure https:// works

- [ ] **Images optimized**
  - YouTube thumbnails should load via Next.js Image component
  - Check Network tab for image format (should be WebP or AVIF)

- [ ] **Performance check**
  - Use Lighthouse in Chrome DevTools
  - Run performance audit
  - Aim for scores > 80

## ✅ Monitoring

- [ ] **Vercel Analytics enabled** (optional)
  - Go to Project → Analytics
  - Enable for traffic insights

- [ ] **Error tracking setup** (optional)
  - Consider Sentry or similar
  - Monitor production errors

## 🚨 Common Issues & Solutions

### Build Fails
- ✓ Check build logs in Vercel dashboard
- ✓ Ensure all environment variables are set
- ✓ Verify `npm run build` works locally

### App Loads but Features Don't Work
- ✓ Check browser console for errors
- ✓ Verify environment variables in Vercel
- ✓ Check Supabase connection
- ✓ Verify YouTube API key has quotas remaining

### Database Operations Fail
- ✓ Verify Supabase schema is applied
- ✓ Check RLS policies are correct
- ✓ Ensure Supabase URL and keys are correct

### API Calls Fail
- ✓ Check CORS settings in Supabase
- ✓ Verify API keys are active
- ✓ Check quota limits

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [YouTube API Docs](https://developers.google.com/youtube/v3)

---

✅ **Once all items are checked, you're ready to deploy!**

Run `npm run build` one final time, commit your changes, and push to GitHub. Vercel will automatically deploy your application.

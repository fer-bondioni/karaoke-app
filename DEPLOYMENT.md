# Deploying to Vercel

This guide will walk you through deploying your Karaoke App to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/docs/cli) installed (optional but recommended)
- Your Supabase project set up with the database schema
- A YouTube Data API v3 key

## Step 1: Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

## Step 2: Prepare Your Environment Variables

You'll need to set up the following environment variables in Vercel:

### Required Environment Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Get from: Supabase Project Settings → API → Project URL
   - Example: `https://xxxxxxxxxxxxx.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Get from: Supabase Project Settings → API → Project API keys → `anon` `public`
   - This is safe to expose in the browser

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Get from: Supabase Project Settings → API → Project API keys → `service_role` `secret`
   - ⚠️ **IMPORTANT**: Keep this secret! Only use server-side

4. **NEXT_PUBLIC_YOUTUBE_API_KEY**
   - Get from: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Enable YouTube Data API v3 for your project

5. **NEXT_PUBLIC_APP_URL**
   - Your production URL (e.g., `https://your-app.vercel.app`)
   - Update this after your first deployment

### Optional Environment Variables:

6. **SPOTIFY_CLIENT_ID** (for future features)
7. **SPOTIFY_CLIENT_SECRET** (for future features)

## Step 3: Deploy Using Vercel Dashboard

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Add New" → "Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Vercel will auto-detect Next.js settings
5. Click "Environment Variables" and add all the required variables listed above
6. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Navigate to your project directory:
   ```bash
   cd /Users/fernandobondioni/Sites/karaokeApp
   ```

3. Run the deployment:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? **karaoke-app** (or your preferred name)
   - In which directory is your code located? **./**
   - Want to override the settings? **N**

5. Add environment variables via CLI:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add NEXT_PUBLIC_YOUTUBE_API_KEY production
   vercel env add NEXT_PUBLIC_APP_URL production
   ```

   Or add them in the Vercel Dashboard: Project Settings → Environment Variables

6. Redeploy with environment variables:
   ```bash
   vercel --prod
   ```

## Step 4: Configure Supabase for Production

After deployment, update your Supabase settings:

1. Go to your Supabase project
2. Navigate to Authentication → URL Configuration
3. Add your Vercel URL to the "Site URL" field
4. Add your Vercel URL to the "Redirect URLs" list:
   - `https://your-app.vercel.app/**`

## Step 5: Update Environment Variables

After your first deployment:

1. Copy your production URL from Vercel
2. Update the `NEXT_PUBLIC_APP_URL` environment variable in Vercel to your production URL
3. Redeploy if necessary

## Step 6: Set Up Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Follow Vercel's instructions to configure DNS

## Continuous Deployment

Once connected to your Git repository, Vercel will automatically:

- Deploy every push to `main` branch to production
- Create preview deployments for pull requests
- Run build checks before deployment

## Troubleshooting

### Build Failures

If your build fails, check:

1. All environment variables are set correctly
2. No TypeScript errors: `npm run build` locally
3. Check build logs in Vercel dashboard

### Runtime Errors

1. Check function logs in Vercel dashboard
2. Verify Supabase connection
3. Ensure YouTube API key has proper permissions
4. Check CORS settings if API calls fail

### Environment Variables Not Working

1. Ensure `NEXT_PUBLIC_` prefix for client-side variables
2. Redeploy after adding new environment variables
3. Variables are only available after deployment completes

## Useful Vercel CLI Commands

```bash
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Pull environment variables locally
vercel env pull

# Remove a deployment
vercel remove [deployment-url]
```

## Security Checklist

- ✅ Never commit `.env.local` or `.env` files
- ✅ Service role key is only used server-side
- ✅ YouTube API key has usage quotas set
- ✅ Supabase Row Level Security (RLS) is enabled
- ✅ CORS is properly configured

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [YouTube Data API](https://developers.google.com/youtube/v3)

## Support

If you encounter any issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly

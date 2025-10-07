# 🎤 Karaoke Night

A collaborative karaoke app where users can create sessions, queue songs, challenge friends, and sing together in real-time!

## ✨ Features

- 🎵 **Song Search**: Search for karaoke songs using YouTube API with filters (genre, artist, year)
- 🎪 **Live Sessions**: Create or join karaoke sessions with unique shareable codes
- 📋 **Queue Management**: Real-time song queue with drag-and-drop reordering
- 🎯 **Challenges**: Challenge other users to sing specific songs
- 🤝 **Duets & Collaborations**: Invite others to sing together
- 😊 **Emoji Ratings**: Rate performances with fun emoji reactions
- 📺 **YouTube Player**: Embedded YouTube player for karaoke videos
- ⚡ **Real-time Updates**: Live synchronization across all users in a session

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Backend/Database**: Supabase (PostgreSQL + Realtime)
- **APIs**: YouTube Data API v3
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account ([sign up here](https://supabase.com))
- A YouTube Data API key ([get one here](https://console.cloud.google.com/apis/credentials))
- Git

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd karaokeApp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once created, go to **Settings > API** and copy:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep this secret!)
3. Go to the **SQL Editor** in your Supabase dashboard
4. Copy the contents of `supabase-schema.sql` and run it in the SQL Editor
5. This will create all necessary tables, indexes, and functions

### 4. Setup YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Go to **Credentials** and create an **API Key**
5. Restrict the key to only YouTube Data API v3 (recommended)

### 5. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deploying to Production

This app is optimized for deployment on Vercel. Follow these steps:

### Deploy from GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Sign in with GitHub
   - Click "Import Project"
   - Select your karaoke app repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**:
   In the Vercel project settings, add these environment variables:
   
   **Required Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `NEXT_PUBLIC_YOUTUBE_API_KEY` - Your YouTube Data API key
   - `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://your-app.vercel.app`)

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (2-3 minutes)
   - Your app will be live!

5. **Post-Deployment Setup**:
   - Copy your Vercel production URL
   - Update `NEXT_PUBLIC_APP_URL` environment variable in Vercel with your actual URL
   - Go to Supabase → Authentication → URL Configuration
   - Add your Vercel URL to "Site URL" and "Redirect URLs"
   - Redeploy if needed

### Continuous Deployment

Once connected, Vercel will automatically:
- ✅ Deploy every push to `main` branch
- ✅ Create preview deployments for pull requests
- ✅ Run build checks before deployment

### Deployment Checklist

Before deploying, ensure:
- [ ] All environment variables are set in Vercel
- [ ] Supabase database schema is applied
- [ ] YouTube API key has proper quotas
- [ ] `.env.local` is NOT committed to Git
- [ ] Build succeeds locally: `npm run build`
- [ ] No TypeScript errors: `npm run lint`

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📁 Project Structure

```
/src
  /app              # Next.js app router pages
  /components
    /ui             # shadcn/ui components
    /features       # Feature-specific components
  /lib
    /supabase       # Supabase client & realtime
    /utils          # Utility functions
  /stores           # Zustand stores
  /types            # TypeScript types
  /hooks            # Custom React hooks
```

## 🎯 Development Roadmap

- [x] Phase 1: Project Setup
- [x] Phase 2: Database Design
- [x] Phase 3: User Authentication & Session Management
- [x] Phase 4: Real-time Features & Core Functionality
  - [x] Real-time participant list
  - [x] YouTube song search integration
  - [x] Queue management with real-time updates
  - [x] Video player with YouTube IFrame API
  - [x] Auto-advance to next song
- [ ] Phase 5: Advanced Features (Next)
  - [ ] Challenges & Collaborations
  - [ ] Rating System with emoji reactions
  - [ ] Drag-and-drop queue reordering
- [ ] Phase 6: UI/UX Polish
- [ ] Phase 7: Testing & Deployment

**Status**: Phase 4 Complete! ✅ The app is now fully functional.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [shadcn/ui](https://ui.shadcn.com)
- [YouTube Data API](https://developers.google.com/youtube/v3)

---

Built with ❤️ and 🎤

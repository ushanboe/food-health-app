# FitFork PWA - Admin Documentation

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Stack:** Next.js 16.1.3, React, TypeScript, Tailwind CSS, Supabase

---

## 📱 App Overview

FitFork is a Progressive Web App (PWA) for food and health tracking featuring:
- AI-powered food analysis via camera
- Nutrition tracking and meal logging
- Weight and fitness goal management
- Cloud sync across devices
- Gamification (achievements, streaks, XP)

---

## 🎯 Main Features

| Feature | Location | Description |
|---------|----------|-------------|
| **Food Scanner** | `/` (Home) | AI camera analysis of food items |
| **Food Diary** | `/diary` | Daily meal logging and nutrition tracking |
| **Recipes** | `/recipes` | Recipe browser and meal planning |
| **Weight Tracker** | `/weight` | Weight logging and progress charts |
| **Goals** | `/goals` | Fitness and nutrition goal setting |
| **Profile** | `/profile` | User stats, settings, achievements |
| **Cloud Sync** | `/cloud-sync` | Supabase backup and multi-device sync |
| **Settings** | `/settings` | App preferences and configuration |

---

## ⚙️ Backend Configuration

### Supabase Setup

FitFork uses **Supabase** for authentication and cloud sync.

#### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API

#### 2. Database Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- User profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food diary entries
CREATE TABLE food_diary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER,
  protein REAL,
  carbs REAL,
  fat REAL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight entries
CREATE TABLE weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  weight REAL NOT NULL,
  unit TEXT DEFAULT 'kg',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  goal_type TEXT NOT NULL,
  target_value REAL,
  current_value REAL,
  unit TEXT,
  deadline DATE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved recipes
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  ingredients JSONB,
  instructions TEXT,
  nutrition JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own food_diary" ON food_diary FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own weight_entries" ON weight_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recipes" ON recipes FOR ALL USING (auth.uid() = user_id);
```

#### 3. Authentication Providers

In Supabase Dashboard → Authentication → Providers:

| Provider | Setup |
|----------|-------|
| **Email** | Enabled by default |
| **Google** | Add OAuth credentials from Google Cloud Console |
| **Apple** | Add credentials from Apple Developer Portal (optional) |

##### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

---

## 🔐 Environment Variables

### Local Development (`.env.local`)

```env
# Supabase (Optional - users can configure in-app)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Vision API (for food analysis)
OPENAI_API_KEY=sk-your-openai-key
# OR
GOOGLE_AI_API_KEY=your-google-ai-key

# Optional: Nutrition APIs
SPOONACULAR_API_KEY=your-spoonacular-key
NUTRITIONIX_APP_ID=your-app-id
NUTRITIONIX_API_KEY=your-api-key
```

### Production Deployment

Set these in your hosting platform (Vercel, Netlify, etc.):

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes* | For AI food analysis |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Default Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Default Supabase key |

*Either OpenAI or Google AI key required for food scanning

---

## 📂 Key Files & Structure

```
food-health-app/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home (Food Scanner)
│   ├── diary/             # Food Diary
│   ├── recipes/           # Recipe Browser
│   ├── weight/            # Weight Tracker
│   ├── goals/             # Goals Management
│   ├── profile/           # User Profile
│   ├── cloud-sync/        # Cloud Sync Settings
│   └── settings/          # App Settings
├── components/
│   ├── auth/              # Auth components (CloudSyncCard, etc.)
│   ├── BottomNav.tsx      # Navigation bar
│   └── ...                # UI components
├── contexts/
│   └── AuthContext.tsx    # Supabase auth provider
├── lib/
│   ├── store.ts           # Zustand state management
│   ├── supabase.ts        # Supabase client
│   ├── supabase-sync.ts   # Sync logic
│   ├── syncStatus.ts      # Sync history tracking
│   └── ai-vision.ts       # AI food analysis
└── public/
    └── sounds/            # Audio assets
```

---

## 🔄 Cloud Sync Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Supabase   │────▶│  Database   │
│ localStorage│◀────│    Auth     │◀────│   Tables    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │    performFullSync()          
       └───────────────────┘
```

**Sync Process:**
1. User logs in via Supabase Auth
2. `performFullSync()` compares local vs cloud timestamps
3. Newer data wins (bi-directional merge)
4. Sync history saved to localStorage

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Build

```bash
npm run build
npm start
```

---

## 🛠️ Admin Tasks

### Clear User Data (Browser Console)

```javascript
// Clear all local data
localStorage.clear();
location.reload();

// Clear only sync history
localStorage.removeItem('sync_history');
localStorage.removeItem('last_sync');
```

### Reset Supabase Connection

```javascript
localStorage.removeItem('supabase_url');
localStorage.removeItem('supabase_key');
location.reload();
```

---

## 📊 Monitoring

- **Supabase Dashboard:** Monitor auth, database, and API usage
- **Vercel Analytics:** Track performance and errors (if deployed on Vercel)
- **Browser DevTools:** Check localStorage and network requests

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not Connected" on Profile | Check if logged in AND Supabase configured |
| Sync errors | Clear sync_history, try again |
| Auth not working | Verify Supabase URL/Key in Cloud Sync settings |
| Google OAuth 500 | Check redirect URI in Google Console |
| Stale content | Delete `.next` folder, restart dev server |

---

## 📞 Support

For issues or questions, check:
1. Browser Console for errors
2. Supabase Dashboard logs
3. Network tab for failed requests

---

*Documentation generated for FitFork PWA v1.0.0*

# Strava Integration Setup Guide

## Overview

FitFork can sync your running, cycling, and swimming activities from Strava.
This guide walks you through setting up the Strava API connection.

---

## Step 1: Create a Strava API Application

1. **Log in to Strava** at [strava.com](https://www.strava.com)

2. **Go to API Settings**: [strava.com/settings/api](https://www.strava.com/settings/api)

3. **Create Your Application** with these details:

   | Field | Value |
   |-------|-------|
   | **Application Name** | FitFork (or your app name) |
   | **Category** | Health & Fitness |
   | **Club** | (leave blank) |
   | **Website** | Your app URL (e.g., `https://yourapp.vercel.app`) |
   | **Application Description** | Food and fitness tracking app |
   | **Authorization Callback Domain** | Your domain WITHOUT https:// (e.g., `yourapp.vercel.app` or `localhost`) |

4. **Click "Create"** and note your:
   - **Client ID** (a number like `123456`)
   - **Client Secret** (a long string like `abc123def456...`)

---

## Step 2: Configure Environment Variables

### For Local Development

Create or edit `.env.local` in your project root:

```env
# Strava API Credentials
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here

# App URL (for OAuth callback)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add these variables:

   | Name | Value |
   |------|-------|
   | `STRAVA_CLIENT_ID` | Your Client ID |
   | `STRAVA_CLIENT_SECRET` | Your Client Secret |
   | `NEXT_PUBLIC_APP_URL` | `https://yourapp.vercel.app` |

---

## Step 3: Update Strava Callback Domain

**Important:** The callback domain in Strava must match your app URL.

| Environment | Callback Domain |
|-------------|----------------|
| Local dev | `localhost` |
| Production | `yourapp.vercel.app` |
| ngrok | `your-tunnel.ngrok.io` |

To update: Go to [strava.com/settings/api](https://www.strava.com/settings/api) → Edit your app

---

## Step 4: Test the Connection

1. **Restart your dev server** (to load new env vars):
   ```bash
   npm run dev
   ```

2. **Open the app** and go to **Settings**

3. **Scroll to "Fitness Connections"** section

4. **Click "Connect" on Strava**

5. **Authorize** the app on Strava's page

6. **You should be redirected back** with a success message

---

## Troubleshooting

### "Provider not configured" error
- Environment variables not set or not loaded
- Restart the dev server after adding env vars
- Check for typos in variable names

### "Invalid redirect URI" error
- Callback domain in Strava doesn't match your app URL
- For localhost, use just `localhost` (not `localhost:3000`)
- For production, use your domain without `https://`

### "Access denied" error
- User cancelled the authorization
- Try connecting again

### No activities showing after connect
- Strava only syncs activities from the last 30 days by default
- Make sure you have recent activities in Strava
- Check the Fitness page for synced activities

---

## API Scopes

FitFork requests these Strava permissions:

| Scope | Purpose |
|-------|--------|
| `read` | Read public profile |
| `activity:read` | Read activity data |
| `activity:read_all` | Read all activities including private |

---

## Data Synced from Strava

| Data Type | Description |
|-----------|-------------|
| **Activities** | Running, cycling, swimming, workouts |
| **Duration** | Activity time in minutes |
| **Distance** | Distance in meters |
| **Calories** | Calories burned (estimated if not provided) |
| **Heart Rate** | Average and max HR (if available) |
| **Elevation** | Elevation gain |

---

## Rate Limits

Strava API has rate limits:
- **100 requests per 15 minutes**
- **1000 requests per day**

FitFork handles this by:
- Caching activity data
- Limiting sync to 150 activities per sync
- Showing rate limit errors gracefully

---

*For more info, see [Strava API Documentation](https://developers.strava.com/docs/)*

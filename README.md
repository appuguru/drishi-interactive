# AnimPMS — AI-Powered Animation Production Management System

> Upload a script → AI auto-generates your entire production dashboard → Manage everything with your team in real time.

---

## Table of Contents

1. [What is AnimPMS?](#1-what-is-animpms)
2. [One-Click Quick Start](#2-one-click-quick-start)
3. [Prerequisites](#3-prerequisites)
4. [Required API Keys Setup](#4-required-api-keys-setup)
   - 4.1 Clerk (Authentication)
   - 4.2 Supabase (Database + Realtime)
   - 4.3 OpenAI (AI Script Analysis)
5. [Database Setup (Supabase)](#5-database-setup-supabase)
6. [Environment Variables](#6-environment-variables)
7. [Running the App](#7-running-the-app)
8. [How to Use AnimPMS](#8-how-to-use-animpms)
9. [Deploying to Production](#9-deploying-to-production)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What is AnimPMS?

AnimPMS is a full-stack web application for animation and video production studios. Key capabilities:

| Feature | Description |
|---------|-------------|
| 🤖 AI Script Analysis | Upload TXT/PDF/DOCX → GPT-4o extracts scenes, topics, tasks |
| ✏️ Review Mode | Edit AI output before publishing the dashboard |
| 📋 Inline Editing | Click any text to edit instantly (Notion-style) |
| 🔄 Real-Time | Supabase WebSockets push updates to all viewers live |
| 🔗 Share Links | Shareable live manager dashboards (no login required for viewers) |
| 📊 Kanban + Analytics | Multiple views with Recharts analytics |
| 👥 Team Management | Add members, assign scenes, track workload |

---

## 2. One-Click Quick Start

### macOS / Linux

```bash
# 1. Extract the ZIP
unzip animpms.zip
cd animpms

# 2. Run install script
chmod +x install.sh
./install.sh
```

### Windows

```
1. Extract the ZIP
2. Double-click install.bat
   OR open terminal in folder and run:
   npm install
```

> **The script will:**
> - Install all npm packages
> - Create `.env.local` from the template
> - Print instructions for filling in your API keys
> - Start the dev server once keys are filled

---

## 3. Prerequisites

| Requirement | Version | Where to get it |
|-------------|---------|-----------------|
| Node.js | 20.x+ (18 minimum) | https://nodejs.org |
| npm | 10.x+ | Comes with Node.js |
| Git (optional) | Any | https://git-scm.com |

### Check your versions

```bash
node -v    # Should print v20.x.x or higher
npm -v     # Should print 10.x.x or higher
```

---

## 4. Required API Keys Setup

You need **4 free accounts** (all have generous free tiers):

---

### 4.1 Clerk (Authentication)

**Cost:** Free for up to 10,000 monthly active users

1. Go to **https://clerk.com** → Sign up
2. Click **"Add application"**
3. Name it `AnimPMS` → Choose **Email + Google** sign-in → Create
4. In your Clerk dashboard, go to **API Keys**
5. Copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`

---

### 4.2 Supabase (Database + Real-Time)

**Cost:** Free forever (up to 500MB database, unlimited realtime)

1. Go to **https://supabase.com** → Sign up
2. Click **"New project"**
3. Choose a name (e.g., `animpms`), set a database password, pick a region → **Create project** (takes ~2 minutes)
4. Once created, go to **Settings → API**
5. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (under "Service Role") → `SUPABASE_SERVICE_ROLE_KEY`

   > ⚠️ Keep `SUPABASE_SERVICE_ROLE_KEY` secret. Never expose it on the frontend.

---

### 4.3 OpenAI (AI Script Analysis)

**Cost:** Pay-per-use (~$0.01–0.05 per script analyzed with GPT-4o)

1. Go to **https://platform.openai.com** → Sign up / Log in
2. Go to **API Keys** → **Create new secret key**
3. Copy the key → `OPENAI_API_KEY`
4. Add a **payment method** in Billing (required even for free credits)

> 💡 Tip: Set a monthly spending limit in OpenAI billing to prevent surprises.

---

## 5. Database Setup (Supabase)

After creating your Supabase project:

### Option A — Run SQL directly (Recommended)

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy its entire contents and paste into the SQL editor
5. Click **"Run"** (green button)
6. You should see: `Success. No rows returned`

### Option B — Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project (get Project ID from supabase.com/dashboard)
supabase link --project-ref YOUR_PROJECT_ID

# Push migrations
supabase db push
```

### Enable Realtime

After running the SQL, enable Realtime for the required tables:

1. In Supabase dashboard → **Table Editor**
2. Click on the `scenes` table → **"Realtime"** toggle → Enable
3. Repeat for: `topics`, `tasks`, `activity_logs`, `comments`

> These are also enabled automatically by the SQL migration via `ALTER PUBLICATION`.

---

## 6. Environment Variables

After setup, your `.env.local` should look like this:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abc123...
CLERK_SECRET_KEY=sk_test_abc123...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AnimPMS
```

---

## 7. Running the App

### Development (local)

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

### Production build (test locally)

```bash
npm run build
npm start
```

### Common npm commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Check code for errors |

---

## 8. How to Use AnimPMS

### Step 1: Sign Up

- Go to `http://localhost:3000`
- Click **Sign Up** → create an account with email or Google
- You'll be redirected to your Dashboard

### Step 2: Create a New Project

1. Click **"+ New Project"** (top right on dashboard, or in sidebar)
2. Enter a **Project Title**
3. Click the upload area or drag a script file (`.txt`, `.pdf`, or `.docx`)
4. Click **"Analyze Script with AI"**
5. Watch the progress indicators as GPT-4o processes your script

### Step 3: AI Review Mode

After analysis completes, you'll see the **AI Review Mode** (side-by-side):

| Left Panel | Right Panel |
|-----------|-------------|
| Original script text | AI-generated structure |

**You can:**
- Click any **topic title** to rename it
- Click any **scene title** or description to edit
- Click **🗑 delete icon** to remove topics or scenes
- Click **"+ Add Scene"** inside a topic to add manually
- Click **"+ Add Topic"** at the bottom to add a new section

**When satisfied:**
1. Click **"Approve Structure"** (green button, top right)
2. Click **"Publish Dashboard"**
3. You'll be redirected to your full project dashboard

### Step 4: Manage Your Project

#### Views
| View | How to switch | What you see |
|------|---------------|--------------|
| **List** | Click "List" tab | All topics → scenes in a tree |
| **Kanban** | Click "Kanban" tab | Scenes as cards in status columns |
| **Analytics** | Click "Analytics" tab | Charts and progress stats |

#### Edit Scenes
- **Click any scene title** to rename it inline
- **Click the colored dot** (left of title) to change status
- **Drag the progress slider** to update completion %
- **Click the arrow icon** (→) to open scene detail with full editing:
  - Description, script text, deadline, priority
  - Tasks with checkboxes
  - Comments

#### Change Scene Status
Click the colored dot to the left of any scene name. Choose from:
- ⚪ Not Started → 🔵 In Progress → 🟣 Review → 🟠 Revision → 🟢 Completed → 🟦 Approved

#### Add Content
- **+ Add Topic** button (top toolbar)
- **+ Add Scene** at bottom of each topic
- Right-click any scene or topic for context menu options

### Step 5: Share with Managers

1. Click **"Share"** button (top right of project dashboard)
2. Choose access level:
   - **Private** — members only
   - **View Only** — anyone with link can view
   - **Can Comment** — view + add comments
   - **Can Edit** — full edit access
3. Click **"Copy"** to copy the shareable link
4. Send the link to your manager or client

The shared link works **without login** (for View Only). Managers see live updates automatically.

### Step 6: Team Management

1. Click **"Team"** button (top right)
2. Enter team member **name** and **email**
3. Select their **role** (Admin / Team Lead / Employee / Viewer)
4. Click **"Add"**

---

## 9. Deploying to Production

### Deploy to Vercel (Recommended — Free)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (from project folder)
vercel

# Follow prompts:
# - Link to existing project or create new
# - Framework: Next.js (auto-detected)
# - Build command: npm run build (auto-detected)
```

After deploy:
1. Go to your **Vercel project dashboard**
2. Go to **Settings → Environment Variables**
3. Add ALL variables from your `.env.local`
4. Change `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g., `https://animpms.vercel.app`)
5. **Redeploy** the project

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build first
npm run build

# Deploy
netlify deploy --prod --dir=.next
```

Add environment variables in Netlify: **Site Settings → Environment Variables**

### Update Clerk Callback URLs (Important for Production)

In your Clerk dashboard → **Domains**:
- Add your production domain (e.g., `https://animpms.vercel.app`)
- Update allowed redirect URLs

---

## 10. Troubleshooting

### "Module not found" or build errors

```bash
rm -rf node_modules .next
npm install
npm run dev
```

### "Invalid API Key" (OpenAI)

- Make sure `OPENAI_API_KEY` starts with `sk-`
- Verify you have billing set up at platform.openai.com
- Check you have GPT-4o access (may need to add payment method)

### "Cannot connect to database" (Supabase)

- Double-check `NEXT_PUBLIC_SUPABASE_URL` is exactly `https://YOURREF.supabase.co` (no trailing slash)
- Make sure you copied the `anon` key (not service_role) for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Run the SQL migration if you haven't yet

### "Unauthorized" on all API calls (Clerk)

- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_test_` or `pk_live_`
- Verify `CLERK_SECRET_KEY` starts with `sk_test_` or `sk_live_`
- Make sure both keys are from the **same Clerk application**

### Real-time not working

- In Supabase → **Table Editor** → Enable **Realtime** on: `scenes`, `topics`, `activity_logs`, `comments`
- Check browser console for WebSocket errors
- Make sure your Supabase project is on the free tier (not paused)

### AI analysis fails or returns empty

- Ensure the script file contains readable text (not a scanned image PDF)
- For PDFs, use a text-based PDF (not scanned)
- Try uploading a `.txt` version of the script
- Check your OpenAI account has available credits

### Port 3000 already in use

```bash
# Kill whatever is on port 3000
npx kill-port 3000
npm run dev

# Or use a different port
npm run dev -- -p 3001
```

---

## Support

If you run into issues:
1. Check the browser console (F12 → Console tab) for error messages
2. Check the terminal where `npm run dev` is running for server errors
3. Make sure all 4 API keys are correctly set in `.env.local`

---

*AnimPMS v1.0.0 — Built with Next.js 14, Supabase, Clerk, and OpenAI GPT-4o*

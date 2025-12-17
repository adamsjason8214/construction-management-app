# Quick Start Guide

## 1. Create GitHub Repository (Do This First!)

1. Go to https://github.com/new
2. Repository name: `construction-management-app`
3. Description: "Full-stack construction management app with React, Supabase, and Netlify"
4. Choose Public or Private
5. **Don't initialize with README** (we already have one)
6. Click **Create repository**

## 2. Push Your Code

```bash
cd ~/construction-management-app
git push -u origin main
```

Your repository will be at: https://github.com/adamsjason8214/construction-management-app

## 3. Set Up External Services (Before Deploying)

### A. Supabase (Database)

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Name: `construction-manager`
4. Database Password: Create a strong password
5. Region: Choose closest to you
6. Click **Create new project**
7. Wait 2-3 minutes for provisioning

**Run Database Schema:**
1. Go to **SQL Editor**
2. Click **New query**
3. Copy contents of `database/schema.sql`
4. Paste and click **Run**
5. Verify tables created in **Table Editor**

**Get API Keys:**
1. Go to **Settings** > **API**
2. Copy:
   - Project URL
   - `anon public` key
   - `service_role` key (keep secret!)

### B. Pusher Beams (Push Notifications)

1. Go to https://dashboard.pusher.com/beams
2. Click **Create new Beams instance**
3. Name: `construction-manager`
4. Click **Create**
5. Select **Web** platform
6. Copy:
   - Instance ID
   - Secret Key

### C. SendGrid (Email)

1. Go to https://app.sendgrid.com
2. Click **Settings** > **API Keys**
3. Click **Create API Key**
4. Name: `construction-manager`
5. Permissions: **Full Access**
6. Click **Create & View**
7. **Copy the key** (you won't see it again!)

**Verify Sender:**
1. Go to **Settings** > **Sender Authentication**
2. Click **Verify Single Sender**
3. Enter your email and details
4. Check your email and verify

**Create Email Templates:**
1. Go to **Email API** > **Dynamic Templates**
2. Click **Create a Dynamic Template**
3. Create these 5 templates:
   - Project Invitation
   - Task Assignment
   - Project Update
   - Daily Report
   - Deadline Reminder
4. For each template, click **Add Version** > **Blank Template**
5. Use the visual editor to create your email
6. Copy each Template ID

## 4. Install Dependencies

```bash
cd ~/construction-management-app
npm install
```

## 5. Configure Environment Variables

```bash
# Create .env file
cp .env.example .env

# Edit with your actual credentials
nano .env
```

Fill in all the values from step 3.

## 6. Test Locally

```bash
# Install Netlify CLI if not installed
npm install -g netlify-cli

# Run local development server
netlify dev
```

Visit http://localhost:8888 to test the app locally.

## 7. Deploy to Netlify

### Option A: Netlify Dashboard (Easiest)

1. Go to https://app.netlify.com
2. Click **Add new site** > **Import an existing project**
3. Choose **GitHub**
4. Select `adamsjason8214/construction-management-app`
5. Build settings are auto-detected from `netlify.toml`
6. Click **Deploy**

**Add Environment Variables:**
1. Go to **Site settings** > **Environment variables**
2. Click **Add a variable**
3. Add ALL variables from your `.env` file
4. Click **Save**
5. Trigger a new deploy: **Deploys** > **Trigger deploy** > **Deploy site**

### Option B: Netlify CLI

```bash
# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

## 8. Test Your Deployment

1. Visit your Netlify URL (e.g., https://your-site.netlify.app)
2. Click **Sign Up**
3. Create an admin or project_manager account
4. Test creating a project
5. Test adding team members

## 9. Custom Domain (Optional)

In Netlify dashboard:
1. Go to **Domain settings**
2. Click **Add custom domain**
3. Follow the instructions to configure DNS

## Troubleshooting

### Build Fails
- Check Netlify build logs
- Verify all environment variables are set
- Ensure `VITE_` prefix for frontend variables

### Database Connection Fails
- Verify Supabase URL and keys
- Check RLS policies are enabled
- Run schema.sql again if tables are missing

### Push Notifications Don't Work
- Verify Pusher Beams instance ID
- Check browser notification permissions
- Open browser console for errors

### Emails Not Sending
- Verify SendGrid API key
- Check sender email is verified
- Confirm template IDs are correct

## Next Development Steps

After deployment, you can continue building:

1. **Redux Slices** - State management
   - authSlice.js
   - projectsSlice.js
   - tasksSlice.js

2. **React Components**
   - Project list and cards
   - Task board (Kanban)
   - Daily logs
   - File upload

3. **File Management**
   - Netlify Blobs integration
   - Photo gallery for site photos
   - Document management

4. **Dashboard**
   - Analytics charts
   - Budget tracking
   - Timeline views

5. **SpaceX UI Theme**
   - Dark theme
   - Futuristic design
   - Mission control style

## Support Links

- **Your Plan**: `/Users/jasonadams/.claude/plans/virtual-baking-starlight.md`
- **Supabase Docs**: https://supabase.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Pusher Beams**: https://pusher.com/docs/beams
- **SendGrid**: https://docs.sendgrid.com

## Quick Commands Reference

```bash
# Development
npm run dev                  # Vite dev server (port 5173)
netlify dev                  # Netlify dev server with functions (port 8888)

# Build
npm run build               # Build for production
netlify deploy --prod       # Deploy to production

# Git
git status                  # Check status
git add .                   # Stage changes
git commit -m "message"     # Commit
git push                    # Push to GitHub

# Testing
npm test                    # Run tests
npm run lint                # Lint code
```

## Your GitHub Repository

https://github.com/adamsjason8214/construction-management-app

## Need Help?

Refer to the detailed `README_SETUP.md` file for more information.

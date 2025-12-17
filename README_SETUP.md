# Construction Management App - Setup Guide

A full-stack construction management application built with React, Supabase, and Netlify. Features include project management, task tracking, team collaboration, push notifications, email notifications, and file management.

## Tech Stack

- **Frontend**: React 19 + Tailwind CSS
- **State Management**: Redux Toolkit
- **Backend**: Netlify Functions (Serverless)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **File Storage**: Netlify Blobs
- **Push Notifications**: Pusher Beams
- **Email**: SendGrid
- **Deployment**: Netlify

## Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (free tier)
- Netlify account (free tier)
- Pusher Beams account (free tier)
- SendGrid account (free tier)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to **Settings** > **API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (keep this secure!)

4. Go to **SQL Editor** and run the database schema:
   - Copy the contents of `/database/schema.sql`
   - Paste and execute in the SQL Editor
   - This creates all tables, indexes, RLS policies, and triggers

5. Verify the tables were created:
   - Go to **Table Editor** and you should see:
     - profiles
     - projects
     - project_members
     - tasks
     - daily_logs
     - project_files
     - notifications

### 3. Set Up Pusher Beams

1. Go to [pusher.com/beams](https://pusher.com/beams) and create an account
2. Create a new Beams instance
3. Select **Web** as your platform
4. Copy the **Instance ID** and **Secret Key**

### 4. Set Up SendGrid

1. Go to [sendgrid.com](https://sendgrid.com) and create an account
2. Create an API key with full access
3. Verify a sender email address (Settings > Sender Authentication)
4. Create email templates (Marketing > Dynamic Templates):
   - **Project Invitation Template**
   - **Task Assignment Template**
   - **Project Update Template**
   - **Daily Report Template**
   - **Deadline Reminder Template**
5. Copy each template ID

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Pusher Beams
VITE_PUSHER_INSTANCE_ID=your-instance-id
PUSHER_SECRET_KEY=your-secret-key

# SendGrid
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_TEMPLATE_ID_PROJECT_INVITE=d-xxx
SENDGRID_TEMPLATE_ID_TASK_ASSIGNED=d-xxx
SENDGRID_TEMPLATE_ID_PROJECT_UPDATE=d-xxx
SENDGRID_TEMPLATE_ID_DAILY_REPORT=d-xxx
SENDGRID_TEMPLATE_ID_DEADLINE_REMINDER=d-xxx

# App
VITE_API_URL=http://localhost:8888
```

### 6. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

For Netlify Functions locally:

```bash
netlify dev
```

This starts both the frontend and serverless functions.

### 7. Deploy to Netlify

#### Option A: Connect GitHub Repository

1. Push your code to GitHub:
   ```bash
   git remote remove origin
   git remote add origin https://github.com/YOUR_USERNAME/construction-management-app.git
   git push -u origin main
   ```

2. Go to [netlify.com](https://netlify.com) and create a new site
3. Click **Import from Git** and select your repository
4. Build settings are already configured in `netlify.toml`
5. Click **Deploy**

#### Option B: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### 8. Configure Netlify Environment Variables

In your Netlify dashboard:

1. Go to **Site settings** > **Environment variables**
2. Add all environment variables from your `.env` file
3. Make sure to add BOTH frontend (VITE_*) and backend variables

### 9. Create Your First User

Once deployed, visit your site and sign up:

1. Click **Sign Up**
2. Enter your details
3. Select your role (admin, project_manager, contractor, or worker)
4. You're ready to go!

## Project Structure

```
construction-management-app/
├── database/
│   └── schema.sql              # Database schema and RLS policies
├── netlify/
│   └── functions/              # Serverless backend functions
│       ├── auth/               # Authentication endpoints
│       ├── projects/           # Project management endpoints
│       ├── tasks/              # Task management endpoints
│       ├── files/              # File upload/download
│       ├── notifications/      # Notification endpoints
│       ├── pusher/             # Pusher Beams auth
│       └── utils/              # Shared utilities
├── src/
│   ├── components/             # React components
│   ├── features/               # Redux slices
│   ├── lib/                    # Client libraries (Supabase, Pusher)
│   ├── pages/                  # Page components
│   └── App.jsx                 # Main app component
├── netlify.toml                # Netlify configuration
├── package.json                # Dependencies and scripts
└── README_SETUP.md             # This file
```

## Key Features

### User Roles

- **Admin**: Full system access
- **Project Manager**: Create projects, manage teams
- **Contractor**: Manage assigned tasks, upload files
- **Worker**: View tasks, update status

### Project Management

- Create construction projects with location, budget, and timeline
- Track project status (planning, active, on_hold, completed, cancelled)
- Monitor budget vs actual costs
- Add team members with specific roles

### Task Management

- Create tasks with priorities and dependencies
- Assign tasks to team members
- Track estimated vs actual hours
- Monitor task status and progress

### Notifications

- **Push Notifications**: Real-time browser notifications (Pusher Beams)
- **Email Notifications**: SendGrid templates for key events
- **In-App Notifications**: Notification center with history

### File Management

- Upload construction site photos
- Store documents, blueprints, and reports
- Organize files by category
- Link files to projects, tasks, or daily logs

### Daily Logs

- Record daily construction activities
- Track weather, crew count, and equipment
- Document work completed and issues
- Add safety notes

## Development Workflow

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
```

### Deploying Functions

```bash
npm run functions:build
```

## Troubleshooting

### Database Connection Issues

- Verify Supabase URL and keys are correct
- Check if RLS policies are enabled
- Ensure user has proper role assigned

### Push Notifications Not Working

- Verify Pusher Beams instance ID is correct
- Check browser notification permissions
- Ensure service worker is registered

### Email Not Sending

- Verify SendGrid API key has full access
- Check sender email is verified
- Confirm template IDs are correct

### Netlify Functions Errors

- Check Netlify function logs in dashboard
- Verify environment variables are set
- Ensure dependencies are in `devDependencies` for backend packages

## Next Steps

1. Customize the UI to match your branding
2. Add more notification templates in SendGrid
3. Implement file upload functionality (see plan)
4. Add Redux slices for state management
5. Create React components for projects and tasks
6. Apply SpaceX-inspired UI theme (Phase 11 in plan)

## Support

For issues and questions, refer to:
- `/Users/jasonadams/.claude/plans/virtual-baking-starlight.md` - Full implementation plan
- [Supabase Docs](https://supabase.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Pusher Beams Docs](https://pusher.com/docs/beams)
- [SendGrid Docs](https://docs.sendgrid.com)

## License

MIT

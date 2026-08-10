# Polling App

A modern polling web application built with Next.js, TypeScript, Tailwind CSS, Supabase, and shadcn/ui components.

## Features

- **User Authentication**: Secure login and signup with Supabase Auth
- **Role-Based Access**: Admin and user roles with protected routes
- **Poll Creation**: Admins can create single or multiple choice polls
- **File Attachments**: Support for image and text file attachments in polls
- **Voting System**: Users can vote on polls with real-time results
- **Poll Management**: Admins can manage, activate/deactivate, and delete polls
- **Responsive Design**: Beautiful UI built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd polling-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project settings → API
3. Copy the following credentials:
   - Project URL
   - anon/public API key

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Set Up Database Schema

1. Go to your Supabase project → SQL Editor
2. Run the SQL script from `supabase/schema.sql`
3. Run the storage setup script from `supabase/storage.sql`

### 6. Create Storage Bucket

1. Go to your Supabase project → Storage
2. Create a new bucket named `poll-files`
3. Make it public
4. The storage policies will be automatically applied by the SQL script

### 7. Set Up Admin User

After running the schema, new users will default to the 'user' role. To create an admin:

1. Sign up through the app at `/signup`
2. Go to Supabase → Table Editor → user_roles table
3. Update your user's role to 'admin'

```sql
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = 'your_user_id';
```

### 8. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
polling-app/
├── app/
│   ├── admin/
│   │   ├── create-poll/    # Admin poll creation page
│   │   └── polls/          # Admin poll management page
│   ├── dashboard/          # User dashboard with poll listing
│   ├── login/              # Login page
│   ├── polls/[id]/         # Individual poll voting page
│   ├── signup/             # Signup page
│   ├── layout.tsx          # Root layout with AuthProvider
│   └── page.tsx            # Landing page
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── auth.tsx            # Authentication context
│   ├── supabase.ts         # Supabase client
│   └── supabase/
│       └── server.ts       # Server-side Supabase client
├── supabase/
│   ├── schema.sql          # Database schema
│   └── storage.sql         # Storage policies
└── middleware.ts           # Route protection middleware
```

## Database Schema

### Tables

- **user_roles**: Stores user roles (admin/user)
- **polls**: Stores poll information including attachments
- **poll_options**: Stores poll options
- **votes**: Stores user votes with uniqueness constraints

### Security

- Row Level Security (RLS) enabled on all tables
- Admin-only access for poll creation and management
- Public read access for active polls
- Users can only vote once per poll

## API Routes

The app uses Supabase client directly from the frontend for simplicity. For production, consider moving sensitive operations to API routes.

## Authentication Flow

1. Users sign up/login via Supabase Auth
2. Middleware protects routes based on authentication status
3. User roles are stored in the `user_roles` table
4. Admin-only routes check user role before access

## File Upload

- Files are stored in Supabase Storage
- Supported formats: Images (JPG, PNG, GIF), Text files (TXT, PDF)
- Maximum file size: 50MB (Supabase default)
- Public access for viewing attached files

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Ensure you add the environment variables to your hosting platform's configuration.

## Development

### Adding New shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

### Database Migrations

For schema changes:
1. Update `supabase/schema.sql`
2. Run the new SQL in Supabase SQL Editor
3. Consider using Supabase migrations for production

## Troubleshooting

### Authentication Issues

- Check that environment variables are set correctly
- Verify Supabase project is active
- Check browser console for errors

### File Upload Issues

- Ensure storage bucket exists and is public
- Check storage policies in Supabase
- Verify file size limits

### Database Issues

- Run the schema SQL in Supabase SQL Editor
- Check RLS policies are enabled
- Verify user roles are set correctly

## License

This project is open source and available under the MIT License.

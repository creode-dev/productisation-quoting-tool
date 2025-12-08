# Database Setup

This guide explains how to set up and initialize the database for the application.

## Prerequisites

1. Vercel account
2. Vercel Postgres database

## Database Creation

1. In Vercel Dashboard, go to your project
2. Navigate to "Storage" → "Create Database" → "Postgres"
3. Create a new Postgres database
4. The `DATABASE_URL` will be automatically added to your environment variables

## Environment Variables

- `DATABASE_URL` - Vercel Postgres connection string (automatically provided when you create a Postgres database)

## Initialize Database Schema

After deploying, call the initialization endpoint once:

```bash
curl https://your-domain.vercel.app/api/init-db
```

Or visit the URL in your browser. This will create all required tables with the proper schema.

**Note:** This only needs to be done once. Running it multiple times is safe (it uses `CREATE TABLE IF NOT EXISTS`).

### Local Development

1. Make sure you have Vercel CLI installed:
   ```bash
   npm install -g vercel
   ```

2. Start the Vercel dev server:
   ```bash
   npx vercel dev --listen 3001
   ```

3. In a new terminal, call the initialization endpoint:
   ```bash
   curl http://localhost:3001/api/init-db
   ```

   Or visit in your browser: `http://localhost:3001/api/init-db`

   You should see: `{"success":true,"message":"Database initialized successfully"}`

## Database Tables

The initialization creates the following tables:

- `quotes` - Stores quote information
- `employees` - Stores employee profiles
- `teams` - Stores team information
- `holidays` - Stores holiday requests
- `documents` - Stores document metadata

## Troubleshooting

### Database Initialization Fails
- **Error:** "Database initialization error"
- **Solution:** 
  - Check that `DATABASE_URL` is set correctly
  - Verify you have a Vercel Postgres database created
  - Check database connection in Vercel dashboard
  - Ensure the database is accessible from your deployment

### Connection Issues
- Verify `DATABASE_URL` is set correctly in your environment variables
- Check that the database is not paused or deleted
- Review Vercel Postgres connection logs in the dashboard





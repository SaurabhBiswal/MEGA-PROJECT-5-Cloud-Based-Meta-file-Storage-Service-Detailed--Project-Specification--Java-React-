# 🚀 CloudBox Deployment Guide

## Environment Variables Required

When deploying to Render.com, you'll need to set these environment variables.

**⚠️ IMPORTANT:** Get the actual values from your local `application.properties` file or contact the project owner.

### Required Variables:

```
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=<Your Supabase PostgreSQL URL>
SPRING_DATASOURCE_USERNAME=<Your Supabase Username>
SPRING_DATASOURCE_PASSWORD=<Your Supabase Password>
SUPABASE_URL=<Your Supabase Project URL>
SUPABASE_SERVICE_ROLE_KEY=<Your Supabase Service Role Key>
SPRING_MAIL_USERNAME=<Your Gmail Address>
SPRING_MAIL_PASSWORD=<Your Gmail App Password>
GOOGLE_CLIENT_ID=<Your Google OAuth Client ID>
GOOGLE_CLIENT_SECRET=<Your Google OAuth Client Secret>
JWT_SECRET=<Generate a strong random 256-bit key>
```

### Where to Find Values:

1. **Supabase Credentials:** https://supabase.com/dashboard → Your Project → Settings → Database
2. **Gmail App Password:** https://myaccount.google.com/apppasswords
3. **Google OAuth:** https://console.cloud.google.com → APIs & Services → Credentials

### Deployment Steps:

1. Deploy backend to Render.com
2. Deploy frontend to Vercel
3. Update CORS settings
4. Update Google OAuth redirect URIs

See `deployment_walkthrough.md` for detailed instructions.

# NNIT AI Freelancer Backend — Railway Deployment Guide

## Quick Deploy to Railway

### Step 1: Connect Repository

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Authorize and select your repo containing this code

### Step 2: Set Environment Variables

In Railway dashboard:

1. Go to **"Variables"** tab
2. Add these variables:

   ```
   STRIPE_SECRET_KEY=mk_1SXIi7CLNKBevI0IiROBqncU
   STRIPE_PUBLISHABLE_KEY=mk_1SXBgcCLNKBevI0Irq7y2RdF
   OPENAI_API_KEY='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'

   PORT=5000 (Railway auto-assigns, optional)
   ```

### Step 3: Deploy

1. Railway auto-detects `package.json`
2. Runs `npm install && npm start`
3. Your app deploys automatically!

### Step 4: Get Your Live URL

- Check Railway dashboard for your public URL
- Example: `https://your-app-name.railway.app`
- Update Stripe webhook & checkout URLs to this domain

## Local Testing Before Deploy

```powershell
cd C:\Users\netwo\ai-freelance-backend
npm install
npm start
# Visit http://localhost:5000
```

## Docker Build (if needed)

```powershell
docker build -t nnit-freelancer .
docker run -p 5000:5000 --env-file .env nnit-freelancer
```

## Troubleshooting

**App crashes after deploy?**

- Check Railway logs: Dashboard → Logs tab
- Verify all env vars are set
- Ensure `package.json` has `"start": "node server.js"`

**Database not persisting?**

- SQLite (freelance.db) uses container filesystem (ephemeral)
- For production, migrate to PostgreSQL on Railway
- Railway provides free PostgreSQL service

**Stripe webhook failing?**

- Update Stripe dashboard with new domain URL
- Add webhook endpoint: `https://your-domain/webhook`

## Upgrade to PostgreSQL (Optional)

1. In Railway, click **"Create"**
2. Select **"PostgreSQL"**
3. Update `server.js` to use `pg` instead of `sqlite3`
4. Set `DATABASE_URL` environment variable

## Performance Tips

- Enable Railway auto-scaling for traffic spikes
- Set up CDN for static files (public folder)
- Monitor API response times in Railway dashboard

## Support

- Railway Docs: <https://docs.railway.app>
- Network Nice IT Tec Support

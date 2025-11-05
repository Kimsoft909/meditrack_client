# Deploying MEDITRACK API to Render

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **API Keys**: Have your GROK_API_KEY and HUGGINGFACE_API_KEY ready

## Deployment Steps

### 1. Prepare Your Repository

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Update CORS Origins

After deployment, update the `CORS_ORIGINS` environment variable in Render dashboard with your actual frontend URL.

### 3. Deploy to Render

#### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`
5. Review the services (API, PostgreSQL, Redis)
6. Click **"Apply"**

#### Option B: Manual Setup

If you prefer manual setup:

1. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Name: `meditrack-postgres`
   - Database: `meditrack_db`
   - User: `meditrack_user`
   - Region: Oregon (or closest to you)
   - Plan: Starter

2. **Create Redis Instance**
   - New → Redis
   - Name: `meditrack-redis`
   - Region: Same as PostgreSQL
   - Plan: Starter

3. **Create Web Service**
   - New → Web Service
   - Connect your repository
   - Root Directory: `meditrack_api`
   - Environment: Python 3
   - Build Command: 
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt && alembic upgrade head
     ```
   - Start Command:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2
     ```

### 4. Configure Environment Variables

In the Render dashboard for your web service, add these secret environment variables:

```
GROK_API_KEY=your_grok_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_key_here
```

The `render.yaml` will auto-configure:
- DATABASE_URL (from PostgreSQL service)
- REDIS_URL (from Redis service)
- SECRET_KEY (auto-generated)
- JWT_SECRET_KEY (auto-generated)

### 5. Update Frontend Configuration

Once deployed, update your frontend's API base URL:

**In your `.env.production` file:**
```
VITE_API_BASE_URL=https://meditrack-api.onrender.com
```

**Update CORS_ORIGINS in Render:**
```
https://your-frontend-app.onrender.com,https://yourdomain.com
```

### 6. Verify Deployment

1. **Health Check**: Visit `https://your-app.onrender.com/health`
2. **API Docs**: Visit `https://your-app.onrender.com/docs`
3. **Database**: Check logs to confirm migrations ran successfully

## Post-Deployment

### Monitor Your Application

- **Logs**: Render Dashboard → Your Service → Logs
- **Metrics**: Monitor response times and error rates
- **Health Checks**: Render automatically monitors `/health` endpoint

### Database Migrations

Migrations run automatically on deployment via `alembic upgrade head` in the build command.

To run manual migrations:
```bash
# In Render Shell
cd meditrack_api
alembic upgrade head
```

### Scaling

**Free Tier Limitations:**
- Web service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30-60 seconds

**Upgrade to Starter Plan ($7/month) for:**
- No spin-down
- Better performance
- More resources

**Horizontal Scaling:**
Edit `render.yaml` and increase workers:
```yaml
startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
```

### Backup Strategy

**Database Backups (PostgreSQL):**
- Render automatically backs up databases on paid plans
- Free tier: Manual backups via pg_dump

**Manual Backup:**
```bash
# From Render Shell
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Build Fails

**Check requirements.txt:**
- Ensure all dependencies are listed
- Pin versions for stability

**Check Python version:**
- Render uses Python 3.11 by default
- Add `runtime.txt` if you need a specific version:
  ```
  python-3.11
  ```

### Database Connection Issues

1. Verify `DATABASE_URL` is set correctly
2. Check if PostgreSQL service is running
3. Ensure connection string uses `postgresql+asyncpg://`

### Redis Connection Issues

1. Verify `REDIS_URL` is set
2. Check Redis service status
3. Review connection logs

### CORS Errors

Update `CORS_ORIGINS` to include your frontend domain:
```
https://your-frontend.onrender.com,https://yourdomain.com
```

### 502/503 Errors

- Check if service is running
- Review logs for Python errors
- Verify health check endpoint works
- Check resource limits

### Slow First Request (Cold Start)

This is normal on free tier. Solutions:
- Upgrade to Starter plan ($7/month)
- Use a cron job to keep service warm
- Add external uptime monitor (UptimeRobot, etc.)

## Security Checklist

- [ ] `DEBUG=false` in production
- [ ] Strong `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] CORS_ORIGINS restricted to your domains
- [ ] Database password is strong
- [ ] API keys stored as secret environment variables
- [ ] HTTPS enabled (automatic on Render)
- [ ] Rate limiting configured
- [ ] File upload size limits set

## Performance Optimization

1. **Database Connection Pooling**: Already configured in `config.py`
2. **Redis Caching**: Implemented for frequent queries
3. **CDN**: Use for static files (avatars, exports)
4. **Monitoring**: Add Sentry for error tracking

## Cost Estimates

**Free Tier:**
- PostgreSQL: Free (90 days, then $7/month)
- Redis: Free (limited)
- Web Service: Free (with spin-down)

**Starter Tier (~$25/month):**
- PostgreSQL: $7/month (1GB storage)
- Redis: $10/month
- Web Service: $7/month

## Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **FastAPI Docs**: https://fastapi.tiangolo.com/deployment/

## Next Steps

1. Set up monitoring (Sentry, LogTail)
2. Configure custom domain
3. Set up automated backups
4. Add CI/CD pipeline
5. Configure staging environment

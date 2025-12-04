# Deployment Guide

## Railway (Backend) Deployment

1. **Connect Repository**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository: `KennethDevon/autodoxis`

2. **Configure Project**
   - Set Root Directory: `backend`
   - Railway will auto-detect Node.js

3. **Environment Variables**
   Add these in Railway dashboard:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   FRONTEND_URL=https://your-frontend-url.vercel.app
   NODE_ENV=production
   ```

4. **Deploy**
   - Railway will automatically deploy on push to main branch
   - Get your backend URL from Railway dashboard

## Vercel (Frontend) Deployment

1. **Connect Repository**
   - Go to [Vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository: `KennethDevon/autodoxis`

2. **Configure Build Settings**
   - Framework Preset: **Create React App**
   - Root Directory: `.` (project root)
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Environment Variables**
   Add in Vercel dashboard:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

4. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Update `FRONTEND_URL` in Railway with your Vercel URL

## Important Notes

- **File Uploads**: Railway provides persistent storage, but for production, consider using:
  - AWS S3
  - Cloudinary
  - Railway Volumes (for persistent file storage)

- **CORS**: Make sure `FRONTEND_URL` in Railway matches your Vercel deployment URL

- **MongoDB**: Use MongoDB Atlas for production database

- **Environment Variables**: Never commit `.env` files to GitHub

## Quick Deploy Commands

### Railway CLI (Optional)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Vercel CLI (Optional)
```bash
npm install -g vercel
vercel login
vercel --prod
```


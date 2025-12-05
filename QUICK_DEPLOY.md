# 🚀 Quick Deployment Guide - Step by Step

Follow these steps in order to deploy your AutoDoxis application.

---

## 📋 PREPARATION (Do this first!)

### ✅ Step 0: Push Your Code to GitHub

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## 🗄️ STEP 1: Setup MongoDB Atlas (Database)

### 1.1 Create MongoDB Account
- Go to: https://www.mongodb.com/cloud/atlas
- Sign up for free account
- Create a new **FREE** cluster (takes 3-5 minutes)

### 1.2 Create Database User
- Click **"Database Access"** (left sidebar)
- Click **"Add New Database User"**
- Choose **"Password"** authentication
- Username: `autodoxis-admin` (or your choice)
- Password: Create a strong password (SAVE THIS!)
- Database User Privileges: **"Read and write to any database"**
- Click **"Add User"**

### 1.3 Configure Network Access
- Click **"Network Access"** (left sidebar)
- Click **"Add IP Address"**
- Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
- Click **"Confirm"**

### 1.4 Get Connection String
- Click **"Database"** (left sidebar)
- Click **"Connect"** on your cluster
- Choose **"Connect your application"**
- Copy the connection string (looks like this):
  ```
  mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
  ```
- **Replace `<username>`** with your database username
- **Replace `<password>`** with your database password
- **Add database name** at the end: `/autodoxis?retryWrites=true&w=majority`

**Final connection string should look like:**
```
mongodb+srv://autodoxis-admin:YourPassword123@cluster0.xxxxx.mongodb.net/autodoxis?retryWrites=true&w=majority
```

**📝 SAVE THIS CONNECTION STRING - You'll need it in Step 2!**

---

## 🚂 STEP 2: Deploy Backend to Railway

### 2.1 Create Railway Account & Project
1. Go to: https://railway.app
2. Sign up with GitHub (recommended)
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Find and select your `autodoxis` repository
6. Click **"Deploy Now"**

### 2.2 Configure Root Directory
1. In your Railway project dashboard, click on your service
2. Go to **"Settings"** tab
3. Scroll to **"Root Directory"**
4. Set it to: `backend`
5. Click **"Save"**

### 2.3 Add Environment Variables
1. In Railway project, go to **"Variables"** tab
2. Click **"New Variable"** and add these one by one:

   **Variable 1:**
   - Key: `MONGODB_URI`
   - Value: `[Paste your MongoDB connection string from Step 1.4]`
   - Click **"Add"**

   **Variable 2:**
   - Key: `PORT`
   - Value: `5000`
   - Click **"Add"**

   **Variable 3:**
   - Key: `FRONTEND_URL`
   - Value: `https://placeholder.vercel.app` (we'll update this later)
   - Click **"Add"**

   **Variable 4:**
   - Key: `NODE_ENV`
   - Value: `production`
   - Click **"Add"**

### 2.4 Deploy & Get Backend URL
1. Railway will automatically start deploying
2. Wait for deployment to complete (check **"Deployments"** tab)
3. Once deployed, go to **"Settings"** tab
4. Scroll to **"Domains"** section
5. Click **"Generate Domain"** (or use the default one)
6. **Copy your Railway URL** (e.g., `https://autodoxis-production.up.railway.app`)

**📝 SAVE THIS RAILWAY URL - You'll need it in Step 3!**

### 2.5 Test Backend
1. Open your Railway URL in a browser
2. You should see: `API is running...`
3. ✅ If you see this, backend is working!

---

## ⚡ STEP 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account & Project
1. Go to: https://vercel.com
2. Sign up with GitHub (recommended)
3. Click **"Add New Project"**
4. Find and select your `autodoxis` repository
5. Click **"Import"**

### 3.2 Configure Build Settings
Vercel should auto-detect these, but verify:
- **Framework Preset:** `Create React App`
- **Root Directory:** `.` (leave as is)
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

### 3.3 Add Environment Variable
1. Scroll down to **"Environment Variables"** section
2. Click **"Add"** next to Environment Variables
3. Add this variable:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `[Paste your Railway URL from Step 2.4]`
   - Make sure it's added to **Production**, **Preview**, and **Development**
   - Click **"Save"**

### 3.4 Deploy
1. Scroll down and click **"Deploy"**
2. Wait for build to complete (usually 1-2 minutes)
3. Once done, you'll see **"Congratulations!"** message
4. **Copy your Vercel URL** (e.g., `https://autodoxis.vercel.app`)

**📝 SAVE THIS VERCEL URL - You'll need it in Step 4!**

---

## 🔄 STEP 4: Connect Frontend & Backend (CORS)

### 4.1 Update Railway CORS Settings
1. Go back to Railway dashboard
2. Go to **"Variables"** tab
3. Find `FRONTEND_URL` variable
4. Click the **pencil icon** to edit
5. Replace the value with your **Vercel URL from Step 3.4**
   - Example: `https://autodoxis.vercel.app`
6. Click **"Save"**
7. Railway will automatically redeploy (this is normal)

---

## ✅ STEP 5: Test Everything

### 5.1 Test Backend
1. Open your Railway URL in browser
2. Should see: `API is running...`
3. ✅ Backend is working!

### 5.2 Test Frontend
1. Open your Vercel URL in browser
2. Should see your login page
3. ✅ Frontend is working!

### 5.3 Test Full Application
1. On your Vercel site, try to **log in**
2. Open browser **Developer Tools** (F12)
3. Go to **"Console"** tab
4. Check for any errors
5. Go to **"Network"** tab
6. Try logging in and check if API calls are successful

**If you see CORS errors:**
- Double-check `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Make sure both URLs start with `https://`
- Wait a few minutes for Railway to redeploy after changing variables

---

## 📁 STEP 6: Setup File Storage (Important!)

**⚠️ WARNING:** Railway's file system is temporary. Uploaded files will be lost on redeploy!

### Option A: Railway Volumes (Quick Fix)
1. In Railway project, go to **"Volumes"** tab
2. Click **"Create Volume"**
3. Name: `uploads`
4. Mount Path: `/app/backend/uploads`
5. Click **"Create"**
6. Railway will redeploy automatically

### Option B: Cloud Storage (Recommended for Production)
For production, consider using:
- AWS S3
- Cloudinary
- Google Cloud Storage

*(This requires code changes - see DEPLOYMENT.md for details)*

---

## 🎉 DONE! Your App is Deployed!

### Your URLs:
- **Frontend:** `https://autodoxis.vercel.app` (or your custom domain)
- **Backend:** `https://your-app.up.railway.app`

### Future Updates:
Every time you push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Both Railway and Vercel will automatically deploy your changes! 🚀

---

## 🆘 Need Help?

### Common Issues:

**Backend won't start:**
- Check Railway logs (click on your service → "Deployments" → "View Logs")
- Verify `MONGODB_URI` is correct
- Make sure root directory is set to `backend`

**CORS errors:**
- Verify `FRONTEND_URL` in Railway = your Vercel URL exactly
- Both should start with `https://`
- Wait 2-3 minutes after changing variables

**Can't connect to API:**
- Check `REACT_APP_API_URL` in Vercel matches Railway URL
- Open browser console (F12) to see errors
- Verify Railway backend is running

**MongoDB connection fails:**
- Check connection string format
- Verify database user password is correct
- Make sure IP whitelist includes `0.0.0.0/0`

---

## 📚 Full Documentation

For more details, see: `DEPLOYMENT.md`


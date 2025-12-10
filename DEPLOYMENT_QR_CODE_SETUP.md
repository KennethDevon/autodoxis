# QR Code Setup for Deployed App (Production)

## 🚀 For Railway + Vercel Deployment

I've updated the code to automatically detect your production environment and use the correct URL for QR codes.

---

## ✅ Automatic Detection

The system now automatically detects:
- **Production (Railway)**: Uses your Railway domain automatically
- **Development (Local)**: Uses your network IP address for mobile access

---

## 🔧 Production Setup (Railway)

### Option 1: Automatic (Recommended - Already Works!)

If your Railway backend has a public domain, the QR codes will automatically use it. No configuration needed! 🎉

### Option 2: Manual Configuration (If Needed)

If you want to explicitly set the server URL:

1. **Go to Railway Dashboard**
   - Select your backend service
   - Go to **"Variables"** tab
   - Click **"New Variable"**

2. **Add Environment Variable:**
   - **Key:** `SERVER_URL`
   - **Value:** `https://your-app.up.railway.app` (your Railway backend URL)
   - Click **"Save"**

3. **Redeploy** (Railway will do this automatically)

---

## 🔍 How It Works

### Production (Railway):
- ✅ Automatically detects `RAILWAY_PUBLIC_DOMAIN` environment variable
- ✅ Uses `https://your-app.up.railway.app/documents/:id/view`
- ✅ QR codes work from anywhere in the world!

### Development (Local):
- ✅ Uses your computer's network IP address
- ✅ Works when phone is on same WiFi network
- ✅ Example: `http://192.168.1.100:5000/documents/:id/view`

---

## 🧪 Testing Production QR Codes

### Step 1: Generate QR Code in Production
1. Go to your deployed app (Vercel URL)
2. Log in as Admin
3. Go to Document Management
4. Open any document
5. Click "QR Code" button
6. Download or display the QR code

### Step 2: Test from Anywhere
1. **Scan the QR code with any phone** (doesn't need to be on same WiFi!)
2. The QR code should open: `https://your-railway-url.up.railway.app/documents/:id/view`
3. You'll see a beautiful mobile-friendly document information page

### Step 3: Verify It Works
- ✅ QR code opens in phone browser
- ✅ Shows document information
- ✅ Download button works (if file attached)
- ✅ Works from anywhere (no WiFi requirement!)

---

## 📱 QR Code URLs by Environment

### Development (Local):
```
http://192.168.1.XXX:5000/documents/:id/view
```
- Works only on same WiFi network
- Perfect for local testing

### Production (Railway):
```
https://your-app.up.railway.app/documents/:id/view
```
- Works from anywhere in the world
- Perfect for production use
- Automatically detected!

---

## 🔄 Updating Existing QR Codes

**Important:** Old QR codes won't automatically update!

1. **Generate NEW QR codes** after deployment
2. Delete or regenerate QR codes for existing documents
3. New QR codes will use the production URL automatically

---

## 🎯 For Your Capstone Presentation

### Best Option: Show Production QR Codes
1. Deploy your app to Railway + Vercel
2. Generate QR codes from your deployed app
3. During presentation, scan QR code with phone
4. Show it works from anywhere (even if you're presenting from a different network!)

### Demo Script:
> "Our QR code feature works in both development and production. When scanned, users instantly access document information from their mobile device. In production, QR codes work from anywhere, making it easy for users to track documents even when they're not at the office."

---

## ✅ Checklist for Production

- [ ] Backend deployed to Railway
- [ ] Backend has public domain (e.g., `xxx.up.railway.app`)
- [ ] Frontend deployed to Vercel
- [ ] Tested QR code generation in production
- [ ] Scanned QR code with phone (from different network)
- [ ] Document page displays correctly
- [ ] Download button works (if file attached)

---

## 🆘 Troubleshooting

### Issue: QR codes still show localhost in production

**Solution:**
- Check Railway environment variables
- Make sure `RAILWAY_PUBLIC_DOMAIN` is set (Railway sets this automatically)
- Or set `SERVER_URL` manually to your Railway URL

### Issue: QR code doesn't work from phone

**Solutions:**
1. ✅ Make sure backend is deployed and accessible
2. ✅ Test the URL manually: `https://your-railway-url/documents/:id/view`
3. ✅ Check Railway logs for errors
4. ✅ Make sure document ID exists in database

### Issue: Download button doesn't work

**Solution:**
- Make sure Railway volumes are set up for file storage
- Check file path in database
- Verify uploads folder is mounted correctly

---

## 💡 Technical Details

### Environment Detection Priority:
1. `RAILWAY_PUBLIC_DOMAIN` (Railway automatic)
2. `SERVER_URL` (manual override)
3. Request host (current request)
4. Network IP (local development only)

### URL Format:
- **Production:** `https://domain.com/documents/:id/view`
- **Development:** `http://192.168.x.x:5000/documents/:id/view`

---

**Your QR codes will now work perfectly in production!** 🎉

Just deploy to Railway and generate new QR codes - they'll automatically use the correct production URL!


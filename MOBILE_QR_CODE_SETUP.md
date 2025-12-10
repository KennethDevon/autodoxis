# Mobile QR Code Setup Guide

## 🔧 The Problem
When you scan a QR code on your phone, it tries to access `localhost:5000`, but `localhost` on your phone refers to the phone itself, not your computer!

## ✅ The Solution
I've updated the code to automatically detect your computer's network IP address and use that in QR codes instead of `localhost`.

---

## 🚀 Quick Setup Steps

### Step 1: Restart Your Backend Server

```bash
cd backend
npm start
```

When you restart, you'll now see output like this:
```
Server running on port 5000
Local: http://localhost:5000
Network: http://192.168.1.100:5000

📱 To access from your phone, use: http://192.168.1.100:5000
   Make sure your phone is on the same WiFi network!
```

**📝 Note the Network IP address** (e.g., `192.168.1.100`) - this is what your phone needs!

### Step 2: Make Sure Phone and Computer Are on Same WiFi

- ✅ Both devices must be on the **same WiFi network**
- ✅ Your computer's firewall should allow connections on port 5000

### Step 3: Generate a New QR Code

1. Go to your Admin Dashboard
2. Open any document
3. Click "QR Code" button
4. The QR code will now contain your network IP address instead of localhost

### Step 4: Test on Your Phone

1. Make sure your phone is on the same WiFi as your computer
2. Open your phone's camera app
3. Point it at the QR code
4. Tap the notification that appears
5. **It should now work!** 🎉

---

## 🔍 Finding Your IP Address Manually

If you want to check your IP address manually:

### Windows:
```powershell
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (usually starts with 192.168.x.x)

### Mac/Linux:
```bash
ifconfig
```
Look for "inet" address (usually starts with 192.168.x.x)

---

## ⚠️ Common Issues & Solutions

### Issue: "Connection Refused" or "Can't Reach Site"

**Solution 1: Check Firewall**
- Windows: Go to Windows Defender Firewall → Allow an app through firewall
- Allow Node.js or port 5000 through firewall

**Solution 2: Check WiFi Connection**
- Make sure both devices are on the same WiFi network
- Try disconnecting and reconnecting to WiFi

**Solution 3: Use Manual IP Configuration**
- If automatic detection doesn't work, you can set it manually in `.env`:
  ```
  SERVER_URL=http://YOUR_IP_ADDRESS:5000
  ```
  Replace `YOUR_IP_ADDRESS` with your actual IP (e.g., `192.168.1.100`)

### Issue: QR Code Still Shows localhost

**Solution:**
- Make sure you **generated a NEW QR code** after restarting the server
- Old QR codes will still have the old localhost URL
- Delete the old QR code and generate a new one

### Issue: Works on Computer but Not Phone

**Solutions:**
1. ✅ Check both devices are on same WiFi
2. ✅ Check firewall allows port 5000
3. ✅ Make sure backend server is running
4. ✅ Try accessing the IP address directly in phone browser first:
   - Open phone browser
   - Go to: `http://YOUR_IP:5000` (replace YOUR_IP with your network IP)
   - You should see "API is running..."

---

## 🎯 For Your Capstone Presentation

### Option 1: Demo with Your Phone (Best Option)
1. Connect your phone to the same WiFi as your presentation computer
2. Show the QR code on the projector/screen
3. Scan with your phone and show it working live!

### Option 2: Screenshot/Demo Video
1. Test it beforehand and take screenshots
2. Show the QR code and the resulting page in a demo video
3. Explain: "When scanned with a phone, users can instantly view document details"

### Option 3: Explain the Feature
If WiFi isn't available during presentation:
- Show the QR code generation
- Explain: "The QR code contains a URL that, when scanned with a phone, displays the document information in a mobile-friendly format"
- Mention: "In production, this would use a public domain name accessible from anywhere"

---

## 📝 Quick Test Checklist

- [ ] Backend server restarted and shows network IP address
- [ ] Phone and computer on same WiFi network
- [ ] Generated a NEW QR code (after server restart)
- [ ] QR code scanned successfully on phone
- [ ] Document information page displays correctly

---

## 💡 Technical Details

### What Changed:
1. **Server now listens on `0.0.0.0`** (all network interfaces) instead of just `localhost`
2. **Automatic IP detection** - finds your computer's network IP address
3. **QR code uses network IP** - QR codes now contain `http://YOUR_IP:5000/documents/...` instead of `localhost`

### Security Note:
This setup works great for development and local demos. For production:
- Use a public domain name
- Set up proper authentication for public document viewing
- Use HTTPS for secure connections

---

**Need help?** Check the server console output - it will show your network IP address when it starts!


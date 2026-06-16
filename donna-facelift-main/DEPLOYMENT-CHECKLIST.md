# 🚀 DONNA MVP Production Deployment Checklist

## Phase 1: PHP Backend to SiteGround ✅

### Option A: Automated Upload (Recommended)
```powershell
# Install WinSCP first: https://winscp.net/eng/download.php
# Run from donna project directory:
.\deploy-ftp.ps1
```

### Option B: Manual FTP Upload
**FTP Details:**
- Host: `ftp.bemdonna.com`  
- Username: `derek@bemdonna.com`
- Password: `Thecone4peace!`
- Port: 21

**Files to Upload to `public_html/donna/`:**
- [ ] `api/` folder (entire folder)
- [ ] `vendor/` folder (entire folder)  
- [ ] `bootstrap_env.php`
- [ ] `composer.json`
- [ ] `composer.lock`

**Create Directories:**
- [ ] `public_html/donna/data/`
- [ ] `public_html/donna/data/chat_sessions/`
- [ ] `public_html/donna/data/memory/`
- [ ] `public_html/donna/data/rate/`
- [ ] `public_html/donna/logs/`

**Important: .env File (OUTSIDE public_html)**
- [ ] Upload `.env` to `/home/username/.env` (NOT in public_html)
- [ ] Set permissions: `chmod 600 .env`

### File Permissions (via cPanel File Manager)
- [ ] `chmod 755 public_html/donna/`
- [ ] `chmod 755 public_html/donna/api/`
- [ ] `chmod 755 public_html/donna/data/` and subdirectories
- [ ] `chmod 755 public_html/donna/logs/`

### Test Backend
- [ ] Visit: `https://bemdonna.com/donna/api/health.php`
- [ ] Should return: `{"ok":true,"service":"donna-api","version":"v1","time":...}`

---

## Phase 2: Frontend to Vercel ✅

### Deploy to Vercel
```powershell
# Option A: CLI
npm install -g vercel
vercel login  
vercel

# Option B: Connect GitHub repo at vercel.com
```

### Environment Variables (Copy to Vercel Dashboard)
**From `vercel-env-vars.txt`:**
- [ ] Clerk Authentication (3 variables)
- [ ] Supabase Database (4 variables)  
- [ ] Gmail OAuth (3 variables)
- [ ] Backend Configuration (3 variables)
- [ ] OpenAI (2 variables)
- [ ] System Configuration (3 variables)

### Test Frontend  
- [ ] Visit: `https://donna-interactive-grid.vercel.app`
- [ ] Check: Components load without errors
- [ ] Test: `/demo` page displays properly

---

## Phase 3: Integration & OAuth Setup ✅

### Google Cloud Console
1. [ ] Go to: [Google Cloud Console](https://console.cloud.google.com)
2. [ ] Navigate: APIs & Services > Credentials
3. [ ] Edit your OAuth 2.0 Client ID
4. [ ] Add Authorized Redirect URI: `https://donna-interactive-grid.vercel.app/api/gmail/oauth/callback`
5. [ ] Save changes

### Update Environment Variables
**In your local `.env` AND SiteGround `.env`:**
- [ ] Set: `GOOGLE_REDIRECT_URI=https://donna-interactive-grid.vercel.app/api/gmail/oauth/callback`
- [ ] Set: `NEXTJS_HOST=https://donna-interactive-grid.vercel.app`
- [ ] Set: `DOMAIN_NAME=bemdonna.com`

---

## Phase 4: End-to-End Testing ✅

### Health Checks
- [ ] Backend: `https://bemdonna.com/donna/api/health.php`
- [ ] Frontend: `https://donna-interactive-grid.vercel.app`

### Authentication Flow
- [ ] Visit: `https://donna-interactive-grid.vercel.app/sign-in`
- [ ] Sign up/in with Clerk
- [ ] Verify: User created in Supabase `users` table

### Chat System
- [ ] Test: Text chat on main page
- [ ] Verify: Messages saved in Supabase `messages` table
- [ ] Check: `chat_sessions` table has entries

### Gmail Integration  
- [ ] Test: `https://donna-interactive-grid.vercel.app/api/gmail/oauth/start`
- [ ] Complete: OAuth consent flow
- [ ] Verify: Tokens saved in Supabase `gmail_tokens` table
- [ ] Test: View demo page inbox list
- [ ] Test: Send email from demo page

### Voice System
- [ ] Test: `/demo` page voice controls
- [ ] Verify: WebRTC connection establishes
- [ ] Test: Voice conversation works

---

## Phase 5: Production Optimization ✅

### SiteGround cPanel Settings
- [ ] PHP Version: Set to 8.0+ 
- [ ] Extensions: Ensure cURL is enabled
- [ ] Error Reporting: Turn off for production

### Vercel Settings
- [ ] Custom Domain: (Optional) Add `donna.bemdonna.com`
- [ ] Analytics: Enable Web Analytics
- [ ] Preview Deployments: Configure as needed

---

## 🎯 Deployment Commands Summary

```powershell
# 1. Deploy PHP Backend to SiteGround
.\deploy-ftp.ps1

# 2. Deploy Frontend to Vercel  
vercel

# 3. Test Everything
Start-Process "https://bemdonna.com/donna/api/health.php"
Start-Process "https://donna-interactive-grid.vercel.app"
Start-Process "https://donna-interactive-grid.vercel.app/demo"
```

## 🆘 Troubleshooting

**Backend Issues:**
- Check: `.env` file location (outside public_html)
- Verify: File permissions (755 for directories, 644 for files)
- Test: PHP version and extensions in cPanel

**Frontend Issues:**  
- Check: Environment variables in Vercel dashboard
- Verify: Build logs in Vercel deployments tab
- Test: API connectivity to SiteGround backend

**OAuth Issues:**
- Verify: Redirect URI matches exactly in Google Console
- Check: HTTPS is used (not HTTP)
- Test: Clerk authentication works independently

---

✅ **MVP Ready for Production!** Once all items are checked, your DONNA MVP will be fully deployed and operational.

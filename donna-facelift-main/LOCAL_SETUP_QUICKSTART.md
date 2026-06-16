# 🚀 Quick Start - Local Vertical Onboarding Testing

## Prerequisites Check ✅

- ✅ Node.js v22.16.0 installed
- ✅ npm v10.9.2 installed
- ⚠️ `.env` file needed
- ⚠️ Dependencies may need installation

---

## Step-by-Step Setup

### 1. Install Dependencies (if needed)
```bash
npm install
```

### 2. Create `.env` File

Create a `.env` file in the project root with these minimum variables:

```env
# Supabase (Required for vertical feature)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Authentication: Demo mode (cookie-based)
# Sign in at /sign-in with DONNA / DONNA123

# System
ALLOWED_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

### 3. Run Database Migration

**In Supabase SQL Editor**, run:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS vertical VARCHAR(50) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_vertical ON users(vertical);

ALTER TABLE users 
ADD CONSTRAINT chk_users_vertical 
CHECK (vertical IS NULL OR vertical IN ('hospitality', 'real_estate', 'professional_services'));
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on: `http://localhost:3000`

### 5. Test the Onboarding Flow

**Direct Access:**
```
http://localhost:3000/protected/onboarding
```

**Or via redirect:**
```
http://localhost:3000/protected
```
(Will auto-redirect to onboarding if no vertical is set)

---

## 🧪 Quick Test

1. **Open browser** to `http://localhost:3000/protected/onboarding`
2. **You should see:**
   - Three vertical option cards (Hospitality, Real Estate, Professional Services)
   - Glassmorphic styling with purple/cyan accents
   - "Continue" button (disabled until selection)

3. **Select a vertical:**
   - Click on one of the cards
   - Card should show purple border and checkmark
   - "Continue" button becomes enabled

4. **Click "Continue":**
   - Should show "Saving..." loading state
   - Redirects to `/protected` dashboard
   - Dashboard shows vertical-specific navigation

---

## 🐛 Common Issues

### "User not found" error
- Make sure you have a user in Supabase `users` table
- Check that `clerk_id` matches (if using Clerk)
- Or use the dev bypass mode

### Onboarding page doesn't load
- Check if dev server is running: `npm run dev`
- Check browser console for errors
- Verify the route: `app/(auth)/protected/onboarding/page.tsx` exists

### "Failed to save selection"
- Run the database migration first
- Check Supabase connection in `.env`
- Verify `SUPABASE_SERVICE_ROLE_KEY` has write permissions

---

## 📋 What to Test

- [ ] Onboarding page loads
- [ ] Three vertical cards display correctly
- [ ] Selection works (visual feedback)
- [ ] "Continue" button enables after selection
- [ ] Vertical saves successfully
- [ ] Redirects to dashboard
- [ ] Dashboard shows vertical-specific navigation
- [ ] Navigation links work

---

## 🔍 Debug Commands

**Check if API works:**
```bash
# In browser console (F12)
fetch('/api/user/vertical').then(r => r.json()).then(console.log)
```

**Check database:**
```sql
-- In Supabase SQL Editor
SELECT id, email, vertical FROM users;
```

---

## ✅ Success!

When everything works:
- You can select a vertical
- It saves to the database
- Dashboard shows vertical-specific content
- Navigation adapts to your selection

Then you're ready to test in production! 🎉












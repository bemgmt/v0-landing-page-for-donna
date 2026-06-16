# Local Testing Guide - Vertical Onboarding Flow

## 🚀 Quick Start

### Step 1: Check Your Environment

First, make sure you have a `.env` file (or `.env.local`) with the required variables:

```bash
# Required for vertical onboarding
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Auth: Demo mode uses cookie-based session from /sign-in (DONNA / DONNA123)
```

### Step 2: Run Database Migration

**Option A: Using Supabase (Recommended for local dev)**

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
-- Add vertical column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS vertical VARCHAR(50) DEFAULT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_vertical ON users(vertical);

-- Add check constraint
ALTER TABLE users 
ADD CONSTRAINT chk_users_vertical 
CHECK (vertical IS NULL OR vertical IN ('hospitality', 'real_estate', 'professional_services'));
```

**Option B: Using the Migration File**

If you have direct database access:
```bash
psql -U your_user -d your_database -f scripts/migrations/add-vertical-column.sql
```

### Step 3: Start Development Server

```bash
npm install  # If you haven't already
npm run dev
```

The server should start on `http://localhost:3000`

### Step 4: Access the Onboarding Flow

**Option 1: Direct Access**
```
http://localhost:3000/protected/onboarding
```

**Option 2: Automatic Redirect**
```
http://localhost:3000/protected
```
(Will redirect to onboarding if you don't have a vertical selected)

---

## 🧪 Testing Checklist

### ✅ Test 1: Onboarding Page Loads
- [ ] Navigate to `/protected/onboarding`
- [ ] See three vertical option cards
- [ ] Cards are styled correctly (glassmorphic, purple/cyan accents)
- [ ] Each card shows: Hospitality, Real Estate, Professional Services

### ✅ Test 2: Selection Works
- [ ] Click on a vertical card
- [ ] Card shows selected state (purple border, checkmark)
- [ ] "Continue" button becomes enabled
- [ ] Can switch between different selections

### ✅ Test 3: Save Vertical
- [ ] Select a vertical
- [ ] Click "Continue"
- [ ] See loading state ("Saving...")
- [ ] Successfully redirects to `/protected` dashboard
- [ ] No errors in browser console

### ✅ Test 4: Dashboard Shows Vertical
- [ ] After selection, see welcome message with vertical name
- [ ] See vertical-specific navigation menu
- [ ] Navigation shows correct links for selected vertical:
  - Real Estate: Properties, Showings
  - Hospitality: Reservations, Guest Management
  - Professional Services: Clients, Projects

### ✅ Test 5: Redirect Logic
- [ ] User without vertical → Redirects to onboarding
- [ ] User with vertical → Shows dashboard
- [ ] Already on onboarding → No redirect loop

### ✅ Test 6: Vertical-Specific Pages
- [ ] Click navigation links
- [ ] Pages load with "Coming Soon" placeholders
- [ ] URLs are correct (e.g., `/protected/properties`)

---

## 🐛 Troubleshooting

### Issue: "User not found" error

**Check:**
1. Is your user in the Supabase `users` table? (Demo mode creates users with clerk_id `demo-user-donna`)
2. Are your Supabase environment variables correct?

**Solution:**
```sql
-- Check if user exists
SELECT id, email, clerk_id, vertical 
FROM users 
WHERE clerk_id = 'your_clerk_id';
```

### Issue: Onboarding page doesn't load

**Check:**
1. Is the dev server running? (`npm run dev`)
2. Check browser console for errors
3. Verify the route exists: `app/(auth)/protected/onboarding/page.tsx`

**Solution:**
- Restart dev server
- Clear browser cache
- Check for TypeScript/build errors

### Issue: "Failed to save selection"

**Check:**
1. Has the database migration been run?
2. Check browser console for API errors
3. Check terminal for server errors

**Solution:**
```sql
-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'vertical';
```

### Issue: Redirect loop

**Check:**
1. Is the API endpoint `/api/user/vertical` working?
2. Check network tab for API calls
3. Verify authentication is working

**Solution:**
- Test API directly:
```bash
curl http://localhost:3000/api/user/vertical
```

### Issue: No vertical navigation showing

**Check:**
1. Did the vertical save successfully?
2. Check browser console for errors in `useVertical` hook
3. Verify the API returns the vertical

**Solution:**
- Check database:
```sql
SELECT vertical FROM users WHERE id = 'your_user_id';
```

---

## 🔍 Debugging Tips

### Check API Endpoints

**Test GET vertical:**
```bash
# In browser console or terminal
fetch('/api/user/vertical')
  .then(r => r.json())
  .then(console.log)
```

**Test POST vertical:**
```bash
fetch('/api/user/vertical', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ vertical: 'hospitality' })
})
  .then(r => r.json())
  .then(console.log)
```

### Check Database

```sql
-- See all users with their verticals
SELECT id, email, vertical, created_at 
FROM users 
ORDER BY created_at DESC;

-- Check if vertical column exists
\d users  -- PostgreSQL
-- or
DESCRIBE users;  -- MySQL
```

### Check Browser Console

Open DevTools (F12) and check:
- Console tab for errors
- Network tab for API calls
- Application tab for cookies/localStorage

---

## 📝 Expected Behavior

### First Time User (No Vertical)
1. Navigate to `/protected`
2. Layout checks for vertical
3. API returns `{ vertical: null }`
4. Redirects to `/protected/onboarding`
5. User selects vertical
6. POST to `/api/user/vertical`
7. Redirects to `/protected`
8. Dashboard shows vertical-specific content

### Returning User (Has Vertical)
1. Navigate to `/protected`
2. Layout checks for vertical
3. API returns `{ vertical: 'hospitality' }`
4. Shows dashboard directly
5. Navigation shows hospitality-specific links

---

## 🎯 Quick Test Script

Run this in your browser console on `http://localhost:3000/protected`:

```javascript
// Test the full flow
async function testVerticalFlow() {
  // 1. Check current vertical
  const current = await fetch('/api/user/vertical').then(r => r.json());
  console.log('Current vertical:', current);
  
  // 2. Set a test vertical
  const set = await fetch('/api/user/vertical', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vertical: 'hospitality' })
  }).then(r => r.json());
  console.log('Set vertical:', set);
  
  // 3. Verify it was saved
  const verify = await fetch('/api/user/vertical').then(r => r.json());
  console.log('Verified vertical:', verify);
}

testVerticalFlow();
```

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ Onboarding page loads and displays 3 vertical options
2. ✅ Selection works and shows visual feedback
3. ✅ "Continue" button saves the selection
4. ✅ Redirects to dashboard after selection
5. ✅ Dashboard shows vertical-specific navigation
6. ✅ Navigation links work and show placeholder pages
7. ✅ Returning users skip onboarding if they have a vertical

---

## 📞 Next Steps

Once local testing is successful:
1. Test in a preview deployment on Vercel
2. Run the database migration on production Supabase
3. Test in production environment
4. Monitor for any errors in production logs












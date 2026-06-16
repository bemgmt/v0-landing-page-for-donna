# Accessing Vertical Selection & Onboarding in Production

## 🎯 Quick Access

Once your Vercel deployment is live, you can access the vertical onboarding flow in two ways:

### Option 1: Automatic Redirect (Recommended)
1. Navigate to your protected route: `https://your-vercel-app.vercel.app/protected`
2. If you don't have a vertical selected, you'll be **automatically redirected** to the onboarding page
3. Select your vertical and continue

### Option 2: Direct Access
1. Navigate directly to: `https://your-vercel-app.vercel.app/protected/onboarding`
2. Select your vertical and continue

---

## 📋 Prerequisites

Before the onboarding flow will work in production, ensure:

### 1. ✅ Database Migration
Run the migration script to add the `vertical` column to your `users` table:

```sql
-- Run this in your Supabase SQL editor or PostgreSQL database
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS vertical VARCHAR(50) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_vertical ON users(vertical);

ALTER TABLE users 
ADD CONSTRAINT chk_users_vertical 
CHECK (vertical IS NULL OR vertical IN ('hospitality', 'real_estate', 'professional_services'));
```

**Or use the migration file:**
```bash
# If you have direct database access
psql -U your_user -d your_database -f scripts/migrations/add-vertical-column.sql
```

### 2. ✅ Environment Variables in Vercel
Ensure these are set in your Vercel project settings:

**Required:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key

**For Authentication:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_JWKS_URL` - Clerk JWKS URL

### 3. ✅ Authentication Setup
Make sure Clerk authentication is properly configured:
- User must be signed in to access `/protected` routes
- Clerk middleware should be protecting these routes

---

## 🔍 Testing the Flow

### Step-by-Step Test:

1. **Sign in to your application**
   ```
   https://your-vercel-app.vercel.app/sign-in
   ```

2. **Navigate to protected area**
   ```
   https://your-vercel-app.vercel.app/protected
   ```

3. **Expected Behavior:**
   - If user has no vertical → Redirects to `/protected/onboarding`
   - If user has vertical → Shows dashboard with vertical-specific navigation

4. **Complete Onboarding:**
   - Select one of the three verticals (Hospitality, Real Estate, Professional Services)
   - Click "Continue"
   - Should redirect to `/protected` dashboard

5. **Verify Navigation:**
   - Dashboard should show vertical-specific menu items
   - Navigation links should match your selected vertical

---

## 🐛 Troubleshooting

### Issue: "User not found" error
**Solution:** 
- Ensure the user exists in Supabase `users` table
- Check that `clerk_id` matches between Clerk and Supabase
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

### Issue: Onboarding page doesn't appear
**Solution:**
- Check browser console for errors
- Verify the route is accessible: `/protected/onboarding`
- Check that the layout component is working (see `app/(auth)/protected/layout.tsx`)

### Issue: "Failed to save selection" error
**Solution:**
- Verify database migration has been run
- Check Supabase connection and permissions
- Ensure `SUPABASE_SERVICE_ROLE_KEY` has write permissions
- Check Vercel function logs for detailed errors

### Issue: Redirect loop
**Solution:**
- Clear browser cache and cookies
- Check that the API endpoint `/api/user/vertical` is working
- Verify authentication is working properly

---

## 📊 Verifying It Works

### Check Database:
```sql
-- In Supabase SQL editor
SELECT id, email, vertical, created_at 
FROM users 
WHERE vertical IS NOT NULL;
```

### Check API Endpoint:
```bash
# Test the vertical API (requires authentication)
curl https://your-vercel-app.vercel.app/api/user/vertical \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Vercel Logs:
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Functions" tab
4. Check logs for `/api/user/vertical` endpoint

---

## 🎨 What You Should See

### Onboarding Page:
- Three cards: Hospitality, Real Estate, Professional Services
- Each card shows description
- Selected card has purple border and checkmark
- "Continue" button enabled after selection

### Dashboard (After Selection):
- Welcome message: "Welcome to DONNA - [Vertical] Edition"
- Vertical-specific navigation menu
- Links to vertical-specific pages (Properties, Reservations, Clients, etc.)

### Vertical-Specific Pages:
- Placeholder pages with "Coming Soon" messages
- Ready for future feature development

---

## 🔗 Production URLs

Based on your deployment, the URLs should be:

**Main App:**
```
https://donna-interactive-grid.vercel.app
```

**Protected Routes:**
```
https://donna-interactive-grid.vercel.app/protected
https://donna-interactive-grid.vercel.app/protected/onboarding
```

**Vertical-Specific Pages:**
```
https://donna-interactive-grid.vercel.app/protected/properties (Real Estate)
https://donna-interactive-grid.vercel.app/protected/showings (Real Estate)
https://donna-interactive-grid.vercel.app/protected/reservations (Hospitality)
https://donna-interactive-grid.vercel.app/protected/guest-management (Hospitality)
https://donna-interactive-grid.vercel.app/protected/clients (Professional Services)
https://donna-interactive-grid.vercel.app/protected/projects (Professional Services)
```

---

## ✅ Quick Checklist

Before accessing in production:

- [ ] Database migration has been run
- [ ] Supabase environment variables are set in Vercel
- [ ] Clerk authentication is configured
- [ ] User is signed in
- [ ] Vercel deployment is successful
- [ ] No build errors in Vercel logs

---

## 📞 Need Help?

If you encounter issues:
1. Check Vercel function logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test the API endpoints directly
5. Check Supabase database for user records


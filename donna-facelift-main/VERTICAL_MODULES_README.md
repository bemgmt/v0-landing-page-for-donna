# Vertical Modules - Quick Start Guide

## 🎯 What Was Built

DONNA Interactive now supports **industry-specific vertical modules** for:
- 🏨 **Hospitality** - Hotels, restaurants, event venues
- 🏠 **Real Estate** - Property management, listings, client services
- 💼 **Professional Services** - Consulting, legal, accounting

## 📁 New Files Created

### Core Backend Files
```
lib/
├── Verticals.php                    # Vertical configuration & validation
└── VerticalAccessControl.php        # Access control helpers

api/
├── user/
│   ├── vertical.php                 # Vertical selection API
│   └── profile.php                  # User profile with vertical support
└── verticals/
    ├── hospitality/dashboard.php
    ├── real_estate/dashboard.php
    └── professional_services/dashboard.php

docs/
├── schema.sql                       # Updated with vertical column
└── VERTICAL_MODULES.md              # Full documentation

scripts/
├── migrations/add-vertical-column.sql
├── test-vertical-system.php
└── test-vertical-system.mjs
```

## 🚀 Quick Start

### 1. Run Database Migration

```bash
# PostgreSQL
psql -U your_user -d your_database -f scripts/migrations/add-vertical-column.sql

# Or if using Supabase, run the SQL in the Supabase SQL editor
```

### 2. Test the Implementation

```bash
# PHP tests
php scripts/test-vertical-system.php

# Node.js integration tests (requires running server)
export API_BASE=http://localhost:3000
export TEST_JWT=your-test-jwt
node scripts/test-vertical-system.mjs
```

### 3. Try the API

```bash
# Get available verticals
curl http://localhost:3000/api/user/vertical.php?action=list \
  -H "Authorization: Bearer YOUR_JWT"

# Set user's vertical
curl -X POST http://localhost:3000/api/user/vertical.php \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"vertical":"hospitality"}'

# Access vertical-specific dashboard
curl http://localhost:3000/api/verticals/hospitality/dashboard.php \
  -H "Authorization: Bearer YOUR_JWT"
```

## 🎨 Frontend Integration

### Step 1: Check User's Vertical on Login

```typescript
// In your auth callback or user profile fetch
const response = await fetch('/api/user/vertical.php?action=current', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { vertical } = await response.json();

if (!vertical) {
  // User hasn't selected a vertical - show onboarding
  router.push('/onboarding/vertical-selection');
} else {
  // Route to vertical-specific dashboard
  router.push(`/${vertical}/dashboard`);
}
```

### Step 2: Create Vertical Selection Component

```typescript
// components/VerticalSelector.tsx
import { useState, useEffect } from 'react';

export function VerticalSelector() {
  const [verticals, setVerticals] = useState([]);
  
  useEffect(() => {
    fetch('/api/user/vertical.php?action=list')
      .then(res => res.json())
      .then(data => setVerticals(data.verticals));
  }, []);
  
  const selectVertical = async (verticalId: string) => {
    await fetch('/api/user/vertical.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vertical: verticalId })
    });
    
    // Redirect to vertical dashboard
    window.location.href = `/${verticalId}/dashboard`;
  };
  
  return (
    <div>
      <h2>Select Your Industry</h2>
      {verticals.map(v => (
        <button key={v.id} onClick={() => selectVertical(v.id)}>
          {v.name}
          <p>{v.description}</p>
        </button>
      ))}
    </div>
  );
}
```

### Step 3: Create Vertical-Specific Routes

```typescript
// app/hospitality/dashboard/page.tsx
export default async function HospitalityDashboard() {
  const response = await fetch('/api/verticals/hospitality/dashboard.php');
  const data = await response.json();
  
  return (
    <div>
      <h1>Hospitality Dashboard</h1>
      {/* Render hospitality-specific UI */}
    </div>
  );
}
```

## 🔒 Security Features

- ✅ All endpoints require authentication
- ✅ Vertical-based access control prevents cross-vertical access
- ✅ Database constraints ensure data integrity
- ✅ Input validation on all API endpoints
- ✅ Sentry error tracking integration

## 📚 API Reference

### Get Available Verticals
```http
GET /api/user/vertical.php?action=list
```

### Get Current User's Vertical
```http
GET /api/user/vertical.php?action=current
```

### Set User's Vertical
```http
POST /api/user/vertical.php
Content-Type: application/json

{"vertical": "hospitality"}
```

### Access Vertical Dashboard
```http
GET /api/verticals/{vertical}/dashboard.php
```

## 🧪 Testing Checklist

- [ ] Database migration completed
- [ ] PHP tests pass (`php scripts/test-vertical-system.php`)
- [ ] Can retrieve vertical list via API
- [ ] Can set user vertical via API
- [ ] Can access authorized vertical dashboard
- [ ] Cannot access unauthorized vertical dashboard (403)
- [ ] User profile includes vertical information

## 📖 Full Documentation

See `docs/VERTICAL_MODULES.md` for complete documentation including:
- Detailed architecture
- All API endpoints
- Code examples
- Migration guide
- Security considerations

## 🎯 Next Steps

1. **Frontend Development**:
   - Create onboarding flow with vertical selection
   - Build vertical-specific dashboard UIs
   - Implement vertical-specific features

2. **Backend Enhancement**:
   - Add vertical-specific business logic
   - Implement vertical-specific AI prompts
   - Create vertical-specific templates

3. **Testing**:
   - Add E2E tests for vertical workflows
   - Test cross-vertical access restrictions
   - Validate onboarding flow

## 💡 Tips

- Use `VerticalAccessControl::requireVertical()` in any vertical-specific endpoint
- Always validate vertical values using `Verticals::isValid()`
- Include vertical metadata in user responses for better UX
- Log vertical changes for audit purposes

## 🆘 Troubleshooting

**Database error when setting vertical?**
- Ensure migration has been run
- Check database connection
- Verify user exists

**403 Forbidden on vertical dashboard?**
- Verify user has set their vertical
- Check JWT token is valid
- Ensure vertical matches endpoint

**Tests failing?**
- Check database is accessible
- Verify API_BASE environment variable
- Ensure test JWT is valid

---

**Need Help?** See `docs/VERTICAL_MODULES.md` for detailed documentation.


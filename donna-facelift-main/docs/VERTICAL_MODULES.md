# Vertical-Specific Modules Documentation

## Overview

DONNA Interactive now supports industry-specific vertical modules, allowing the platform to provide tailored experiences for different business sectors. This implementation is part of Phase 5 Expansion and enables DONNA to serve:

- **Hospitality** - Hotels, restaurants, event venues, and hospitality services
- **Real Estate** - Real estate agencies, property management, and real estate services  
- **Professional Services** - Consulting, legal, accounting, and professional service firms

## Architecture

### Backend Components

#### 1. Verticals Configuration (`lib/Verticals.php`)

Central configuration class that defines all supported verticals:

```php
// Get all allowed verticals
$verticals = Verticals::getAllowed();
// Returns: ['hospitality', 'real_estate', 'professional_services']

// Validate a vertical
$isValid = Verticals::isValid('hospitality'); // true

// Get display name
$name = Verticals::getDisplayName('hospitality'); // "Hospitality"

// Get all with metadata
$metadata = Verticals::getAllWithMetadata();
```

#### 2. Database Schema

The `users` table includes a `vertical` column:

```sql
ALTER TABLE users 
ADD COLUMN vertical VARCHAR(50) DEFAULT NULL 
CHECK (vertical IS NULL OR vertical IN ('hospitality', 'real_estate', 'professional_services'));
```

#### 3. Data Access Layer

All data access classes (FileDataAccess, PostgreSQLDataAccess, SupabaseDataAccess) support the vertical field:

```php
// Create user with vertical
$userId = $dal->createUser([
    'email' => 'user@example.com',
    'name' => 'John Doe',
    'vertical' => 'hospitality'
]);

// Update user vertical
$dal->updateUser($userId, ['vertical' => 'real_estate']);
```

#### 4. Access Control (`lib/VerticalAccessControl.php`)

Helper class for enforcing vertical-based access restrictions:

```php
// Require specific vertical (exits with 403 if unauthorized)
VerticalAccessControl::requireVertical($userId, Verticals::HOSPITALITY);

// Check access without exiting
$hasAccess = VerticalAccessControl::hasVerticalAccess($userId, Verticals::REAL_ESTATE);

// Require any vertical (ensure onboarding complete)
VerticalAccessControl::requireAnyVertical($userId);

// Get user's vertical
$vertical = VerticalAccessControl::getUserVertical($userId);
```

## API Endpoints

### 1. Vertical Selection API

**Endpoint**: `/api/user/vertical.php`

#### Get Available Verticals
```http
GET /api/user/vertical.php?action=list
Authorization: Bearer {jwt_token}
```

Response:
```json
{
  "success": true,
  "verticals": [
    {
      "id": "hospitality",
      "name": "Hospitality",
      "description": "Hotels, restaurants, event venues, and hospitality services"
    },
    ...
  ]
}
```

#### Get Current User's Vertical
```http
GET /api/user/vertical.php?action=current
Authorization: Bearer {jwt_token}
```

Response:
```json
{
  "success": true,
  "vertical": "hospitality",
  "vertical_name": "Hospitality"
}
```

#### Set User's Vertical
```http
POST /api/user/vertical.php
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "vertical": "hospitality"
}
```

Response:
```json
{
  "success": true,
  "message": "Vertical updated successfully",
  "vertical": "hospitality",
  "vertical_name": "Hospitality"
}
```

### 2. User Profile API

**Endpoint**: `/api/user/profile.php`

#### Get User Profile
```http
GET /api/user/profile.php
Authorization: Bearer {jwt_token}
```

Response includes vertical information:
```json
{
  "success": true,
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "vertical": "hospitality",
  "vertical_name": "Hospitality",
  "profile": {},
  "preferences": {}
}
```

### 3. Vertical-Specific Dashboards

Each vertical has its own dashboard endpoint with access control:

#### Hospitality Dashboard
```http
GET /api/verticals/hospitality/dashboard.php
Authorization: Bearer {jwt_token}
```

#### Real Estate Dashboard
```http
GET /api/verticals/real_estate/dashboard.php
Authorization: Bearer {jwt_token}
```

#### Professional Services Dashboard
```http
GET /api/verticals/professional_services/dashboard.php
Authorization: Bearer {jwt_token}
```

All vertical-specific endpoints return 403 Forbidden if the user's vertical doesn't match.

## Testing

### Run PHP Tests
```bash
php scripts/test-vertical-system.php
```

### Run Node.js Integration Tests
```bash
node scripts/test-vertical-system.mjs
```

## Migration Guide

### For Existing Installations

1. **Run Database Migration**:
```bash
psql -U your_user -d your_database -f scripts/migrations/add-vertical-column.sql
```

2. **Update Environment** (if needed):
No new environment variables required.

3. **Test the Implementation**:
```bash
php scripts/test-vertical-system.php
```

### For New Installations

The vertical column is included in the main schema (`docs/schema.sql`), so no additional migration is needed.

## Frontend Integration

The frontend should:

1. **Check if user has selected a vertical** on login:
```typescript
const response = await fetch('/api/user/vertical.php?action=current');
const { vertical } = await response.json();

if (!vertical) {
  // Redirect to onboarding
}
```

2. **Display vertical selection during onboarding**:
```typescript
const response = await fetch('/api/user/vertical.php?action=list');
const { verticals } = await response.json();
// Display vertical options to user
```

3. **Set vertical when user selects**:
```typescript
await fetch('/api/user/vertical.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ vertical: 'hospitality' })
});
```

4. **Route to vertical-specific dashboard**:
```typescript
// Based on user's vertical, route to appropriate dashboard
if (vertical === 'hospitality') {
  router.push('/hospitality/dashboard');
}
```

## Security Considerations

- All vertical-specific endpoints enforce authentication via `donna_cors_and_auth()`
- Vertical-based access control prevents cross-vertical data access
- Invalid vertical values are rejected at the API level
- Database constraints ensure data integrity

## Future Enhancements

- Add more verticals as needed
- Implement vertical-specific AI prompts and behaviors
- Create vertical-specific templates and workflows
- Add vertical-specific analytics and reporting

---

*Part of DONNA Interactive Phase 5 Expansion - Vertical-Specific Modules*


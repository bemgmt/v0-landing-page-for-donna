# DONNA Onboarding System - Quick Start Guide

## 🚀 Getting Started

The DONNA Onboarding & Tour System is now integrated into your application. Here's how to use it:

## For Users

### First Time Login

1. Navigate to `/protected/onboarding`
2. You'll see a friendly welcome chat from DONNA
3. Provide your name and business name
4. Choose DONNA's personality (or upload sample conversations)
5. Select a tour type:
   - **Full Tour** - Complete walkthrough (~5 min)
   - **Quick Tips** - Just the essentials (~2 min)
   - **Skip** - Explore on your own

### Requesting Tours via Chat

Just ask DONNA naturally:
- "Show me around"
- "How do I use email?"
- "Give me a tour of analytics"
- "Quick tips please"

### Controlling Tours

While a tour is active:
- "Pause the tour"
- "Continue"
- "Skip this"
- "Go back"
- "Next step"

## For Developers

### Testing the Onboarding Flow

1. **Clear your onboarding state:**
   ```javascript
   localStorage.removeItem('donna_onboarding_state')
   ```

2. **Navigate to onboarding:**
   ```
   http://localhost:3000/protected/onboarding
   ```

3. **Complete the flow:**
   - Enter name and business name
   - Select a personality
   - Choose a tour option

### Triggering Tours Programmatically

```javascript
// Start a tour
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: {
    action: 'start',
    tourId: 'dashboard-full-tour'
  }
}))

// Pause tour
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: { action: 'pause' }
}))

// Resume tour
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: { action: 'resume' }
}))
```

### Using Onboarding Context

```typescript
import { useOnboarding } from '@/contexts/OnboardingContext'

function MyComponent() {
  const { state, updateUserData, completeStep } = useOnboarding()
  
  // Check if onboarding is complete
  if (state.isComplete) {
    // User has completed onboarding
  }
  
  // Update user data
  updateUserData({ name: 'John Doe' })
  
  // Complete a step
  completeStep('welcome')
}
```

### Using Tour Context

```typescript
import { useTour } from '@/contexts/TourContext'
import { myTour } from '@/lib/tours/my-tour'

function MyComponent() {
  const { startTour, pauseTour, isActive } = useTour()
  
  // Start a tour
  const handleStartTour = () => {
    startTour(myTour)
  }
  
  // Check if tour is active
  if (isActive) {
    // Tour is running
  }
}
```

### Creating a New Tour

1. **Create tour config:**
   ```typescript
   // lib/tours/my-feature-tour.ts
   import { TourConfig } from '@/types/onboarding'
   
   export const myFeatureTour: TourConfig = {
     id: 'my-feature-tour',
     type: 'section',
     title: 'My Feature Tour',
     description: 'Learn about this feature',
     canSkip: true,
     canPause: true,
     steps: [
       {
         id: 'step-1',
         target: '[data-tour="my-element"]',
         title: 'Welcome!',
         description: 'This is what this does...',
         placement: 'bottom'
       }
     ]
   }
   ```

2. **Add data-tour attribute to your component:**
   ```tsx
   <div data-tour="my-element">
     {/* Your component */}
   </div>
   ```

3. **Trigger the tour:**
   ```typescript
   import { useTour } from '@/contexts/TourContext'
   import { myFeatureTour } from '@/lib/tours/my-feature-tour'
   
   const { startTour } = useTour()
   startTour(myFeatureTour)
   ```

## Available Tours

- `dashboard-full-tour` - Complete dashboard walkthrough
- `email-section-tour` - Email management features
- `analytics-section-tour` - Analytics and insights
- `quick-tips` - Quick shortcuts and tips

## API Endpoints

### Get Onboarding Progress
```
GET /api/user/onboarding
```

### Save Onboarding Progress
```
POST /api/user/onboarding
Content-Type: application/json

{
  "currentStep": "personality",
  "completedSteps": ["welcome", "profile"],
  "userData": { ... },
  "personality": { ... }
}
```

## Debugging

### Check Onboarding State
```javascript
const state = localStorage.getItem('donna_onboarding_state')
console.log(JSON.parse(state))
```

### Listen to Events
```javascript
window.addEventListener('donna:tour-complete', (e) => {
  console.log('Tour completed:', e.detail)
})

window.addEventListener('donna:tour-skip', (e) => {
  console.log('Tour skipped:', e.detail)
})
```

### Reset Everything
```javascript
localStorage.removeItem('donna_onboarding_state')
localStorage.removeItem('donna_dashboard_tour_completed')
localStorage.removeItem('donna_dashboard_tour_skipped')
location.reload()
```

## Common Issues

### Tour not showing
- Check if target element exists: `document.querySelector('[data-tour="my-element"]')`
- Check if tour is already active
- Check console for errors

### Onboarding not starting
- Clear localStorage and refresh
- Check if user is authenticated
- Check if onboarding route is accessible

### Personality not saving
- Check network tab for API errors
- Verify Supabase connection
- Check user permissions

## Next Steps

1. ✅ Test the onboarding flow
2. ✅ Try different personalities
3. ✅ Complete a tour
4. 📝 Add more section-specific tours
5. 🎨 Customize animations and copy
6. 🧪 Write integration tests

## Support

For issues or questions:
- Check `docs/ONBOARDING_SYSTEM.md` for detailed documentation
- Check `docs/CURSOR_INTEGRATION_GUIDE.md` for backend integration
- Check `docs/IMPLEMENTATION_CHECKLIST.md` for remaining tasks


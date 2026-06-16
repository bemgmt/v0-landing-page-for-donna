# DONNA Onboarding & Tour System

## Overview

The DONNA Onboarding & Tour System provides a comprehensive, user-friendly experience for new users to get started with the platform and discover its features through guided tours.

## Architecture

### Core Components

1. **OnboardingContext** (`contexts/OnboardingContext.tsx`)
   - Manages onboarding state and progression
   - Handles user data collection
   - Persists progress to localStorage and backend
   - Provides hooks for step navigation

2. **TourContext** (`contexts/TourContext.tsx`)
   - Orchestrates tour lifecycle
   - Manages tour steps and navigation
   - Listens for chat-triggered tour events
   - Executes beforeShow/afterShow hooks

3. **TourOverlay** (`components/tour/TourOverlay.tsx`)
   - Visual tour system with spotlight effect
   - Dynamic element highlighting
   - Animated tooltips with progress indicators
   - Responsive positioning

### Onboarding Steps

The onboarding flow consists of 5 steps:

1. **Welcome** - Friendly chat-based introduction
2. **Profile** - Collect name and business information
3. **Personality** - Choose DONNA's communication style
4. **Tour** - Select tour type (full, quick, or skip)
5. **Complete** - Onboarding finished

### Tour Types

- **Full Tour** - Complete walkthrough of all features (~5 min)
- **Section Tour** - Deep dive into specific sections
- **Mini Tour** - Quick tips and shortcuts (~2 min)

## Usage

### Starting Onboarding

Onboarding automatically starts for new users. To manually trigger:

```typescript
import { useOnboarding } from '@/contexts/OnboardingContext'

function MyComponent() {
  const { resetOnboarding } = useOnboarding()
  
  const handleRestart = () => {
    resetOnboarding()
  }
}
```

### Creating a Tour

Define a tour configuration:

```typescript
import { TourConfig } from '@/types/onboarding'

export const myTour: TourConfig = {
  id: 'my-custom-tour',
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
      description: 'This is the first step',
      placement: 'bottom',
      highlightPadding: 8
    }
  ]
}
```

### Starting a Tour

```typescript
import { useTour } from '@/contexts/TourContext'
import { myTour } from '@/lib/tours/my-tour'

function MyComponent() {
  const { startTour } = useTour()
  
  const handleStartTour = () => {
    startTour(myTour)
  }
}
```

### Chat-Triggered Tours

DONNA can trigger tours via chat using custom events:

```typescript
// From chat or backend
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: {
    action: 'start',
    tourId: 'dashboard-full-tour'
  }
}))
```

Supported actions:
- `start` - Start a tour
- `pause` - Pause current tour
- `resume` - Resume paused tour
- `skip` - Skip current tour
- `next` - Go to next step
- `previous` - Go to previous step

## Adding Tour Targets

Add `data-tour` attributes to elements you want to highlight:

```tsx
<div data-tour="email-inbox">
  {/* Your component */}
</div>
```

## Personality Presets

Six built-in personalities:

1. **Professional** - Formal and business-focused
2. **Friendly** - Warm and conversational
3. **Concise** - Brief and to-the-point
4. **Creative** - Imaginative and expressive
5. **Analytical** - Data-driven and detailed
6. **Supportive** - Encouraging and patient

Users can also upload sample conversations to train a custom personality.

## API Endpoints

### GET `/api/user/onboarding`
Fetch user's onboarding progress

**Response:**
```json
{
  "success": true,
  "progress": {
    "currentStep": "personality",
    "completedSteps": ["welcome", "profile"],
    "userData": { ... },
    "personality": { ... }
  }
}
```

### POST `/api/user/onboarding`
Save onboarding progress

**Request:**
```json
{
  "currentStep": "personality",
  "completedSteps": ["welcome", "profile"],
  "userData": { ... },
  "personality": { ... }
}
```

## Styling

The system uses DONNA's theme colors:
- `donna-purple` - Primary accent
- `donna-cyan` - Secondary accent
- Glass morphism effects
- Neon gradients

## Events

### Emitted Events

- `donna:tour-complete` - Tour finished
- `donna:tour-skip` - Tour skipped
- `donna:onboarding-complete` - Onboarding finished

### Listened Events

- `donna:tour-control` - Control tour from chat
- `donna:start-speaking` - DONNA starts speaking
- `donna:stop-speaking` - DONNA stops speaking

## Best Practices

1. **Keep tours short** - 5-8 steps maximum for full tours
2. **Use clear descriptions** - Explain what and why
3. **Add skip options** - Never force users through tours
4. **Test positioning** - Ensure tooltips don't overflow
5. **Use beforeShow hooks** - Scroll elements into view
6. **Provide context** - Explain how features help users


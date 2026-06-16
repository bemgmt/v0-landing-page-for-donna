# DONNA Onboarding & Tour System - Cursor Integration Guide

## Overview

This guide explains how Cursor (backend/AI logic) can trigger and control the onboarding and tour system built by Augment (frontend).

## Architecture

The system uses **Custom Events** for communication between Cursor and the frontend tour system. This allows Cursor to trigger tours, control playback, and respond to user actions without tight coupling.

## Triggering Tours from Chat

### Starting a Tour

When a user asks DONNA to show them around or explain a feature, Cursor can trigger a tour:

```javascript
// From Cursor/backend
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: {
    action: 'start',
    tourId: 'dashboard-full-tour' // or any tour ID
  }
}))
```

### Available Tour IDs

**Full Tours:**
- `dashboard-full-tour` - Complete dashboard walkthrough (~5 min)

**Section Tours:**
- `email-section-tour` - Email management deep dive
- `analytics-section-tour` - Analytics and insights
- `sales-section-tour` - Sales dashboard features
- `marketing-section-tour` - Marketing tools
- `settings-section-tour` - Settings and preferences

**Mini Tours:**
- `quick-tips` - Quick shortcuts and tips (~2 min)

### Tour Control Actions

```javascript
// Pause current tour
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: { action: 'pause' }
}))

// Resume paused tour
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: { action: 'resume' }
}))

// Skip current tour
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: { action: 'skip' }
}))

// Go to next step
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: { action: 'next' }
}))

// Go to previous step
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: { action: 'previous' }
}))

// Go to specific step
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: { 
    action: 'goToStep',
    stepId: 'email-inbox' // step ID from tour config
  }
}))
```

## Listening to Tour Events

Cursor can listen for tour events to provide contextual help:

```javascript
// Tour completed
window.addEventListener('donna:tour-complete', (event) => {
  const { tourId } = event.detail
  console.log(`Tour ${tourId} completed!`)
  // Cursor can congratulate user or suggest next steps
})

// Tour skipped
window.addEventListener('donna:tour-skip', (event) => {
  const { tourId } = event.detail
  console.log(`Tour ${tourId} skipped`)
  // Cursor can offer to help differently
})

// Onboarding completed
window.addEventListener('donna:onboarding-complete', (event) => {
  console.log('User completed onboarding!')
  // Cursor can welcome user and offer assistance
})
```

## Natural Language Tour Triggers

Here are example user queries and how Cursor should respond:

### User: "Show me around"
```javascript
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: {
    action: 'start',
    tourId: 'dashboard-full-tour'
  }
}))
```
**DONNA Response:** "I'd love to show you around! Let me give you a quick tour of your dashboard."

### User: "How do I use email?"
```javascript
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: {
    action: 'start',
    tourId: 'email-section-tour'
  }
}))
```
**DONNA Response:** "Great question! Let me walk you through the email features."

### User: "Pause the tour"
```javascript
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: { action: 'pause' }
}))
```
**DONNA Response:** "Tour paused! Just let me know when you're ready to continue."

### User: "Skip this"
```javascript
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: { action: 'skip' }
}))
```
**DONNA Response:** "No problem! I've ended the tour. Feel free to ask me anything!"

### User: "Continue the tour"
```javascript
window.dispatchEvent(new CustomEvent('donna:tour-control', {
  detail: { action: 'resume' }
}))
```
**DONNA Response:** "Let's continue! Here's what's next..."

## Creating Custom Tours

Cursor can request custom tours for specific features. Create a tour config and pass it:

```javascript
const customTour = {
  id: 'custom-feature-tour',
  type: 'section',
  title: 'Custom Feature Tour',
  description: 'Learn about this specific feature',
  canSkip: true,
  canPause: true,
  steps: [
    {
      id: 'step-1',
      target: '[data-tour="my-element"]',
      title: 'Step 1',
      description: 'This is what this does...',
      placement: 'bottom'
    }
  ]
}

// Trigger custom tour
window.dispatchEvent(new CustomEvent('donna:tour-requested', {
  detail: { tour: customTour }
}))
```

## Onboarding State

Check if user has completed onboarding:

```javascript
// Check localStorage
const onboardingState = localStorage.getItem('donna_onboarding_state')
if (onboardingState) {
  const state = JSON.parse(onboardingState)
  if (state.isComplete) {
    // User has completed onboarding
  }
}

// Or check via API
const response = await fetch('/api/user/onboarding')
const { progress } = await response.json()
```

## Best Practices

1. **Always provide context** - Tell users what you're about to show them
2. **Respect user control** - Honor pause/skip requests immediately
3. **Offer alternatives** - If user skips tour, offer to answer questions
4. **Track completion** - Note which tours users have seen
5. **Suggest relevant tours** - Based on user's current task
6. **Don't interrupt** - Don't start tours during active work
7. **Celebrate completion** - Acknowledge when users finish tours

## Example Chat Flow

```
User: "I'm new here, can you help me get started?"

DONNA: "Welcome! I'd be happy to help you get started. I can give you:
1. A full tour of the dashboard (~5 min)
2. Quick tips to get you going (~2 min)
3. Or just answer your questions as you explore

What would you prefer?"

User: "Quick tips please"

DONNA: "Perfect! Let me show you the essentials."
[Triggers quick-tips tour]

User: "Actually, pause that for a second"

DONNA: "No problem, paused! Take your time."
[Pauses tour]

User: "Okay, continue"

DONNA: "Great! Let's keep going..."
[Resumes tour]
```


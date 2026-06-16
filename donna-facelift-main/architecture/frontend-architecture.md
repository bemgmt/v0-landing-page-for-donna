# Frontend Architecture

## Overview

The DONNA frontend is built with **Next.js 14** using the App Router pattern, providing a modern, performant, and scalable user interface. The architecture emphasizes component reusability, type safety, and seamless integration with the PHP backend.

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom styling
- **Animation**: Framer Motion for smooth transitions
- **State Management**: React hooks and context providers
- **Build Tool**: Next.js built-in bundler with SWC

## Directory Structure

```
app/
├── layout.tsx              # Root layout with global providers
├── page.tsx                # Home page with interactive grid
├── globals.css             # Global styles and Tailwind imports
├── error.tsx               # Error boundary component
├── not-found.tsx           # 404 page
├── api/                    # Next.js API routes
│   ├── realtime/
│   │   └── token/
│   │       └── route.ts    # OpenAI Realtime API token generation
│   └── voice/
│       ├── events/
│       │   └── route.ts    # Voice event logging
│       └── fanout/
│           └── route.ts    # Event fanout to PHP services
├── chatbot/
│   └── page.tsx            # Dedicated chatbot interface
├── marketing/
│   └── page.tsx            # Marketing dashboard
├── meet/
│   └── page.tsx            # Meeting interface
├── sales/
│   └── page.tsx            # Sales dashboard
└── secretary/
    └── page.tsx            # Secretary interface

components/
├── interactive-grid.tsx    # Main dashboard grid component
├── chat/
│   └── ChatWidget.tsx      # Floating chat widget
├── voice/
│   ├── VoiceProvider.tsx   # Voice context provider
│   └── VoiceNavButton.tsx  # Navigation voice button
├── interfaces/             # Business interface components
│   ├── sales-interface.tsx
│   ├── email-interface.tsx
│   ├── chatbot-control-interface.tsx
│   ├── secretary-interface.tsx
│   ├── lead-generator-interface.tsx
│   ├── receptionist-interface.tsx
│   ├── analytics-interface.tsx
│   ├── settings-interface.tsx
│   └── campaigns/
│       └── CampaignBuilder.tsx
├── ui/                     # Reusable UI components (Radix UI)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── [40+ other components]
├── ServiceStatus.tsx       # API health monitoring
├── CampaignDashboard.tsx   # Campaign management
├── grid-loading.tsx        # Loading states
└── no-ssr.tsx             # Client-side only wrapper

hooks/
├── use-openai-realtime.ts  # OpenAI Realtime API integration
├── use-voice-chat.ts       # Batch voice processing
├── use-audio-recorder.ts   # Audio recording functionality
├── use-audio-player.ts     # Audio playback functionality
├── use-mobile.ts           # Mobile device detection
├── use-toast.ts            # Toast notifications
└── use-realtime-voice.ts   # Real-time voice processing

lib/
├── api.ts                  # API client utilities
├── types.ts                # TypeScript type definitions
├── utils.ts                # Utility functions
├── voice-tools.ts          # Voice processing utilities
└── realtime-websocket-client.js # WebSocket client
```

## Core Components

### 1. Interactive Grid (`components/interactive-grid.tsx`)

The main dashboard component that provides a 3D interactive grid interface for accessing different business functions.

**Key Features:**
- 3D hover effects with smooth animations
- Zoom-based navigation (scroll to zoom, click to enter)
- Dynamic content previews for each interface
- Responsive design with mobile support

**Technical Implementation:**
- Uses Framer Motion for 3D transforms and animations
- Implements custom zoom logic with cursor-based transform origins
- Manages state for hovered items, zoom levels, and selected interfaces
- Integrates with voice system for hands-free navigation

### 2. Chat Widget (`components/chat/ChatWidget.tsx`)

A floating chat widget that provides real-time communication with DONNA using the OpenAI Realtime API.

**Key Features:**
- Floating button with smooth open/close animations
- Real-time voice and text communication
- Message history with proper formatting
- Connection status monitoring

**Technical Implementation:**
- Uses `useOpenAIRealtime` hook for WebSocket communication
- Implements custom event system for opening/closing
- Handles both text and voice input/output
- Provides fallback UI for connection issues

### 3. Voice Provider (`components/voice/VoiceProvider.tsx`)

Context provider that manages voice-related state and functionality across the application.

**Key Features:**
- Global voice state management
- Audio recording and playback coordination
- Voice system initialization and cleanup
- Cross-component voice event handling

### 4. Business Interfaces

Each business interface is a specialized component for different AI personas:

#### Sales Interface (`components/interfaces/sales-interface.tsx`)
- Contact and lead management
- Campaign creation and tracking
- Sales analytics and reporting
- Integration with CRM functionality

#### Email Interface (`components/interfaces/email-interface.tsx`)
- Gmail API integration
- Email classification and prioritization
- Inbox management with filtering
- Email composition and sending

#### Secretary Interface (`components/interfaces/secretary-interface.tsx`)
- Task and calendar management
- Meeting scheduling
- Document organization
- Administrative workflow automation

## Custom Hooks

### 1. `useOpenAIRealtime` (`hooks/use-openai-realtime.ts`)

Manages real-time communication with OpenAI's Realtime API through WebSocket connections.

**Features:**
- WebSocket connection management
- Audio streaming and processing
- Message handling and state updates
- Error handling and reconnection logic

**API:**
```typescript
const [state, actions] = useOpenAIRealtime({
  apiBaseUrl: string,
  instructions: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
  temperature: number,
  onMessage: (message) => void,
  onError: (error) => void,
  onConnect: () => void,
  onDisconnect: () => void
})
```

### 2. `useVoiceChat` (`hooks/use-voice-chat.ts`)

Handles batch voice processing using ElevenLabs for high-quality voice synthesis.

**Features:**
- Audio recording and playback
- Text-to-speech conversion
- Voice ID management
- Batch processing workflow

### 3. `useAudioRecorder` (`hooks/use-audio-recorder.ts`)

Provides audio recording functionality with proper browser API handling.

**Features:**
- Media device access management
- Audio stream processing
- Recording state management
- Audio format conversion

## State Management

### Context Providers

1. **VoiceProvider**: Manages global voice state and audio processing
2. **ThemeProvider**: Handles dark/light mode and UI theming
3. **ToastProvider**: Manages notification system

### Local State

Each component manages its own local state using React hooks:
- `useState` for component-specific state
- `useEffect` for side effects and API calls
- `useCallback` and `useMemo` for performance optimization

### API State Management

API calls are handled through custom hooks that provide:
- Loading states
- Error handling
- Data caching
- Retry logic

## Styling System

### Tailwind CSS Configuration

The application uses a custom Tailwind configuration with:
- Dark theme as default
- Custom color palette for DONNA branding
- Responsive breakpoints
- Custom animations and transitions

### Component Styling

- **Radix UI**: Base components with accessibility features
- **Custom Styling**: Tailwind classes for visual design
- **Framer Motion**: Animation and transition effects
- **CSS Variables**: Dynamic theming support

## Performance Optimizations

### 1. Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting with Next.js
- Lazy loading for non-critical components

### 2. Bundle Optimization
- Tree shaking for unused code
- Image optimization with Next.js Image component
- Font optimization with Next.js Font optimization

### 3. Runtime Performance
- Memoization with `useMemo` and `useCallback`
- Virtual scrolling for large lists
- Debounced API calls
- Optimistic UI updates

## Accessibility

### ARIA Support
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### Responsive Design
- Mobile-first approach
- Touch-friendly interfaces
- Adaptive layouts
- Performance on low-end devices

## Error Handling

### Error Boundaries
- Global error boundary in root layout
- Component-level error boundaries
- Graceful degradation for API failures

### User Feedback
- Toast notifications for errors
- Loading states for async operations
- Retry mechanisms for failed requests
- Fallback UI for missing data

## Development Workflow

### TypeScript Integration
- Strict type checking
- Interface definitions for all components
- API response typing
- Custom hook typing

### Development Tools
- ESLint for code quality
- Prettier for code formatting
- TypeScript compiler for type checking
- Next.js development server with hot reload

### Testing Strategy
- Component testing with React Testing Library
- API integration testing
- E2E testing for critical user flows
- Performance testing with Lighthouse

## Build and Deployment

### Build Process
- Next.js production build
- TypeScript compilation
- CSS optimization
- Asset optimization

### Deployment
- Vercel deployment for frontend
- Static asset optimization
- CDN integration
- Environment variable management

---

*This frontend architecture supports the complex requirements of the DONNA platform while maintaining performance, accessibility, and developer experience.*


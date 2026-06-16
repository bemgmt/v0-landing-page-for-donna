# DONNA Onboarding Logic & On-Demand Tour System - Implementation Summary

## Overview

This document summarizes the backend implementation of DONNA's onboarding flow and on-demand tour system. The implementation focuses on logic, state management, and command handling - not UI rendering.

## Database Schema

### New Tables Created

1. **onboarding_state** - Tracks user onboarding progress
   - Fields: name, business_name, documents_uploaded, personality_configured
   - State: onboarding_completed, current_step
   - Tracks progress and completion status

2. **personality_config** - Stores personality configurations
   - Supports preset personalities (sales-driven, professional, humorous, etc.)
   - Supports custom personalities from uploaded conversations
   - Links to user and stores full config as JSONB

3. **tour_modules** - Registry of available tour modules
   - Module definitions with step sequences
   - Text payloads and UI hook references
   - Section mappings

4. **tour_sessions** - Active tour sessions
   - Tracks tour state (running, paused, completed, cancelled)
   - Current step tracking
   - Progress tracking (completed/skipped steps)

5. **tour_commands** - Log of tour commands
   - Command history with intent detection
   - Confidence scores
   - Original user messages

## Core Classes

### 1. OnboardingStateManager (`lib/OnboardingStateManager.php`)
- Manages onboarding state persistence
- Tracks missing fields
- Handles onboarding completion
- Provides progress tracking

**Key Methods:**
- `getOnboardingState()` - Get current state
- `isFirstTimeUser()` - Check if user is new
- `isOnboardingCompleted()` - Check completion status
- `getMissingFields()` - Get fields that need completion
- `updateField()` - Update a specific field
- `completeOnboarding()` - Mark onboarding as complete
- `getProgress()` - Get completion percentage

### 2. ConversationalIntakeHandler (`lib/ConversationalIntakeHandler.php`)
- Handles natural language onboarding conversations
- Processes user responses conversationally
- Supports skip/later responses
- Confirms data before saving

**Key Methods:**
- `processResponse()` - Process user message in onboarding context
- `generateQuestionForStep()` - Generate question for next step
- `confirmData()` - Confirm and save captured data
- `isSkipResponse()` - Detect skip/later responses

### 3. PersonalityConfigManager (`lib/PersonalityConfigManager.php`)
- Manages personality configuration storage
- Supports preset personalities
- Supports custom personalities from uploads
- Provides personality data for DONNA responses

**Key Methods:**
- `getPersonalityConfig()` - Get user's personality
- `setPresetPersonality()` - Set from preset
- `setPersonalityFromUpload()` - Set from uploaded conversations
- `setPersonalityFromText()` - Set from pasted text
- `getPersonalityForDONNA()` - Get config for use in responses

**Preset Personalities:**
- sales-driven
- professional
- humorous
- supportive
- technical

### 4. IntentDetector (`lib/IntentDetector.php`)
- Detects tour-related intents from user messages
- Pattern matching for tour commands
- Section mapping
- Confidence scoring

**Supported Intents:**
- `full_tour` - "give me a tour", "show me around"
- `section_tour` - "explain the marketing tab", "help me with inbox"
- `tour_stop` - "stop the tour"
- `tour_next` - "next step", "skip this"
- `tour_pause` - "pause the tour"
- `tour_resume` - "resume the tour"

### 5. TourModuleRegistry (`lib/TourModuleRegistry.php`)
- Manages tour modules as independent units
- Module registration and retrieval
- Step sequence management
- UI hook references

**Key Methods:**
- `getAllModules()` - Get all active modules
- `getModule()` - Get module by ID
- `getModuleBySection()` - Get module for section
- `getModuleSteps()` - Get all steps for a module
- `getStepData()` - Get data for specific step

### 6. TourController (`lib/TourController.php`)
- Manages tour state and execution
- Processes tour commands
- Tracks progress
- Handles tour lifecycle

**Key Methods:**
- `startTour()` - Start a new tour
- `getActiveTour()` - Get current active tour
- `processCommand()` - Process tour command
- `nextStep()` - Move to next step
- `skipStep()` - Skip current step
- `pauseTour()` - Pause tour
- `resumeTour()` - Resume paused tour
- `stopTour()` - Stop/cancel tour
- `logCommand()` - Log command execution

### 7. DatabaseQueryHelper (`lib/DatabaseQueryHelper.php`)
- Unified interface for SQL queries
- Works with PostgreSQL and Supabase
- Parameterized query support

## API Endpoints

### Onboarding API (`api/user/onboarding.php`)

**GET /api/user/onboarding.php?action=status**
- Get onboarding state and progress

**GET /api/user/onboarding.php?action=next_question**
- Get next question to ask user

**POST /api/user/onboarding.php**
- `action=process_response` - Process conversational response
- `action=update_field` - Update specific field
- `action=confirm_data` - Confirm and save data
- `action=complete` - Mark onboarding complete
- `action=reset` - Reset onboarding (dev only)

### Personality API (`api/user/personality.php`)

**GET /api/user/personality.php?action=current**
- Get current personality configuration

**GET /api/user/personality.php?action=presets**
- Get available preset personalities

**GET /api/user/personality.php?action=for_donna**
- Get personality config for DONNA responses

**POST /api/user/personality.php**
- `type=preset` - Set preset personality
- `type=upload` - Set from uploaded conversations
- `type=text` - Set from pasted text

### Tours API (`api/tours.php`)

**GET /api/tours.php?action=status**
- Get active tour status

**GET /api/tours.php?action=modules**
- Get all available tour modules

**GET /api/tours.php?action=module&module_id=...**
- Get specific module details

**GET /api/tours.php?action=steps&module_id=...**
- Get steps for a module

**POST /api/tours.php**
- `command=start` - Start a tour
- `command=stop` - Stop tour
- `command=next` - Next step
- `command=skip` - Skip step
- `command=pause` - Pause tour
- `command=resume` - Resume tour
- Or send `message` to auto-detect intent

## Integration with DONNA Logic

The system is integrated into `api/donna_logic.php`:

1. **Onboarding Detection**: Automatically detects if user needs onboarding and processes conversational responses
2. **Intent Detection**: Detects tour-related intents from user messages
3. **Tour Triggering**: Automatically starts tours when intents are detected
4. **Personality Integration**: Loads user's personality configuration into system prompts

## Usage Examples

### Starting Onboarding
```php
// User sends: "Hi, I'm new here"
// System detects first-time user
// Returns: "Hi! I'm DONNA. What should I call you?"
```

### Processing Onboarding Response
```php
// User sends: "My name is John"
// System extracts name, saves it, asks next question
// Returns: "Nice to meet you, John! What's the name of your business?"
```

### Triggering Tour
```php
// User sends: "give me a tour"
// System detects full_tour intent
// Starts tour_dashboard module
// Returns tour step data
```

### Section-Specific Tour
```php
// User sends: "explain the marketing tab"
// System detects section_tour intent, maps to marketing section
// Starts tour_marketing module
// Returns first step of marketing tour
```

## Database Migration

Run the migration script to create all necessary tables:

```bash
psql -U your_user -d your_database -f scripts/migrations/add-onboarding-tour-tables.sql
```

Or in Supabase SQL Editor, copy and run the SQL from the migration file.

## Frontend Integration Hooks

The system provides clear interfaces for frontend integration:

1. **Onboarding State**: Check `/api/user/onboarding.php?action=status` to determine if onboarding is needed
2. **Tour Modules**: Get available modules from `/api/tours.php?action=modules`
3. **Tour State**: Poll `/api/tours.php?action=status` to get current tour state
4. **Step Data**: Each step includes `text`, `ui_hooks`, and `step_id` for frontend rendering

## Next Steps

1. **Frontend Implementation**: Create UI components for onboarding flow and tour rendering
2. **Enhanced Intent Detection**: Add NLP/AI-based intent detection for better accuracy
3. **Tour Analytics**: Track tour completion rates and user engagement
4. **Custom Tour Creation**: Allow admins to create custom tour modules
5. **Personality Refinement**: Improve personality analysis from uploaded conversations

## Testing

Test the implementation:

```bash
# Test onboarding API
curl -X GET "http://localhost:3000/api/user/onboarding.php?action=status" \
  -H "Authorization: Bearer YOUR_JWT"

# Test tour API
curl -X POST "http://localhost:3000/api/tours.php" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "give me a tour"}'
```

## Notes

- All endpoints require authentication
- Onboarding state persists across sessions
- Tours can be triggered anytime, regardless of onboarding status
- Personality configuration affects all DONNA responses
- Intent detection uses pattern matching (can be enhanced with NLP)


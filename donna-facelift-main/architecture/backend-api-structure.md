# Backend API Structure

## Overview

The DONNA backend is built with **PHP 8+** and provides a comprehensive API layer for AI processing, business logic, and third-party integrations. The architecture emphasizes modularity, security, and scalability while maintaining compatibility with shared hosting environments.

## Technology Stack

- **Language**: PHP 8+ with modern syntax
- **API Pattern**: RESTful endpoints with JSON responses
- **Authentication**: API key-based authentication
- **Data Storage**: File-based JSON storage (expandable to database)
- **External APIs**: cURL for HTTP requests
- **Environment**: XAMPP/LAMP stack compatible

## Directory Structure

```
api/
├── donna_logic.php              # Core AI processing engine
├── health.php                   # Health check endpoint
├── conversations.php            # Conversation management
├── chatbot_settings.php         # Chatbot configuration
├── realtime-websocket.php       # WebSocket proxy for OpenAI Realtime
├── voice-chat.php               # Batch voice processing
├── marketing.php                # Email marketing integration
├── marketing-simple.php         # Simplified marketing API
├── test-marketing.php           # Marketing API testing
├── test-env.php                 # Environment testing
├── lib/
│   └── mail.php                 # Email utilities and SMTP
├── sales/
│   └── overview.php             # Sales dashboard API
└── secretary/
    └── dashboard.php            # Secretary interface API

voice_system/
├── openai_realtime_client.php   # OpenAI Realtime API client
├── elevenlabs_client.php        # ElevenLabs voice synthesis client
└── openai_client.php            # OpenAI API client

public_html/
├── donna/
│   └── donna_logic.php          # Shim for backward compatibility
└── bootstrap_env.php            # Environment variable loader
```

## Core API Endpoints

### 1. Core AI Processing (`api/donna_logic.php`)

The main AI processing engine that handles all AI interactions with different personas.

**Endpoint**: `POST /api/donna_logic.php`

**Request Format**:
```json
{
  "message": "User message text",
  "chat_id": "unique-chat-identifier",
  "user_id": "optional-user-id",
  "user_email": "optional-user-email",
  "user_profile": "general|sales|receptionist|marketing"
}
```

**Response Format**:
```json
{
  "success": true,
  "reply": "AI response text",
  "action": "action-type",
  "metadata": {
    "profile": "user-profile",
    "abuse_detected": false,
    "chat_id": "chat-identifier",
    "authenticated": true
  }
}
```

**Key Features**:
- **Multi-Persona Support**: Different AI behaviors based on user profile
- **Abuse Detection**: Content filtering and logging
- **Memory Management**: User-specific memory persistence
- **Command Processing**: Email sending, lead classification, campaign management
- **Fallback Handling**: SDK and cURL fallbacks for OpenAI API

**Technical Implementation**:
- Environment variable loading with multiple fallback paths
- Composer autoloader integration
- Chat history management with file-based storage
- User memory persistence for authenticated users
- Command processing for business actions

### 2. Health Check (`api/health.php`)

Simple health check endpoint for monitoring API status.

**Endpoint**: `GET /api/health.php`

**Response**:
```json
{
  "ok": true,
  "service": "donna-api",
  "version": "v1",
  "time": 1699123456
}
```

### 3. Voice Chat (`api/voice-chat.php`)

Handles batch voice processing with ElevenLabs integration.

**Endpoint**: `POST /api/voice-chat.php`

**Request Format**:
```json
{
  "action": "synthesize|get_voices|test_connection",
  "text": "Text to synthesize",
  "voice_id": "elevenlabs-voice-id",
  "user_id": "user-identifier"
}
```

**Response Format**:
```json
{
  "success": true,
  "audio_url": "path-to-generated-audio",
  "voice_id": "used-voice-id",
  "duration": 3.5
}
```

### 4. Marketing API (`api/marketing.php`)

Email marketing and Gmail integration endpoint.

**Endpoint**: `GET/POST /api/marketing.php`

**Query Parameters**:
- `action`: `inbox|send|classify|stats`
- `limit`: Number of emails to fetch
- `category`: Email category filter

**Response Format**:
```json
{
  "success": true,
  "data": {
    "emails": [...],
    "count": 25,
    "stats": {
      "unread": 5,
      "starred": 3,
      "categories": {...}
    }
  }
}
```

### 5. Sales API (`api/sales/overview.php`)

Sales dashboard and CRM functionality.

**Endpoint**: `GET/POST /api/sales/overview.php`

**Actions**:
- `get_data`: Fetch sales dashboard data
- `add_contact`: Add new contact
- `update_lead`: Update lead status
- `send_email`: Send email to contact

### 6. Secretary API (`api/secretary/dashboard.php`)

Secretary interface and task management.

**Endpoint**: `GET/POST /api/secretary/dashboard.php`

**Actions**:
- `get_tasks`: Fetch task list
- `add_task`: Create new task
- `update_task`: Update task status
- `get_schedule`: Fetch calendar data

## Voice System Architecture

### 1. OpenAI Realtime Client (`voice_system/openai_realtime_client.php`)

PHP client for OpenAI's Realtime API with WebSocket support.

**Key Features**:
- Session management
- Audio format conversion
- Message processing
- Error handling

**Methods**:
```php
class OpenAIRealtimeClient {
    public function createSession($customConfig = [])
    public function connectWebSocket($sessionId)
    public function sendAudio($audioData, $sessionId)
    public function commitAudio($sessionId)
    public function createResponse($sessionId, $config = [])
    public function processMessage($message)
}
```

### 2. ElevenLabs Client (`voice_system/elevenlabs_client.php`)

Comprehensive client for ElevenLabs voice synthesis API.

**Key Features**:
- Text-to-speech conversion
- Voice management
- Audio streaming
- Voice cloning support

**Methods**:
```php
class ElevenLabsClient {
    public function getVoices()
    public function textToSpeech($text, $voiceId = null, $options = [])
    public function textToSpeechStream($text, $voiceId = null, $options = [])
    public function getVoice($voiceId)
    public function getUserInfo()
    public function cloneVoice($name, $description, $files, $labels = [])
}
```

## Data Storage

### File-Based Storage

The system uses JSON files for data persistence:

```
data/
├── chat_sessions/           # Chat conversation history
│   ├── {chat_id}.json
│   └── default.json
├── memory/                  # User memory and preferences
│   ├── {user_id}.json
│   └── guest_thread.json
├── chatbot_settings.json    # Chatbot configuration
└── logs/                    # System logs
    ├── donna_errors.log
    └── abuse.log
```

### Data Structures

**Chat Session Format**:
```json
[
  {
    "role": "user|assistant|system",
    "content": "Message content",
    "timestamp": "2024-01-01T12:00:00Z"
  }
]
```

**User Memory Format**:
```json
{
  "name": "User Name",
  "company": "Company Name",
  "preferences": ["preference1", "preference2"],
  "interactions": 42,
  "last_interaction": "2024-01-01T12:00:00Z"
}
```

## Environment Configuration

### Bootstrap System (`bootstrap_env.php`)

Centralized environment variable loading system.

**Features**:
- Multiple fallback paths for .env file location
- Support for shared hosting environments
- Simple .env parser with quote handling
- Population of all PHP environment sources

**Usage**:
```php
require_once __DIR__ . '/../bootstrap_env.php';
$apiKey = getenv('OPENAI_API_KEY');
```

### Required Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key
DEFAULT_VOICE_ID=XcXEQzuLXRU9RcfWzEJt
VOICE_MODEL=eleven_multilingual_v2

# System Configuration
DOMAIN_NAME=your-domain.com
ENVIRONMENT=production|development
DEBUG_MODE=true|false
```

## Security Features

### 1. CORS Configuration

All API endpoints include proper CORS headers:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

### 2. Input Validation

- JSON input validation
- SQL injection prevention (when using databases)
- XSS protection through output encoding
- Rate limiting considerations

### 3. Error Handling

- Comprehensive error logging
- Graceful error responses
- No sensitive information in error messages
- Abuse detection and logging

### 4. API Key Management

- Environment variable storage
- Secure API key transmission
- Key rotation support
- Access logging

## Performance Optimizations

### 1. Caching

- File-based caching for API responses
- Session data caching
- Voice synthesis result caching

### 2. Connection Pooling

- cURL connection reuse
- WebSocket connection management
- Database connection pooling (when implemented)

### 3. Async Processing

- Non-blocking API calls where possible
- Background task processing
- Queue system for heavy operations

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Logging System

- Structured error logging
- Performance metrics logging
- User action logging
- API usage tracking

## API Versioning

### Version Strategy

- URL-based versioning: `/api/v1/endpoint`
- Header-based versioning: `API-Version: v1`
- Backward compatibility maintenance

### Deprecation Policy

- 6-month notice for breaking changes
- Graceful degradation for deprecated endpoints
- Migration guides for API updates

## Testing

### Test Endpoints

- `test-env.php`: Environment configuration testing
- `test-marketing.php`: Marketing API testing
- Health check endpoints for all services

### Test Data

- Mock data for development
- Test user accounts
- Sample conversations and responses

## Deployment Considerations

### Shared Hosting Compatibility

- No server-side dependencies beyond PHP
- File-based storage for easy backup
- Environment variable support
- cURL and JSON extension requirements

### Scalability

- Horizontal scaling support
- Load balancer compatibility
- Database migration path
- Microservice architecture potential

---

*This backend architecture provides a robust foundation for the DONNA platform while maintaining simplicity and compatibility with various hosting environments.*


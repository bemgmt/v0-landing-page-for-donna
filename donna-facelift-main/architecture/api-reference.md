# API Reference

## Overview

This document provides a comprehensive reference for all API endpoints in the DONNA platform, including request/response formats, authentication, error handling, and usage examples.

## Base URLs

### Development
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost/donna/api`
- **WebSocket**: `ws://localhost:3001/realtime`

### Production
- **Frontend**: `https://yourdomain.vercel.app`
- **Backend**: `https://yourdomain.com/donna/api`
- **WebSocket**: `wss://your-websocket-server.com/realtime`

## Authentication

### API Key Authentication
All API endpoints require authentication via API keys passed in environment variables or request headers.

**Headers**:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### CORS Configuration
All endpoints include proper CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Core API Endpoints

### 1. Health Check

**Endpoint**: `GET /api/health.php`

**Description**: Simple health check endpoint for monitoring API status.

**Request**:
```http
GET /api/health.php
```

**Response**:
```json
{
  "ok": true,
  "service": "donna-api",
  "version": "v1",
  "time": 1699123456
}
```

**Error Response**:
```json
{
  "ok": false,
  "error": "Service unavailable",
  "time": 1699123456
}
```

### 2. Core AI Processing

**Endpoint**: `POST /api/donna_logic.php`

**Description**: Main AI processing engine that handles all AI interactions with different personas.

**Request**:
```http
POST /api/donna_logic.php
Content-Type: application/json

{
  "message": "Hello, I need help with sales",
  "chat_id": "chat-12345",
  "user_id": "user-67890",
  "user_email": "user@example.com",
  "user_profile": "sales"
}
```

**Request Parameters**:
- `message` (string, required): User message text
- `chat_id` (string, optional): Unique chat identifier (defaults to guest timestamp)
- `user_id` (string, optional): User identifier for authenticated users
- `user_email` (string, optional): User email for authenticated users
- `user_profile` (string, optional): AI persona profile (`general`, `sales`, `receptionist`, `marketing`)

**Response**:
```json
{
  "success": true,
  "reply": "Hello! I'm DONNA, your sales-focused AI assistant. How can I help you with your sales needs today?",
  "action": "chat",
  "metadata": {
    "profile": "sales",
    "abuse_detected": false,
    "chat_id": "chat-12345",
    "authenticated": true
  }
}
```

**Response Fields**:
- `success` (boolean): Request success status
- `reply` (string): AI-generated response
- `action` (string): Action taken (`chat`, `email_sent`, `classify_lead`, etc.)
- `metadata` (object): Additional response metadata

**Error Response**:
```json
{
  "success": false,
  "reply": "❌ I'm experiencing technical difficulties. Please try again in a moment.",
  "error": "API_ERROR"
}
```

**Available Actions**:
- `chat`: Standard conversation
- `email_sent`: Email was sent successfully
- `classify_lead`: Lead was classified
- `start_campaign`: Campaign was initiated
- `email_spam`: Email was flagged as spam
- `email_lead`: Email was identified as a lead

### 3. Voice Chat (Batch Processing)

**Endpoint**: `POST /api/voice-chat.php`

**Description**: Handles batch voice processing with ElevenLabs integration for high-quality voice synthesis.

**Request**:
```http
POST /api/voice-chat.php
Content-Type: application/json

{
  "action": "synthesize",
  "text": "Hello, I am DONNA. How can I help you today?",
  "voice_id": "XcXEQzuLXRU9RcfWzEJt",
  "user_id": "user-12345"
}
```

**Request Parameters**:
- `action` (string, required): Action to perform (`synthesize`, `get_voices`, `test_connection`)
- `text` (string, required for synthesize): Text to convert to speech
- `voice_id` (string, optional): ElevenLabs voice ID (defaults to custom DONNA voice)
- `user_id` (string, optional): User identifier
- `audio_data` (string, optional): Base64-encoded audio data for speech recognition

**Response**:
```json
{
  "success": true,
  "audio_url": "/audio/donna_audio_1699123456.mp3",
  "voice_id": "XcXEQzuLXRU9RcfWzEJt",
  "duration": 3.5,
  "transcript": "Recognized speech text"
}
```

**Response Fields**:
- `success` (boolean): Request success status
- `audio_url` (string): URL to generated audio file
- `voice_id` (string): Voice ID used for synthesis
- `duration` (number): Audio duration in seconds
- `transcript` (string): Speech recognition result (if audio_data provided)

**Get Available Voices**:
```http
POST /api/voice-chat.php
Content-Type: application/json

{
  "action": "get_voices"
}
```

**Response**:
```json
{
  "success": true,
  "voices": [
    {
      "voice_id": "XcXEQzuLXRU9RcfWzEJt",
      "name": "DONNA Custom Voice",
      "description": "Custom voice for DONNA AI assistant"
    },
    {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "description": "Female, American accent"
    }
  ]
}
```

### 4. Marketing API

**Endpoint**: `GET/POST /api/marketing.php`

**Description**: Email marketing and Gmail integration endpoint.

**Get Inbox Emails**:
```http
GET /api/marketing.php?action=inbox&limit=10&category=lead
```

**Query Parameters**:
- `action` (string, required): Action to perform (`inbox`, `send`, `classify`, `stats`)
- `limit` (number, optional): Number of emails to fetch (default: 5)
- `category` (string, optional): Email category filter (`lead`, `client`, `marketing`, `spam`)

**Response**:
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "email-123",
        "from": "John Doe",
        "from_email": "john@example.com",
        "subject": "Interested in your services",
        "preview": "I would like to learn more about...",
        "date": "2024-01-01T12:00:00Z",
        "starred": false,
        "unread": true,
        "category": "lead",
        "priority": "high"
      }
    ],
    "count": 25,
    "stats": {
      "unread": 5,
      "starred": 3,
      "categories": {
        "lead": 8,
        "client": 12,
        "marketing": 3,
        "spam": 2
      }
    }
  }
}
```

**Send Email**:
```http
POST /api/marketing.php
Content-Type: application/json

{
  "action": "send",
  "to": "client@example.com",
  "subject": "Follow up on your inquiry",
  "body": "Thank you for your interest in our services..."
}
```

**Response**:
```json
{
  "success": true,
  "message_id": "msg-12345",
  "status": "sent"
}
```

### 5. Sales API

**Endpoint**: `GET/POST /api/sales/overview.php`

**Description**: Sales dashboard and CRM functionality.

**Get Sales Data**:
```http
GET /api/sales/overview.php
```

**Response**:
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "contact-123",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+1-555-0123",
        "status": "qualified",
        "score": 85,
        "created_at": "2024-01-01T10:00:00Z"
      }
    ],
    "leads": [
      {
        "id": "lead-456",
        "contact_id": "contact-123",
        "status": "hot",
        "score": 90,
        "last_contact": "2024-01-01T14:00:00Z",
        "notes": "Very interested in premium package"
      }
    ],
    "stats": {
      "total_contacts": 150,
      "hot_leads": 12,
      "conversion_rate": 8.5
    }
  }
}
```

**Add Contact**:
```http
POST /api/sales/overview.php
Content-Type: application/json

{
  "action": "add_contact",
  "contact": {
    "name": "New Contact",
    "email": "new@example.com",
    "phone": "+1-555-9999",
    "status": "new",
    "score": 0
  }
}
```

**Update Lead**:
```http
POST /api/sales/overview.php
Content-Type: application/json

{
  "action": "update_lead",
  "lead": {
    "id": "lead-456",
    "status": "converted",
    "score": 95,
    "notes": "Successfully converted to customer"
  }
}
```

### 6. Secretary API

**Endpoint**: `GET/POST /api/secretary/dashboard.php`

**Description**: Secretary interface and task management.

**Get Tasks**:
```http
GET /api/secretary/dashboard.php?action=get_tasks
```

**Response**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-123",
        "title": "Schedule team meeting",
        "description": "Organize weekly team standup",
        "status": "pending",
        "priority": "high",
        "due_date": "2024-01-02T09:00:00Z",
        "created_at": "2024-01-01T08:00:00Z"
      }
    ],
    "schedule": {
      "meetings": [
        {
          "id": "meeting-456",
          "title": "Client Call",
          "time": "2024-01-01T15:00:00Z",
          "duration": 60,
          "attendees": ["client@example.com"]
        }
      ]
    }
  }
}
```

**Add Task**:
```http
POST /api/secretary/dashboard.php
Content-Type: application/json

{
  "action": "add_task",
  "task": {
    "title": "New Task",
    "description": "Task description",
    "priority": "medium",
    "due_date": "2024-01-03T17:00:00Z"
  }
}
```

### 7. Chatbot Settings

**Endpoint**: `GET/POST /api/chatbot_settings.php`

**Description**: Chatbot configuration and settings management.

**Get Settings**:
```http
GET /api/chatbot_settings.php
```

**Response**:
```json
{
  "success": true,
  "data": {
    "greeting": "Hi! I'm DONNA. How can I help?",
    "themeColor": "#2563eb",
    "position": "bottom-right",
    "profile": "general"
  }
}
```

**Update Settings**:
```http
POST /api/chatbot_settings.php
Content-Type: application/json

{
  "greeting": "Welcome! I'm DONNA, your AI assistant.",
  "themeColor": "#10b981",
  "position": "bottom-left",
  "profile": "sales"
}
```

**Response**:
```json
{
  "success": true
}
```

### 8. Conversations

**Endpoint**: `GET /api/conversations.php`

**Description**: Retrieve saved conversation summaries.

**Request**:
```http
GET /api/conversations.php
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "chat-12345",
      "last_message_at": "2024-01-01T12:00:00Z",
      "message_count": 15
    },
    {
      "id": "chat-67890",
      "last_message_at": "2024-01-01T10:30:00Z",
      "message_count": 8
    }
  ]
}
```

## WebSocket API

### Real-time Communication

**Endpoint**: `ws://localhost:3001/realtime` (development)
**Endpoint**: `wss://your-websocket-server.com/realtime` (production)

**Description**: Real-time voice communication using OpenAI Realtime API.

**Connection**:
```javascript
const ws = new WebSocket('ws://localhost:3001/realtime')

ws.onopen = () => {
  // Send connection request
  ws.send(JSON.stringify({
    type: 'connect_realtime'
  }))
}
```

**Message Types**:

**Connect to Realtime API**:
```json
{
  "type": "connect_realtime"
}
```

**Send Audio Data**:
```json
{
  "type": "input_audio_buffer.append",
  "audio": "base64-encoded-pcm16-audio"
}
```

**Commit Audio Buffer**:
```json
{
  "type": "input_audio_buffer.commit"
}
```

**Create Response**:
```json
{
  "type": "response.create",
  "response": {
    "modalities": ["text", "audio"],
    "voice": "alloy",
    "temperature": 0.8
  }
}
```

**Send Text Message**:
```json
{
  "type": "conversation.item.create",
  "item": {
    "type": "message",
    "role": "user",
    "content": [
      {
        "type": "input_text",
        "text": "Hello, how can you help me?"
      }
    ]
  }
}
```

**Response Messages**:

**Session Created**:
```json
{
  "type": "session.created",
  "session": {
    "id": "session-12345",
    "modalities": ["text", "audio"]
  }
}
```

**Speech Started**:
```json
{
  "type": "input_audio_buffer.speech_started",
  "audio_start_ms": 1000,
  "item_id": "item-123"
}
```

**Speech Stopped**:
```json
{
  "type": "input_audio_buffer.speech_stopped",
  "audio_end_ms": 3000,
  "item_id": "item-123"
}
```

**Text Delta**:
```json
{
  "type": "response.audio_transcript.delta",
  "delta": "Hello, I can help you with",
  "item_id": "item-456"
}
```

**Response Completed**:
```json
{
  "type": "response.done",
  "response": {
    "id": "response-789",
    "status": "completed"
  }
}
```

**Error Message**:
```json
{
  "type": "error",
  "error": {
    "message": "Connection failed",
    "code": "connection_error"
  }
}
```

## Next.js API Routes

### 1. Voice Events

**Endpoint**: `POST /api/voice/events`

**Description**: Log voice events for analytics and monitoring.

**Request**:
```http
POST /api/voice/events
Content-Type: application/json

{
  "kind": "text_input",
  "text": "User input text",
  "at": 1699123456789
}
```

**Response**:
```json
{
  "ok": true
}
```

### 2. Voice Fanout

**Endpoint**: `POST /api/voice/fanout`

**Description**: Distribute voice events to multiple services.

**Request**:
```http
POST /api/voice/fanout
Content-Type: application/json

{
  "kind": "voice_event",
  "payload": {
    "user_id": "user-123",
    "action": "voice_start",
    "timestamp": 1699123456789
  }
}
```

**Response**:
```json
{
  "ok": true
}
```

### 3. Realtime Token

**Endpoint**: `POST /api/realtime/token`

**Description**: Generate OpenAI Realtime API tokens.

**Request**:
```http
POST /api/realtime/token
Content-Type: application/json

{
  "model": "gpt-4o-realtime-preview-2024-12-17"
}
```

**Response**:
```json
{
  "token": "realtime-token-12345",
  "expires_at": 1699127056
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-01T12:00:00Z",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded
- `SERVICE_UNAVAILABLE`: External service unavailable
- `INTERNAL_ERROR`: Internal server error
- `NOT_FOUND`: Resource not found
- `PERMISSION_DENIED`: Insufficient permissions

### HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request format
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

## Rate Limiting

### Limits by Service

- **OpenAI API**: 60 requests per minute
- **ElevenLabs API**: 100 requests per minute
- **Gmail API**: 1000 requests per 100 seconds
- **General API**: 1000 requests per hour per IP

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1699127056
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

## Authentication Examples

### Frontend API Calls

```typescript
// Basic API call
const response = await fetch('/api/donna_logic.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello, DONNA!',
    user_profile: 'general'
  })
})

const result = await response.json()
```

### WebSocket Connection

```typescript
const ws = new WebSocket('ws://localhost:3001/realtime')

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'connect_realtime'
  }))
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Received:', data)
}
```

### Error Handling

```typescript
try {
  const response = await fetch('/api/donna_logic.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Unknown error')
  }
  
  return result
} catch (error) {
  console.error('API Error:', error)
  throw error
}
```

## Testing

### Health Check Test

```bash
curl -X GET https://yourdomain.com/donna/api/health.php
```

### AI Processing Test

```bash
curl -X POST https://yourdomain.com/donna/api/donna_logic.php \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, DONNA!",
    "user_profile": "general"
  }'
```

### Voice Synthesis Test

```bash
curl -X POST https://yourdomain.com/donna/api/voice-chat.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "synthesize",
    "text": "Hello, I am DONNA.",
    "voice_id": "XcXEQzuLXRU9RcfWzEJt"
  }'
```

---

*This API reference provides comprehensive documentation for all endpoints in the DONNA platform, enabling developers to integrate and extend the system effectively.*


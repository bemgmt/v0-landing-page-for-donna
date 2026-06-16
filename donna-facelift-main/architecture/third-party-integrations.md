# Third-Party Integrations

## Overview

DONNA integrates with multiple third-party services to provide comprehensive AI-powered business automation. These integrations are designed with modularity, reliability, and scalability in mind, ensuring seamless operation across different service providers.

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DONNA PLATFORM                              │
├─────────────────────────────────────────────────────────────────┤
│  INTEGRATION LAYER                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ OpenAI Suite    │ │ ElevenLabs API  │ │ Gmail API       │   │
│  │ (AI Processing) │ │ (Voice Synthesis│ │ (Email Mgmt)    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ WebSocket APIs  │ │ SMTP Services   │ │ Analytics APIs  │   │
│  │ (Real-time)     │ │ (Email Sending) │ │ (Tracking)      │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ OpenAI          │ │ ElevenLabs      │ │ Google          │   │
│  │ (GPT-4, Whisper)│ │ (Voice TTS)     │ │ (Gmail, Drive)  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## OpenAI Integration

### 1. GPT-4 API Integration

**Purpose**: Core AI processing for all DONNA personas and business logic

**Implementation**: `api/donna_logic.php`

**Key Features**:
- Multi-persona AI processing (sales, marketing, receptionist, secretary)
- Context-aware response generation
- Command processing and action execution
- Abuse detection and content filtering
- User memory and preference management

**API Configuration**:
```php
$model_config = [
    'general' => ['model' => 'gpt-4o', 'temperature' => 0.7],
    'sales' => ['model' => 'gpt-4o', 'temperature' => 0.8],
    'receptionist' => ['model' => 'gpt-4o', 'temperature' => 0.6],
    'marketing' => ['model' => 'gpt-4o', 'temperature' => 0.8]
];
```

**Request Format**:
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are DONNA, a sales-focused AI assistant..."
    },
    {
      "role": "user",
      "content": "User message here"
    }
  ],
  "temperature": 0.8,
  "max_tokens": 500
}
```

**Response Processing**:
- Response validation and sanitization
- Action extraction and processing
- Memory updates for authenticated users
- Error handling and fallback responses

### 2. Whisper API Integration

**Purpose**: Speech-to-text conversion for voice input processing

**Implementation**: Integrated within `api/voice-chat.php`

**Key Features**:
- High-accuracy speech recognition
- Multiple language support
- Audio format conversion
- Batch processing optimization

**Audio Processing Pipeline**:
1. **Audio Reception**: Base64-encoded audio data
2. **Format Conversion**: Convert to Whisper-compatible format
3. **API Call**: Send to OpenAI Whisper API
4. **Text Extraction**: Extract and validate transcript
5. **Processing**: Send transcript to GPT-4 for processing

**Configuration**:
```php
$whisper_config = [
    'model' => 'whisper-1',
    'language' => 'en',
    'response_format' => 'json',
    'temperature' => 0.0
];
```

### 3. OpenAI Realtime API Integration

**Purpose**: Real-time voice communication for receptionist mode

**Implementation**: `websocket-server/server.js` and `voice_system/openai_realtime_client.php`

**Key Features**:
- WebSocket-based real-time communication
- Low-latency voice processing
- Streaming audio and text
- Turn detection and conversation management

**WebSocket Configuration**:
```javascript
const wsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17'
const headers = {
  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  'OpenAI-Beta': 'realtime=v1'
}
```

**Session Configuration**:
```json
{
  "type": "session.update",
  "session": {
    "modalities": ["text", "audio"],
    "instructions": "You are DONNA, a professional AI receptionist.",
    "voice": "alloy",
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "input_audio_transcription": {
      "model": "whisper-1"
    },
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 200
    },
    "temperature": 0.8,
    "max_response_output_tokens": 4096
  }
}
```

## ElevenLabs Integration

### 1. Text-to-Speech API

**Purpose**: High-quality voice synthesis for DONNA's custom voice

**Implementation**: `voice_system/elevenlabs_client.php`

**Key Features**:
- Custom voice synthesis (XcXEQzuLXRU9RcfWzEJt)
- Multiple voice options and languages
- Streaming audio support
- Voice cloning capabilities

**API Configuration**:
```php
class ElevenLabsClient {
    private $apiKey;
    private $baseUrl = 'https://api.elevenlabs.io/v1';
    private $timeout = 30;
}
```

**Voice Settings**:
```php
$voiceSettings = [
    'stability' => 0.5,
    'similarity_boost' => 0.5,
    'style' => 0.0,
    'use_speaker_boost' => true
];
```

**Available Voices**:
- **Custom Voice**: XcXEQzuLXRU9RcfWzEJt (DONNA's primary voice)
- **Popular Voices**: Rachel, Drew, Clyde, Paul, Domi, Dave, Fin, Sarah
- **Voice Categories**: Male/Female, American/British/Australian accents

**Text-to-Speech Request**:
```php
$requestData = [
    'text' => $text,
    'model_id' => 'eleven_monolingual_v1',
    'voice_settings' => $voiceSettings
];
```

### 2. Voice Management

**Features**:
- Voice library management
- Voice cloning support
- Voice quality optimization
- Usage tracking and analytics

**Voice Cloning**:
```php
public function cloneVoice($name, $description, $files, $labels = []) {
    $url = $this->baseUrl . '/voices/add';
    $postFields = [
        'name' => $name,
        'description' => $description,
        'labels' => json_encode($labels)
    ];
    // Add audio files for cloning
}
```

## Gmail API Integration

### 1. Email Management

**Purpose**: Email integration for marketing and communication workflows

**Implementation**: `api/marketing.php`

**Key Features**:
- Email inbox management
- Email classification and prioritization
- Email composition and sending
- Gmail API integration

**API Configuration**:
```php
$gmail_config = [
    'client_id' => getenv('GMAIL_CLIENT_ID'),
    'client_secret' => getenv('GMAIL_CLIENT_SECRET'),
    'refresh_token' => getenv('GMAIL_REFRESH_TOKEN'),
    'access_token' => getenv('GMAIL_ACCESS_TOKEN')
];
```

**Email Processing Pipeline**:
1. **Authentication**: OAuth2 authentication with Gmail
2. **Email Fetching**: Retrieve emails from inbox
3. **Classification**: AI-powered email categorization
4. **Processing**: Extract relevant information
5. **Response**: Generate appropriate responses

**Email Classification**:
```php
$email_categories = [
    'lead' => 'Potential customer inquiry',
    'client' => 'Existing customer communication',
    'marketing' => 'Marketing and promotional content',
    'spam' => 'Unwanted or suspicious content',
    'urgent' => 'High-priority communication'
];
```

### 2. OAuth2 Integration

**Purpose**: Secure authentication with Google services

**Implementation**: `authorize.php` and `oauth2callback.php`

**OAuth2 Flow**:
1. **Authorization Request**: Redirect to Google OAuth2
2. **User Consent**: User grants permissions
3. **Authorization Code**: Receive authorization code
4. **Token Exchange**: Exchange code for access token
5. **API Access**: Use token for Gmail API calls

**Configuration**:
```php
$oauth_config = [
    'client_id' => getenv('GOOGLE_CLIENT_ID'),
    'client_secret' => getenv('GOOGLE_CLIENT_SECRET'),
    'redirect_uri' => getenv('GOOGLE_REDIRECT_URI'),
    'scope' => 'https://www.googleapis.com/auth/gmail.readonly'
];
```

## SMTP Integration

### 1. Email Sending

**Purpose**: Outbound email communication for campaigns and notifications

**Implementation**: `api/lib/mail.php`

**Key Features**:
- SMTP email sending
- PHPMailer integration
- Email template support
- Delivery tracking

**SMTP Configuration**:
```php
$smtp_config = [
    'host' => getenv('SMTP_HOST'),
    'port' => getenv('SMTP_PORT'),
    'username' => getenv('SMTP_USERNAME'),
    'password' => getenv('SMTP_PASSWORD'),
    'encryption' => getenv('SMTP_ENCRYPTION'), // 'tls' or 'ssl'
    'from_email' => getenv('SMTP_FROM_EMAIL'),
    'from_name' => getenv('SMTP_FROM_NAME')
];
```

**Email Sending Function**:
```php
function donna_smtp_send($emailData) {
    $mail = new PHPMailer(true);
    
    $mail->isSMTP();
    $mail->Host = $smtp_config['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $smtp_config['username'];
    $mail->Password = $smtp_config['password'];
    $mail->SMTPSecure = $smtp_config['encryption'];
    $mail->Port = $smtp_config['port'];
    
    $mail->setFrom($smtp_config['from_email'], $smtp_config['from_name']);
    $mail->addAddress($emailData['to']);
    $mail->Subject = $emailData['subject'];
    $mail->Body = $emailData['body'];
    
    return $mail->send();
}
```

## WebSocket Integration

### 1. Real-time Communication

**Purpose**: Real-time communication for voice and chat features

**Implementation**: `websocket-server/server.js`

**Key Features**:
- WebSocket connection management
- Real-time message forwarding
- Connection pooling
- Error handling and reconnection

**WebSocket Server Configuration**:
```javascript
const wss = new WebSocketServer({ 
  server,
  path: '/realtime'
});

wss.on('connection', (ws) => {
  // Handle client connections
  // Proxy to OpenAI Realtime API
  // Manage message forwarding
});
```

**Message Types**:
- `connect_realtime`: Establish OpenAI Realtime connection
- `input_audio_buffer.append`: Send audio data
- `input_audio_buffer.commit`: Commit audio buffer
- `response.create`: Request AI response
- `conversation.item.create`: Add conversation item

### 2. Event Fanout

**Purpose**: Distribute events across multiple services

**Implementation**: `app/api/voice/fanout/route.ts`

**Features**:
- Event distribution to multiple endpoints
- Service health monitoring
- Error handling and retry logic
- Analytics and logging

**Fanout Configuration**:
```typescript
const fanoutEndpoints = [
  '/api/marketing.php',
  '/api/sales/overview.php',
  '/api/secretary/dashboard.php'
];
```

## Google Drive Integration

### 1. File Management

**Purpose**: Document storage and management for secretary functions

**Implementation**: `drive_uploader.py` and `upload_to_drive.py`

**Key Features**:
- File upload and download
- Document organization
- Access control
- Version management

**Python Integration**:
```python
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

# Initialize Google Drive API
credentials = Credentials.from_service_account_file('credentials.json')
service = build('drive', 'v3', credentials=credentials)

def upload_file(file_path, folder_id=None):
    file_metadata = {
        'name': os.path.basename(file_path),
        'parents': [folder_id] if folder_id else []
    }
    
    media = MediaFileUpload(file_path, resumable=True)
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()
    
    return file.get('id')
```

## Integration Management

### 1. API Key Management

**Purpose**: Secure management of API keys and credentials

**Implementation**: Environment variable system with `bootstrap_env.php`

**Key Features**:
- Environment variable loading
- Secure key storage
- Key rotation support
- Access logging

**Required Environment Variables**:
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key
DEFAULT_VOICE_ID=XcXEQzuLXRU9RcfWzEJt
VOICE_MODEL=eleven_multilingual_v2

# Gmail Configuration
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_ENCRYPTION=tls
```

### 2. Error Handling

**Purpose**: Robust error handling across all integrations

**Features**:
- API error detection and handling
- Retry logic with exponential backoff
- Fallback mechanisms
- Error logging and monitoring

**Error Handling Pattern**:
```php
try {
    $response = $this->makeRequest($url, $data);
    return $response;
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    
    // Implement retry logic
    if ($retryCount < $maxRetries) {
        sleep(pow(2, $retryCount)); // Exponential backoff
        return $this->makeRequest($url, $data, $retryCount + 1);
    }
    
    // Fallback mechanism
    return $this->fallbackResponse();
}
```

### 3. Rate Limiting

**Purpose**: Manage API rate limits and prevent service abuse

**Features**:
- Rate limit detection
- Automatic throttling
- Queue management
- User rate limiting

**Rate Limiting Implementation**:
```php
class RateLimiter {
    private $limits = [
        'openai' => ['requests' => 60, 'window' => 60], // 60 requests per minute
        'elevenlabs' => ['requests' => 100, 'window' => 60], // 100 requests per minute
        'gmail' => ['requests' => 1000, 'window' => 100] // 1000 requests per 100 seconds
    ];
    
    public function checkLimit($service, $userId = null) {
        // Check rate limits and implement throttling
    }
}
```

### 4. Monitoring and Analytics

**Purpose**: Monitor integration health and performance

**Features**:
- API usage tracking
- Performance monitoring
- Error rate monitoring
- Cost tracking

**Monitoring Metrics**:
- API response times
- Error rates
- Usage patterns
- Cost per request
- Service availability

## Security Considerations

### 1. API Key Security

**Implementation**:
- Environment variable storage
- Secure key transmission
- Key rotation support
- Access logging

**Best Practices**:
- Never expose API keys in client-side code
- Use HTTPS for all API communications
- Implement key rotation policies
- Monitor key usage and access

### 2. Data Privacy

**Implementation**:
- Data encryption in transit
- Temporary data storage
- Automatic data cleanup
- Privacy compliance

**Privacy Measures**:
- No permanent storage of user audio data
- Encrypted transmission of sensitive data
- User consent for data processing
- GDPR compliance considerations

### 3. Access Control

**Implementation**:
- OAuth2 authentication
- Role-based access control
- API rate limiting
- User authentication

**Access Control Features**:
- User authentication and authorization
- API access control
- Service-level permissions
- Audit logging

## Telnyx Integration

### 1. Voice API (Call Control)

**Purpose**: Real PSTN phone calling for inbound and outbound calls

**Implementation**: `voice_system/telnyx_voice_client.php`

**Key Features**:
- Outbound call initiation
- Inbound call handling via webhooks
- Call control (answer, hangup, transfer)
- Call recording
- Call history and analytics

**API Configuration**:
```php
class TelnyxVoiceClient implements VoiceProviderInterface {
    private $apiKey;
    private $baseUrl = 'https://api.telnyx.com/v2';
}
```

**Call Operations**:
- `initiateCall($to, $from, $options)` - Start outbound call
- `answerCall($callId)` - Answer incoming call
- `hangupCall($callId)` - End call
- `transferCall($callId, $to)` - Transfer to another number
- `getCallStatus($callId)` - Get current call state
- `recordCall($callId, $enabled)` - Toggle recording

**Webhook Events**:
- `call.initiated` - New call started
- `call.answered` - Call answered
- `call.ended` - Call completed
- `call.hangup` - Call hung up

### 2. Messaging API (SMS/MMS)

**Purpose**: SMS and MMS messaging for customer communication

**Implementation**: `voice_system/telnyx_messaging_client.php`

**Key Features**:
- SMS sending and receiving
- MMS support with media
- Delivery status tracking
- Webhook-based message handling

**API Configuration**:
```php
class TelnyxMessagingClient implements MessagingProviderInterface {
    private $apiKey;
    private $messagingProfileId;
    private $baseUrl = 'https://api.telnyx.com/v2';
}
```

**Messaging Operations**:
- `sendSMS($to, $message, $options)` - Send SMS
- `sendMMS($to, $message, $media, $options)` - Send MMS
- `getMessageStatus($messageId)` - Check delivery status
- `receiveMessage($webhookData)` - Process inbound message

**Webhook Events**:
- `message.received` - Incoming message
- `message.finalized` - Message delivery confirmed
- `message.sending.failed` - Delivery failure

### 3. Provider Abstraction Layer

**Purpose**: Allow switching between providers without code changes

**Implementation**: `lib/ProviderFactory.php`

**Factory Pattern**:
```php
// Create voice provider
$voiceProvider = ProviderFactory::createVoiceProvider('telnyx');

// Create messaging provider
$messagingProvider = ProviderFactory::createMessagingProvider('telnyx');
```

**Configuration**:
- Environment variables: `VOICE_PROVIDER`, `MESSAGING_PROVIDER`
- Defaults to 'telnyx' if not specified
- Supports future providers (Twilio, etc.)

### 4. Webhook Handling

**Purpose**: Real-time event processing from Telnyx

**Implementation**: `api/telnyx/webhook.php`

**Features**:
- Signature verification using Ed25519
- Call event processing
- Message event processing
- Call history storage
- Event fanout to other services

**Webhook Configuration**:
```env
TELNYX_WEBHOOK_URL=https://yourdomain.com/api/telnyx/webhook.php
TELNYX_WEBHOOK_SECRET=your_webhook_secret
```

### 5. Call History API

**Purpose**: Store and retrieve call records

**Implementation**: `api/call-history.php`

**Endpoints**:
- `GET /api/call-history.php` - List calls with filters
- `GET /api/call-history.php?id={callId}` - Get specific call

**Features**:
- Date range filtering
- Phone number filtering
- Pagination support
- File-based storage (with Supabase option)

## Integration Management

### Provider Selection

The system uses a factory pattern to select providers:

```php
// Voice provider selection
$voiceProvider = ProviderFactory::createVoiceProvider();
// Reads VOICE_PROVIDER env var, defaults to 'telnyx'

// Messaging provider selection
$messagingProvider = ProviderFactory::createMessagingProvider();
// Reads MESSAGING_PROVIDER env var, defaults to 'telnyx'
```

### Environment Variables

```bash
# Telnyx Configuration
TELNYX_API_KEY=your_telnyx_api_key
TELNYX_MESSAGING_PROFILE_ID=your_messaging_profile_id
TELNYX_PHONE_NUMBER=+1234567890
TELNYX_WEBHOOK_SECRET=your_webhook_secret
TELNYX_WEBHOOK_URL=https://yourdomain.com/api/telnyx/webhook.php
TELNYX_CONNECTION_ID=your_connection_id

# Provider Selection
VOICE_PROVIDER=telnyx
MESSAGING_PROVIDER=telnyx
```

### Error Handling

All Telnyx operations include comprehensive error handling:
- API error detection and logging
- Retry logic for transient failures
- Graceful fallbacks
- User-friendly error messages

### Security

- Webhook signature verification
- API key stored in environment variables
- HTTPS required for webhooks
- Rate limiting on API endpoints

---

*This comprehensive third-party integration architecture ensures reliable, secure, and scalable operation of the DONNA platform across multiple external services, including Telnyx for voice and messaging.*


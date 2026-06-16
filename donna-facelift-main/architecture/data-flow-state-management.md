# Data Flow & State Management

## Overview

DONNA implements a sophisticated data flow architecture that manages state across multiple layers: frontend React components, backend PHP APIs, real-time WebSocket connections, and external service integrations. The system is designed for scalability, reliability, and real-time responsiveness.

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DONNA DATA FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│  FRONTEND LAYER                                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ React State     │ │ Context Providers│ │ Custom Hooks    │   │
│  │ (Component)     │ │ (Global)        │ │ (Business Logic)│   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  API LAYER                                                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ HTTP Requests   │ │ WebSocket       │ │ Event Fanout    │   │
│  │ (REST API)      │ │ (Real-time)     │ │ (Multi-service) │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND LAYER                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ PHP Processing  │ │ File Storage    │ │ Session Mgmt    │   │
│  │ (Business Logic)│ │ (JSON Files)    │ │ (User State)    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ OpenAI APIs     │ │ ElevenLabs API  │ │ Gmail API       │   │
│  │ (AI Processing) │ │ (Voice Synthesis│ │ (Email Data)    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend State Management

### 1. Component-Level State

**Local State Management**:
Each React component manages its own local state using React hooks:

```typescript
// Example: Sales Interface State
const [salesData, setSalesData] = useState<SalesData | null>(null)
const [loading, setLoading] = useState(true)
const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'leads'>('overview')
const [searchTerm, setSearchTerm] = useState('')
const [statusFilter, setStatusFilter] = useState<string>('all')
```

**State Patterns**:
- **Loading States**: Track async operations
- **Form States**: Manage user input and validation
- **UI States**: Control component visibility and behavior
- **Data States**: Store fetched and processed data

### 2. Context Providers

**VoiceProvider** (`components/voice/VoiceProvider.tsx`):
Manages global voice-related state and functionality.

```typescript
interface VoiceContextType {
  isVoiceEnabled: boolean
  currentVoiceId: string
  isRecording: boolean
  isPlaying: boolean
  audioLevel: number
  startRecording: () => void
  stopRecording: () => void
  playAudio: (audioData: Blob) => void
  setVoiceId: (voiceId: string) => void
}

const VoiceContext = createContext<VoiceContextType | null>(null)
```

**Usage Pattern**:
```typescript
// In components
const voiceContext = useContext(VoiceContext)
if (!voiceContext) throw new Error('VoiceProvider not found')

const { isRecording, startRecording, stopRecording } = voiceContext
```

### 3. Custom Hooks for State Management

**API State Management**:
Custom hooks encapsulate API logic and state management:

```typescript
// Example: useSalesData hook
function useSalesData() {
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/sales/overview.php')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetchData }
}
```

**Voice State Management**:
```typescript
// useOpenAIRealtime hook state
interface RealtimeState {
  isConnected: boolean
  isConnecting: boolean
  isListening: boolean
  isSpeaking: boolean
  messages: RealtimeMessage[]
  currentTranscript: string
  audioLevel: number
  error: string | null
  sessionId: string | null
}
```

## Backend State Management

### 1. Session Management

**Chat Session Storage**:
File-based storage for chat conversations:

```php
// Chat session structure
$chat_history = [
    ["role" => "user", "content" => "User message"],
    ["role" => "assistant", "content" => "AI response"],
    ["role" => "system", "content" => "System message"]
];

// Storage location
$chat_file = $chat_dir . "/{$chat_id}.json";
file_put_contents($chat_file, json_encode($chat_history, JSON_PRETTY_PRINT));
```

**User Memory Management**:
Persistent user memory for authenticated users:

```php
// User memory structure
$user_memory = [
    'name' => 'User Name',
    'company' => 'Company Name',
    'preferences' => ['preference1', 'preference2'],
    'interactions' => 42,
    'last_interaction' => '2024-01-01T12:00:00Z'
];

// Storage location
$memory_file = $memory_dir . '/' . $user_id . '.json';
file_put_contents($memory_file, json_encode($user_memory, JSON_PRETTY_PRINT));
```

### 2. Configuration Management

**Chatbot Settings**:
Persistent configuration for chatbot behavior:

```php
// Settings structure
$chatbot_settings = [
    'greeting' => "Hi! I'm DONNA. How can I help?",
    'themeColor' => "#2563eb",
    'position' => 'bottom-right',
    'profile' => 'general'
];

// Storage and retrieval
$settingsFile = __DIR__ . '/../data/chatbot_settings.json';
file_put_contents($settingsFile, json_encode($chatbot_settings, JSON_PRETTY_PRINT));
```

### 3. Data Persistence

**File-Based Storage Structure**:
```
data/
├── chat_sessions/           # Chat conversation history
│   ├── {chat_id}.json      # Individual chat sessions
│   └── default.json        # Default session template
├── memory/                  # User memory and preferences
│   ├── {user_id}.json      # User-specific memory
│   └── guest_thread.json   # Guest user memory
├── chatbot_settings.json    # Global chatbot configuration
└── logs/                    # System logs and analytics
    ├── donna_errors.log     # Error logging
    ├── abuse.log           # Abuse detection logs
    └── api_usage.log       # API usage tracking
```

## Real-Time Data Flow

### 1. WebSocket Communication

**Connection Management**:
```javascript
// WebSocket server connection handling
wss.on('connection', (ws) => {
  let openaiWs = null;
  
  ws.on('message', async (message) => {
    const data = JSON.parse(message.toString());
    
    if (data.type === 'connect_realtime') {
      // Establish OpenAI Realtime connection
      openaiWs = new WebSocket(wsUrl, { headers });
      
      openaiWs.on('message', (openaiMessage) => {
        // Forward OpenAI messages to client
        ws.send(openaiMessage.toString());
      });
    }
  });
});
```

**Message Flow**:
1. **Client → Server**: User input (text/audio)
2. **Server → OpenAI**: Forward to Realtime API
3. **OpenAI → Server**: AI response (text/audio)
4. **Server → Client**: Forward response to user

### 2. Event Fanout System

**Multi-Service Event Distribution**:
```typescript
// Event fanout to multiple services
export async function POST(req: NextRequest) {
  const event = await req.json()
  
  // Fan out to multiple endpoints
  const fanoutPromises = [
    fetch('/api/marketing.php', { method: 'POST', body: JSON.stringify(event) }),
    fetch('/api/sales/overview.php', { method: 'POST', body: JSON.stringify(event) }),
    fetch('/api/secretary/dashboard.php', { method: 'POST', body: JSON.stringify(event) })
  ]
  
  await Promise.allSettled(fanoutPromises)
  return NextResponse.json({ ok: true })
}
```

## Data Processing Pipelines

### 1. Voice Processing Pipeline

**Batch Mode (High Quality)**:
```
User Speech → Audio Recording → Base64 Encoding → Whisper API → 
Text Processing → GPT-4 API → Response Generation → 
ElevenLabs TTS → Audio Generation → Audio Playback
```

**Real-time Mode (Low Latency)**:
```
User Speech → Audio Streaming → OpenAI Realtime API → 
Streaming Response → Audio Playback
```

### 2. Email Processing Pipeline

**Email Integration Flow**:
```
Gmail API → Email Fetching → AI Classification → 
Priority Assignment → Dashboard Update → 
Response Generation → Email Sending
```

**Classification Logic**:
```php
// Email classification based on content
$is_spam = preg_match('/(unsubscribe|lottery|crypto|free money)/i', $body);
$is_lead = preg_match('/(interested|quote|pricing|estimate|services)/i', $body);
$is_urgent = preg_match('/(urgent|asap|emergency|immediate)/i', $body);

if ($is_spam) {
    return ['action' => 'email_spam', 'classification' => 'spam'];
}
if ($is_lead) {
    $priority = $is_urgent ? 'urgent' : 'high';
    return ['action' => 'email_lead', 'classification' => 'lead', 'priority' => $priority];
}
```

### 3. Sales Data Pipeline

**CRM Data Flow**:
```
User Input → Contact Creation → Lead Classification → 
Score Calculation → Status Update → Dashboard Refresh → 
Campaign Trigger → Follow-up Actions
```

## State Synchronization

### 1. Frontend-Backend Synchronization

**API State Synchronization**:
```typescript
// Synchronize frontend state with backend data
const syncSalesData = useCallback(async () => {
  const response = await fetch('/api/sales/overview.php')
  const result = await response.json()
  if (result.success) {
    setSalesData(result.data)
  }
}, [])

// Auto-sync on component mount
useEffect(() => {
  syncSalesData()
}, [syncSalesData])
```

**Real-time Updates**:
```typescript
// WebSocket-based real-time updates
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3001/realtime')
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'sales_update') {
      setSalesData(prev => ({ ...prev, ...data.payload }))
    }
  }
  
  return () => ws.close()
}, [])
```

### 2. Cross-Component State Sharing

**Event-Based Communication**:
```typescript
// Custom event system for component communication
const dispatchEvent = (eventType: string, data: any) => {
  window.dispatchEvent(new CustomEvent(eventType, { detail: data }))
}

const listenToEvent = (eventType: string, callback: (data: any) => void) => {
  const handler = (event: CustomEvent) => callback(event.detail)
  window.addEventListener(eventType, handler)
  return () => window.removeEventListener(eventType, handler)
}

// Usage
dispatchEvent('donna:voice:start', { voiceId: 'custom-voice' })
listenToEvent('donna:voice:start', (data) => {
  console.log('Voice started:', data.voiceId)
})
```

## Data Validation and Error Handling

### 1. Input Validation

**Frontend Validation**:
```typescript
// Type-safe input validation
interface ContactInput {
  name: string
  email: string
  phone?: string
  status: 'new' | 'contacted' | 'qualified' | 'converted'
}

const validateContact = (input: any): ContactInput => {
  if (!input.name || typeof input.name !== 'string') {
    throw new Error('Name is required')
  }
  if (!input.email || !isValidEmail(input.email)) {
    throw new Error('Valid email is required')
  }
  return input as ContactInput
}
```

**Backend Validation**:
```php
// Server-side validation
function validateInput($input) {
    $errors = [];
    
    if (empty($input['message'])) {
        $errors[] = 'Message is required';
    }
    
    if (!in_array($input['user_profile'], ['general', 'sales', 'receptionist', 'marketing'])) {
        $errors[] = 'Invalid user profile';
    }
    
    if (!empty($errors)) {
        throw new Exception(implode(', ', $errors));
    }
    
    return $input;
}
```

### 2. Error State Management

**Frontend Error Handling**:
```typescript
// Comprehensive error state management
interface ErrorState {
  hasError: boolean
  error: string | null
  errorCode: string | null
  retryCount: number
  lastRetry: Date | null
}

const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorCode: null,
    retryCount: 0,
    lastRetry: null
  })

  const handleError = useCallback((error: Error, retry?: () => void) => {
    setErrorState(prev => ({
      ...prev,
      hasError: true,
      error: error.message,
      errorCode: error.name,
      retryCount: prev.retryCount + 1,
      lastRetry: new Date()
    }))

    // Auto-retry logic
    if (retry && errorState.retryCount < 3) {
      setTimeout(retry, Math.pow(2, errorState.retryCount) * 1000)
    }
  }, [errorState.retryCount])

  return { errorState, handleError }
}
```

**Backend Error Handling**:
```php
// Structured error responses
function handleError($error, $context = []) {
    $errorResponse = [
        'success' => false,
        'error' => $error->getMessage(),
        'error_code' => $error->getCode(),
        'timestamp' => date('c'),
        'context' => $context
    ];
    
    // Log error for debugging
    error_log("DONNA Error: " . json_encode($errorResponse));
    
    return json_encode($errorResponse);
}
```

## Performance Optimization

### 1. State Optimization

**Memoization**:
```typescript
// Memoize expensive calculations
const filteredContacts = useMemo(() => {
  return salesData?.contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []
}, [salesData?.contacts, searchTerm, statusFilter])

// Memoize callback functions
const handleContactUpdate = useCallback((contactId: string, updates: Partial<Contact>) => {
  setSalesData(prev => ({
    ...prev,
    contacts: prev.contacts.map(contact =>
      contact.id === contactId ? { ...contact, ...updates } : contact
    )
  }))
}, [])
```

**State Batching**:
```typescript
// Batch multiple state updates
const updateMultipleStates = useCallback(() => {
  setLoading(true)
  setError(null)
  setData(null)
  
  // Single re-render for all updates
}, [])
```

### 2. Data Caching

**API Response Caching**:
```typescript
// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() })
}
```

**Backend Caching**:
```php
// File-based caching
function getCachedResponse($cacheKey, $duration = 300) {
    $cacheFile = __DIR__ . "/../cache/{$cacheKey}.json";
    
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $duration) {
        return json_decode(file_get_contents($cacheFile), true);
    }
    
    return null;
}

function setCachedResponse($cacheKey, $data) {
    $cacheDir = __DIR__ . "/../cache";
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }
    
    $cacheFile = $cacheDir . "/{$cacheKey}.json";
    file_put_contents($cacheFile, json_encode($data));
}
```

## Data Security and Privacy

### 1. Data Encryption

**Transmission Security**:
- HTTPS for all API communications
- WSS for WebSocket connections
- Encrypted API key transmission

**Storage Security**:
- No permanent storage of sensitive user data
- Encrypted temporary files
- Secure file permissions

### 2. Data Privacy

**User Data Handling**:
- Minimal data collection
- Automatic data cleanup
- User consent management
- GDPR compliance considerations

**Audit Logging**:
```php
// Audit log for data access
function logDataAccess($userId, $action, $dataType, $metadata = []) {
    $logEntry = [
        'timestamp' => date('c'),
        'user_id' => $userId,
        'action' => $action,
        'data_type' => $dataType,
        'metadata' => $metadata,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    file_put_contents(
        __DIR__ . '/../logs/audit.log',
        json_encode($logEntry) . "\n",
        FILE_APPEND | LOCK_EX
    );
}
```

---

*This comprehensive data flow and state management architecture ensures efficient, secure, and scalable operation of the DONNA platform across all components and services.*


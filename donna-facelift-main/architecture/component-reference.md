# Component Reference

## Overview

This document provides a comprehensive reference for all components in the DONNA platform, including their purpose, props, usage examples, and implementation details.

## Frontend Components

### 1. Core Layout Components

#### `InteractiveGrid` (`components/interactive-grid.tsx`)

**Purpose**: Main dashboard component providing 3D interactive grid interface for accessing different business functions.

**Props**: None (self-contained component)

**Key Features**:
- 3D hover effects with smooth animations
- Zoom-based navigation (scroll to zoom, click to enter)
- Dynamic content previews for each interface
- Responsive design with mobile support

**Usage**:
```typescript
import InteractiveGrid from '@/components/interactive-grid'

export default function Dashboard() {
  return <InteractiveGrid />
}
```

**State Management**:
```typescript
const [hoveredItem, setHoveredItem] = useState<string | null>(null)
const [selectedItem, setSelectedItem] = useState<string | null>(null)
const [zoomLevel, setZoomLevel] = useState(0)
const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
```

#### `ChatWidget` (`components/chat/ChatWidget.tsx`)

**Purpose**: Floating chat widget providing real-time communication with DONNA using OpenAI Realtime API.

**Props**: None (self-contained component)

**Key Features**:
- Floating button with smooth open/close animations
- Real-time voice and text communication
- Message history with proper formatting
- Connection status monitoring

**Usage**:
```typescript
import ChatWidget from '@/components/chat/ChatWidget'

export default function Layout() {
  return (
    <div>
      {/* Other content */}
      <ChatWidget />
    </div>
  )
}
```

**State Management**:
```typescript
const [open, setOpen] = useState(false)
const [input, setInput] = useState("")
const [isMicOn, setIsMicOn] = useState(false)
const [messages, setMessages] = useState<ChatMessage[]>([])
```

#### `VoiceProvider` (`components/voice/VoiceProvider.tsx`)

**Purpose**: Context provider managing voice-related state and functionality across the application.

**Props**:
```typescript
interface VoiceProviderProps {
  children: React.ReactNode
}
```

**Context Value**:
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
```

**Usage**:
```typescript
import { VoiceProvider } from '@/components/voice/VoiceProvider'

export default function App() {
  return (
    <VoiceProvider>
      {/* App content */}
    </VoiceProvider>
  )
}
```

### 2. Business Interface Components

#### `SalesInterface` (`components/interfaces/sales-interface.tsx`)

**Purpose**: Sales dashboard and CRM functionality for managing contacts, leads, and campaigns.

**Props**: None (self-contained component)

**Key Features**:
- Contact and lead management
- Campaign creation and tracking
- Sales analytics and reporting
- Integration with CRM functionality

**State Management**:
```typescript
const [salesData, setSalesData] = useState<SalesData | null>(null)
const [loading, setLoading] = useState(true)
const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'leads' | 'campaigns'>('overview')
const [searchTerm, setSearchTerm] = useState('')
const [statusFilter, setStatusFilter] = useState<string>('all')
```

**API Integration**:
```typescript
const fetchSalesData = async () => {
  const response = await fetch(`${apiBase}/api/sales/overview.php`)
  const result = await response.json()
  if (result.success) {
    setSalesData(result.data)
  }
}
```

#### `EmailInterface` (`components/interfaces/email-interface.tsx`)

**Purpose**: Email management interface with Gmail API integration for email classification and management.

**Props**: None (self-contained component)

**Key Features**:
- Gmail API integration
- Email classification and prioritization
- Inbox management with filtering
- Email composition and sending

**State Management**:
```typescript
const [selectedEmail, setSelectedEmail] = useState(0)
const [emails, setEmails] = useState<Email[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [stats, setStats] = useState({
  inbox: 0,
  starred: 0,
  sent: 0
})
```

**Email Data Structure**:
```typescript
interface Email {
  id: string
  from: string
  from_email: string
  subject: string
  preview: string
  time: string
  starred: boolean
  unread?: boolean
  category?: string
  priority?: string
}
```

#### `SecretaryInterface` (`components/interfaces/secretary-interface.tsx`)

**Purpose**: Secretary interface for task and calendar management, meeting scheduling, and administrative workflow automation.

**Props**: None (self-contained component)

**Key Features**:
- Task and calendar management
- Meeting scheduling
- Document organization
- Administrative workflow automation

#### `ChatbotControlInterface` (`components/interfaces/chatbot-control-interface.tsx`)

**Purpose**: Chatbot configuration and management interface for controlling chatbot behavior and settings.

**Props**: None (self-contained component)

**Key Features**:
- Chatbot settings configuration
- Embed code generation
- Conversation management
- Analytics and reporting

**Settings Structure**:
```typescript
type ChatbotSettings = {
  greeting: string
  themeColor: string
  position: 'bottom-right' | 'bottom-left'
  profile: 'general' | 'sales' | 'receptionist' | 'marketing'
}
```

### 3. Utility Components

#### `ServiceStatus` (`components/ServiceStatus.tsx`)

**Purpose**: API health monitoring component displaying real-time service status.

**Props**: None (self-contained component)

**Key Features**:
- Real-time API health monitoring
- Visual status indicators (green/amber/red)
- Automatic polling with configurable intervals
- Version information display

**Usage**:
```typescript
import ServiceStatus from '@/components/ServiceStatus'

export default function Header() {
  return (
    <div className="flex justify-end">
      <ServiceStatus />
    </div>
  )
}
```

**State Management**:
```typescript
const [status, setStatus] = useState<"green"|"amber"|"red">("amber")
const [info, setInfo] = useState<Health | null>(null)
```

#### `CampaignDashboard` (`components/CampaignDashboard.tsx`)

**Purpose**: Campaign management dashboard for creating, editing, and tracking marketing campaigns.

**Props**:
```typescript
interface CampaignDashboardProps {
  onCreateCampaign: () => void
  onEditCampaign: (campaign: any) => void
}
```

**Key Features**:
- Campaign creation and editing
- Campaign performance tracking
- Campaign status management
- Integration with marketing tools

#### `GridLoading` (`components/grid-loading.tsx`)

**Purpose**: Loading state component for the interactive grid during initialization.

**Props**: None (self-contained component)

**Usage**:
```typescript
import GridLoading from '@/components/grid-loading'

export default function LoadingPage() {
  return <GridLoading />
}
```

#### `NoSSR` (`components/no-ssr.tsx`)

**Purpose**: Client-side only wrapper component to prevent server-side rendering issues.

**Props**:
```typescript
interface NoSSRProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}
```

**Usage**:
```typescript
import NoSSR from '@/components/no-ssr'

export default function ClientOnlyComponent() {
  return (
    <NoSSR fallback={<LoadingSpinner />}>
      <InteractiveComponent />
    </NoSSR>
  )
}
```

## Custom Hooks

### 1. Voice Hooks

#### `useOpenAIRealtime` (`hooks/use-openai-realtime.ts`)

**Purpose**: Manages real-time voice communication with OpenAI's Realtime API through WebSocket connections.

**Parameters**:
```typescript
interface UseOpenAIRealtimeOptions {
  apiBaseUrl?: string
  instructions?: string
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  temperature?: number
  onMessage?: (message: RealtimeMessage) => void
  onError?: (error: string) => void
  onConnect?: () => void
  onDisconnect?: () => void
}
```

**Returns**:
```typescript
const [state, actions] = useOpenAIRealtime(options)

// State
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

// Actions
interface RealtimeActions {
  connect: () => Promise<void>
  disconnect: () => void
  startListening: () => void
  stopListening: () => void
  sendAudio: (audioData: ArrayBuffer) => void
  sendText: (text: string) => void
  clearMessages: () => void
  clearError: () => void
}
```

**Usage**:
```typescript
const [state, actions] = useOpenAIRealtime({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE,
  instructions: 'You are DONNA, a helpful AI receptionist.',
  voice: 'alloy',
  temperature: 0.7,
  onMessage: (message) => setMessages(prev => [...prev, message]),
  onError: (error) => setError(error)
})
```

#### `useVoiceChat` (`hooks/use-voice-chat.ts`)

**Purpose**: Handles batch voice processing using ElevenLabs for high-quality voice synthesis.

**Parameters**:
```typescript
interface UseVoiceChatOptions {
  apiBaseUrl?: string
  userId?: string
  defaultVoiceId?: string
  onMessage?: (message: VoiceMessage) => void
  onError?: (error: string) => void
}
```

**Returns**:
```typescript
const [voiceState, voiceActions] = useVoiceChat(options)

// State
interface VoiceState {
  isRecording: boolean
  isPlaying: boolean
  isProcessing: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected'
  currentVoiceId: string
  availableVoices: Voice[]
  messages: VoiceMessage[]
  error: string | null
}

// Actions
interface VoiceActions {
  startRecording: () => Promise<void>
  stopRecording: () => void
  playAudio: (audioData: Blob) => void
  sendText: (text: string) => Promise<void>
  setVoiceId: (voiceId: string) => void
  clearMessages: () => void
  clearError: () => void
}
```

**Usage**:
```typescript
const [voiceState, voiceActions] = useVoiceChat({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE,
  userId: 'user-123',
  defaultVoiceId: 'XcXEQzuLXRU9RcfWzEJt',
  onMessage: (message) => console.log('New message:', message),
  onError: (error) => console.error('Voice error:', error)
})
```

#### `useAudioRecorder` (`hooks/use-audio-recorder.ts`)

**Purpose**: Provides audio recording functionality with proper browser API handling.

**Returns**:
```typescript
const [state, actions] = useAudioRecorder()

// State
interface AudioRecorderState {
  isRecording: boolean
  isSupported: boolean
  error: string | null
  audioLevel: number
}

// Actions
interface AudioRecorderActions {
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  getAudioLevel: () => number
}
```

**Usage**:
```typescript
const [recorderState, recorderActions] = useAudioRecorder()

const handleStartRecording = async () => {
  try {
    await recorderActions.startRecording()
  } catch (error) {
    console.error('Failed to start recording:', error)
  }
}
```

#### `useAudioPlayer` (`hooks/use-audio-player.ts`)

**Purpose**: Manages audio playback with proper browser compatibility.

**Returns**:
```typescript
const [state, actions] = useAudioPlayer()

// State
interface AudioPlayerState {
  isPlaying: boolean
  currentAudio: string | null
  volume: number
  error: string | null
}

// Actions
interface AudioPlayerActions {
  playAudio: (audioData: Blob | string) => Promise<void>
  stopAudio: () => void
  setVolume: (volume: number) => void
  pauseAudio: () => void
  resumeAudio: () => void
}
```

**Usage**:
```typescript
const [playerState, playerActions] = useAudioPlayer()

const handlePlayAudio = async (audioBlob: Blob) => {
  try {
    await playerActions.playAudio(audioBlob)
  } catch (error) {
    console.error('Failed to play audio:', error)
  }
}
```

### 2. Utility Hooks

#### `useMobile` (`hooks/use-mobile.ts`)

**Purpose**: Detects mobile devices and provides responsive behavior.

**Returns**:
```typescript
const isMobile = useMobile()
```

**Usage**:
```typescript
const isMobile = useMobile()

return (
  <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
    {/* Content */}
  </div>
)
```

#### `useToast` (`hooks/use-toast.ts`)

**Purpose**: Manages toast notifications throughout the application.

**Returns**:
```typescript
const { toast } = useToast()

// Toast function
toast({
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
})
```

**Usage**:
```typescript
const { toast } = useToast()

const handleSuccess = () => {
  toast({
    title: 'Success',
    description: 'Operation completed successfully',
    variant: 'default'
  })
}
```

## Backend Components

### 1. Core API Endpoints

#### `donna_logic.php` (`api/donna_logic.php`)

**Purpose**: Core AI processing engine handling all AI interactions with different personas.

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

**Key Functions**:
- `callOpenAI($api_key, $messages, $profile)` - OpenAI API integration
- `buildSystemPrompt($profile, $user_memory, $abuse_detected)` - Dynamic prompt building
- `detectAbuse($message)` - Content filtering
- `processCommands($user_message, $ai_response, $user_id, $chat_id)` - Command processing
- `updateUserMemory($user_id, $user_message, $ai_response, $memory_dir)` - Memory management

#### `voice-chat.php` (`api/voice-chat.php`)

**Purpose**: Handles batch voice processing with ElevenLabs integration.

**Endpoint**: `POST /api/voice-chat.php`

**Request Format**:
```json
{
  "action": "synthesize|get_voices|test_connection",
  "text": "Text to synthesize",
  "voice_id": "elevenlabs-voice-id",
  "user_id": "user-identifier",
  "audio_data": "base64-encoded-audio"
}
```

**Response Format**:
```json
{
  "success": true,
  "audio_url": "path-to-generated-audio",
  "voice_id": "used-voice-id",
  "duration": 3.5,
  "transcript": "Recognized speech text"
}
```

#### `marketing.php` (`api/marketing.php`)

**Purpose**: Email marketing and Gmail integration endpoint.

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

### 2. Voice System Components

#### `OpenAIRealtimeClient` (`voice_system/openai_realtime_client.php`)

**Purpose**: PHP client for OpenAI Realtime API integration.

**Key Methods**:
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

**Usage**:
```php
$realtimeClient = new OpenAIRealtimeClient();
$session = $realtimeClient->createSession([
    'instructions' => 'You are DONNA, a helpful AI receptionist.',
    'voice' => 'alloy',
    'temperature' => 0.8
]);
```

#### `ElevenLabsClient` (`voice_system/elevenlabs_client.php`)

**Purpose**: Comprehensive client for ElevenLabs voice synthesis API.

**Key Methods**:
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

**Usage**:
```php
$elevenLabsClient = new ElevenLabsClient();
$audioData = $elevenLabsClient->textToSpeech(
    'Hello, I am DONNA.',
    'XcXEQzuLXRU9RcfWzEJt',
    [
        'voice_settings' => [
            'stability' => 0.5,
            'similarity_boost' => 0.5
        ]
    ]
);
```

### 3. Utility Components

#### `bootstrap_env.php` (`bootstrap_env.php`)

**Purpose**: Centralized environment variable loading system.

**Usage**:
```php
require_once __DIR__ . '/../bootstrap_env.php';
$apiKey = getenv('OPENAI_API_KEY');
```

**Features**:
- Multiple fallback paths for .env file location
- Support for shared hosting environments
- Simple .env parser with quote handling
- Population of all PHP environment sources

#### `ServiceStatus` (Health Check)

**Purpose**: Health monitoring for all services.

**Endpoint**: `GET /api/health.php`

**Response**:
```json
{
  "ok": true,
  "service": "donna-api",
  "version": "v1",
  "time": 1699123456,
  "checks": {
    "database": true,
    "openai": true,
    "elevenlabs": true,
    "storage": true
  }
}
```

## Data Structures

### 1. TypeScript Interfaces

#### Contact and Lead Types
```typescript
export type Contact = {
  id: string
  name: string
  email: string
  phone?: string
  status: 'new' | 'contacted' | 'qualified' | 'converted'
  score: number
  created_at: string
}

export type Lead = {
  id: string
  contact_id: string
  status: 'cold' | 'warm' | 'hot' | 'converted'
  score: number
  last_contact: string
  notes: string
}

export type SalesData = {
  contacts: Contact[]
  leads: Lead[]
  stats: {
    total_contacts: number
    hot_leads: number
    conversion_rate: number
  }
}
```

#### Voice Message Types
```typescript
export interface RealtimeMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  audioData?: string
  timestamp: Date
}

export interface VoiceMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  audioUrl?: string
  timestamp: Date
}
```

#### Email Types
```typescript
interface Email {
  id: string
  from: string
  from_email: string
  subject: string
  preview: string
  time: string
  starred: boolean
  unread?: boolean
  category?: string
  priority?: string
}
```

### 2. PHP Data Structures

#### Chat Session Format
```php
$chat_history = [
    ["role" => "user", "content" => "User message"],
    ["role" => "assistant", "content" => "AI response"],
    ["role" => "system", "content" => "System message"]
];
```

#### User Memory Format
```php
$user_memory = [
    'name' => 'User Name',
    'company' => 'Company Name',
    'preferences' => ['preference1', 'preference2'],
    'interactions' => 42,
    'last_interaction' => '2024-01-01T12:00:00Z'
];
```

#### Chatbot Settings Format
```php
$chatbot_settings = [
    'greeting' => "Hi! I'm DONNA. How can I help?",
    'themeColor' => "#2563eb",
    'position' => 'bottom-right',
    'profile' => 'general'
];
```

## Usage Examples

### 1. Frontend Component Integration

**Basic Dashboard Setup**:
```typescript
import InteractiveGrid from '@/components/interactive-grid'
import ChatWidget from '@/components/chat/ChatWidget'
import { VoiceProvider } from '@/components/voice/VoiceProvider'

export default function Dashboard() {
  return (
    <VoiceProvider>
      <InteractiveGrid />
      <ChatWidget />
    </VoiceProvider>
  )
}
```

**Sales Interface with API Integration**:
```typescript
import SalesInterface from '@/components/interfaces/sales-interface'

export default function SalesPage() {
  return <SalesInterface />
}
```

### 2. Backend API Usage

**Basic AI Processing**:
```php
$input = json_decode(file_get_contents("php://input"), true);
$message = $input['message'] ?? '';
$user_profile = $input['user_profile'] ?? 'general';

// Process with DONNA logic
$response = callOpenAI($api_key, $messages, $user_profile);
echo json_encode($response);
```

**Voice Synthesis**:
```php
$elevenLabsClient = new ElevenLabsClient();
$audioData = $elevenLabsClient->textToSpeech(
    $text,
    'XcXEQzuLXRU9RcfWzEJt',
    ['voice_settings' => ['stability' => 0.5]]
);
```

### 3. Custom Hook Usage

**Real-time Voice Communication**:
```typescript
const [state, actions] = useOpenAIRealtime({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE,
  instructions: 'You are DONNA, a helpful AI receptionist.',
  voice: 'alloy',
  onMessage: (message) => {
    console.log('Received message:', message)
  }
})

// Start listening
actions.startListening()

// Send text message
actions.sendText('Hello, how can I help you?')
```

**Batch Voice Processing**:
```typescript
const [voiceState, voiceActions] = useVoiceChat({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE,
  defaultVoiceId: 'XcXEQzuLXRU9RcfWzEJt',
  onMessage: (message) => {
    console.log('Voice message:', message)
  }
})

// Start recording
await voiceActions.startRecording()

// Stop recording and process
await voiceActions.stopRecording()
```

---

*This component reference provides comprehensive documentation for all components in the DONNA platform, enabling developers to understand, implement, and extend the system effectively.*


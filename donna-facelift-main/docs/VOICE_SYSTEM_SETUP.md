# 🎙️ DONNA Voice System Setup Guide

## Overview

Your DONNA system now supports both **batch processing** (chatbot) and **real-time streaming** (receptionist) with OpenAI's new Realtime API and your custom ElevenLabs voice. Additionally, DONNA integrates with **Telnyx** for real PSTN phone calls and SMS messaging.

### System Architecture

**Chatbot (Batch Processing):**
```
User Speech → Whisper (STT) → GPT-4 → ElevenLabs (TTS) → Audio Response
```

**Receptionist (Real-time Streaming):**
```
User Speech → OpenAI Realtime API → Real-time Response → ElevenLabs Processing
```

## 🔧 Setup Instructions

### 1. Environment Variables

Update your `.env` file with the following:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01

# ElevenLabs API Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
DEFAULT_VOICE_ID=XcXEQzuLXRU9RcfWzEJt
VOICE_MODEL=eleven_multilingual_v2

# Telnyx Configuration (for PSTN calls and SMS)
TELNYX_API_KEY=your_telnyx_api_key
TELNYX_MESSAGING_PROFILE_ID=your_messaging_profile_id
TELNYX_PHONE_NUMBER=+1234567890
TELNYX_WEBHOOK_SECRET=your_webhook_secret
TELNYX_WEBHOOK_URL=https://yourdomain.com/api/telnyx/webhook.php
TELNYX_CONNECTION_ID=your_connection_id

# Provider Selection
VOICE_PROVIDER=telnyx
MESSAGING_PROVIDER=telnyx

# System Configuration
DOMAIN_NAME=your-domain.vercel.app
ENVIRONMENT=production
```

### 2. API Keys Required

1. **OpenAI API Key** with access to:
   - Whisper API (for batch STT)
   - GPT-4 API (for text processing)
   - Realtime API (for streaming)

2. **ElevenLabs API Key** with access to:
   - Voice synthesis
   - Your custom voice ID: `XcXEQzuLXRU9RcfWzEJt`

3. **Telnyx API Key** with access to:
   - Call Control API (for PSTN calls)
   - Messaging API (for SMS/MMS)
   - Webhook configuration

### 3. Frontend Dependencies

The system uses these React hooks:
- `useVoiceChat` - Batch processing for chatbot
- `useOpenAIRealtime` - Real-time streaming for receptionist
- `useTelnyxCalls` - Telnyx call management (initiate, answer, hangup, transfer)
- `useAudioRecorder` - Audio capture
- `useAudioPlayer` - Audio playback

### 4. Backend Endpoints

Available API endpoints:
- `/api/voice-chat.php` - Batch voice processing and call control
- `/api/realtime-websocket.php` - Realtime API proxy
- `/api/telnyx/webhook.php` - Telnyx webhook handler for call/message events
- `/api/call-history.php` - Call history retrieval
- `/api/sales/overview.php` - SMS sending (via Telnyx)
- `/donna_logic.php` - Core AI logic

## 🎯 Features

### Chatbot Interface
- **Mode**: Batch processing
- **Voice**: Your custom ElevenLabs voice (XcXEQzuLXRU9RcfWzEJt)
- **Pipeline**: Whisper → GPT-4 → ElevenLabs
- **Use Case**: Thoughtful, high-quality responses
- **Latency**: ~3-5 seconds (higher quality)

### Receptionist Interface
- **Mode**: Real-time streaming with PSTN integration
- **Voice**: OpenAI Realtime → ElevenLabs post-processing
- **Pipeline**: Direct WebSocket to OpenAI Realtime API
- **Phone Calls**: Telnyx Call Control API for inbound/outbound PSTN calls
- **Use Case**: Natural conversation flow with real phone calls
- **Latency**: ~500ms-1s (real-time)

## 🚀 Usage

### Testing the Chatbot
1. Navigate to the chatbot interface
2. Click the voice mode toggle (🔊)
3. Click the microphone button to record
4. Speak your message
5. Wait for batch processing and ElevenLabs response

### Testing the Receptionist
1. Navigate to the receptionist interface
2. Click "Dial" to make an outbound call, or wait for incoming calls via webhooks
3. The system auto-connects to OpenAI Realtime API for AI processing
4. Speak naturally - responses are real-time
5. Click "End Call" to finish

### Making Outbound Calls
1. Click the "Dial" button in the receptionist interface
2. Enter phone number in E.164 format (e.g., +1234567890)
3. Click "Call" to initiate
4. The call will connect via Telnyx and use OpenAI Realtime for AI conversation

### Receiving Inbound Calls
1. Configure webhook URL in Telnyx dashboard: `https://yourdomain.com/api/telnyx/webhook.php`
2. Incoming calls will automatically appear in the receptionist interface
3. Calls are answered automatically and processed with AI

## 🔧 Configuration Options

### Voice Settings (Chatbot)
- Custom ElevenLabs voice: `XcXEQzuLXRU9RcfWzEJt`
- Model: `eleven_multilingual_v2`
- Stability: 0.5
- Similarity Boost: 0.5
- Style: 0.0

### Realtime Settings (Receptionist)
- Model: `gpt-4o-realtime-preview-2024-10-01`
- Voice: `alloy` (OpenAI)
- Temperature: 0.7
- Turn Detection: Server VAD
- Audio Format: PCM16

## 🐛 Troubleshooting

### Common Issues

1. **"WebSocket connection failed"**
   - Check OpenAI API key has Realtime API access
   - Verify network connectivity
   - Check browser console for detailed errors

2. **"ElevenLabs API error"**
   - Verify ElevenLabs API key
   - Check voice ID `XcXEQzuLXRU9RcfWzEJt` exists in your account
   - Monitor API quota usage

3. **"Microphone access denied"**
   - Enable microphone permissions in browser
   - Use HTTPS (required for microphone access)
   - Check browser compatibility

4. **"Audio not playing"**
   - Check browser audio permissions
   - Verify audio output device
   - Check network connectivity for audio streaming

### Debug Mode

Enable debug logging by adding to your `.env`:
```bash
DEBUG_MODE=true
```

## 📊 Performance Optimization

### Batch Processing (Chatbot)
- Audio compression before upload
- Parallel processing where possible
- Caching of common responses
- Error handling with fallbacks

### Real-time Processing (Receptionist)
- WebSocket connection pooling
- Audio buffer optimization
- Low-latency audio processing
- Automatic reconnection

## 🔒 Security Considerations

1. **API Keys**: Store securely in environment variables
2. **HTTPS**: Required for microphone access
3. **CORS**: Properly configured for your domain
4. **Rate Limiting**: Implement to prevent abuse
5. **Audio Data**: Not stored permanently (privacy)

## 📈 Monitoring

Monitor these metrics:
- API response times
- WebSocket connection stability
- Audio quality metrics
- Error rates
- User engagement

## 📞 Telnyx Setup

### 1. Get Telnyx Credentials
1. Sign up at [telnyx.com](https://telnyx.com)
2. Navigate to API Keys section
3. Create a new API key
4. Copy your Messaging Profile ID from the Messaging section
5. Provision a phone number for calls and SMS

### 2. Configure Webhooks
1. Go to Telnyx Dashboard → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/telnyx/webhook.php`
3. Select events:
   - Call events: `call.initiated`, `call.answered`, `call.ended`
   - Messaging events: `message.received`, `message.finalized`
4. Set webhook secret and add to `.env` as `TELNYX_WEBHOOK_SECRET`

### 3. Test Integration
1. Send a test SMS via the sales interface
2. Make a test outbound call from receptionist interface
3. Check webhook logs at `/api/telnyx/webhook.php`
4. Verify call history at `/api/call-history.php`

## 🎉 Next Steps

1. Test both interfaces thoroughly
2. Configure Telnyx webhooks and phone numbers
3. Adjust voice settings as needed
4. Monitor API usage and costs
5. Gather user feedback
6. Optimize based on usage patterns

Your DONNA system is now ready with both batch and real-time voice capabilities, plus real PSTN calling and SMS messaging via Telnyx!

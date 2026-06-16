import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
// NOTE (WS2): The legacy batch OpenAI client is not required for realtime workstream.
// Importing it conditionally avoids hard failure if the file is absent.
let DonnaOpenAIClient = null;
try { DonnaOpenAIClient = (await import('../lib/openai-client.js')).default } catch {}
import DonnaRealtimeClient from '../lib/realtime-websocket-client.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize DONNA clients (legacy batch client optional)
const donnaClient = DonnaOpenAIClient ? new DonnaOpenAIClient() : null;

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'DONNA Voice Backend',
        timestamp: new Date().toISOString()
    });
});

// Test OpenAI connection
app.get('/api/test-connection', async (req, res) => {
    try {
        if (!donnaClient) throw new Error('Legacy client unavailable in WS2 scope');
        const test = await donnaClient.testAllSystems();
        res.json({
            success: true,
            tests: test
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Batch voice processing (for chatbot)
app.post('/api/voice-chat', async (req, res) => {
    try {
        if (!donnaClient) throw new Error('Legacy client unavailable in WS2 scope');
        const { action, audio_data, voice_id, user_id, text } = req.body;

        switch (action) {
            case 'speech_to_speech':
                // Convert base64 to buffer
                const audioBuffer = Buffer.from(audio_data, 'base64');
                
                // Process voice message
                const result = await donnaClient.processVoiceMessage(audioBuffer);
                
                if (result.success) {
                    // Convert audio buffer to base64 for response
                    const responseAudio = Buffer.from(result.audioBuffer).toString('base64');
                    
                    res.json({
                        success: true,
                        transcription: result.transcript,
                        response_text: result.response,
                        response_audio: responseAudio,
                        audio_format: 'mp3',
                        usage: result.usage
                    });
                } else {
                    throw new Error(result.error);
                }
                break;

            case 'text_to_speech':
                const ttsResult = await donnaClient.textToSpeech(text);
                
                if (ttsResult.success) {
                    const audioBase64 = Buffer.from(ttsResult.audioBuffer).toString('base64');
                    res.json({
                        success: true,
                        audio_data: audioBase64,
                        audio_format: ttsResult.format
                    });
                } else {
                    throw new Error(ttsResult.error);
                }
                break;

            case 'chat_completion':
                const chatResult = await donnaClient.chatCompletion(text);
                
                if (chatResult.success) {
                    res.json({
                        success: true,
                        reply: chatResult.message,
                        usage: chatResult.usage
                    });
                } else {
                    throw new Error(chatResult.error);
                }
                break;

            default:
                throw new Error('Invalid action specified');
        }

    } catch (error) {
        console.error('Voice chat error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get available voices (ElevenLabs integration)
app.get('/api/voices', async (req, res) => {
    try {
        // This would integrate with ElevenLabs API
        res.json({
            success: true,
            voices: [
                {
                    id: 'XcXEQzuLXRU9RcfWzEJt',
                    name: 'Custom DONNA Voice',
                    description: 'Your custom ElevenLabs voice'
                }
            ],
            default_voice: 'XcXEQzuLXRU9RcfWzEJt'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// WebSocket server for Realtime API
const wss = new WebSocketServer({ 
    server,
    path: '/realtime'
});

wss.on('connection', (ws, req) => {
    console.log('🔗 New WebSocket connection for Realtime API');
    
    let realtimeClient = null;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            switch (data.type) {
                case 'connect_realtime':
                    // Initialize Realtime client
                    realtimeClient = new DonnaRealtimeClient(process.env.OPENAI_API_KEY);

                    // Set up event handlers (normalize to client-facing types)
                    realtimeClient.on('session_created', (session) => {
                        ws.send(JSON.stringify({ type: 'session_created', session }));
                    });
                    realtimeClient.on('transcript_delta', (delta) => {
                        ws.send(JSON.stringify({ type: 'transcript_delta', delta }));
                    });
                    realtimeClient.on('audio_delta', (audioData) => {
                        ws.send(JSON.stringify({ type: 'audio_delta', audio: audioData.toString('base64') }));
                    });
                    realtimeClient.on('response_done', (response) => {
                        ws.send(JSON.stringify({ type: 'response_done', response }));
                    });
                    realtimeClient.on('error', (error) => {
                        ws.send(JSON.stringify({ type: 'error', error }));
                    });

                    if (process.env.ENABLE_SERVER_VAD === 'true') {
                    // Optional VAD auto-response
                    if (process.env.ENABLE_VAD === 'true') {
                        realtimeClient.on('speech_stopped', () => {
                            try { realtimeClient.requestResponse(); } catch {}
                        });
                    }
                    }

                    await realtimeClient.connect();
                    break;

                // OpenAI-style passthrough events from clients
                case 'conversation.item.create':
                    if (realtimeClient && data?.item?.content?.[0]?.text) {
                        realtimeClient.sendText(data.item.content[0].text);
                    }
                    break;
                case 'response.create':
                    // No-op here: DonnaRealtimeClient.sendText already requests a response
                    break;
                case 'input_audio_buffer.append':
                    if (realtimeClient && data.audio) {
                        const audioBuffer = Buffer.from(data.audio, 'base64');
                        realtimeClient.sendAudio(audioBuffer, false);
                    }
                    break;
                case 'input_audio_buffer.commit':
                    if (realtimeClient) {
                        // Trigger the model to respond after commit by sending empty with commit=true
                        realtimeClient.sendAudio(Buffer.alloc(0), true);
                    }
                    break;

                default:
                    ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
            }

        } catch (error) {
            console.error('WebSocket message error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
        }
    });

    ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        if (realtimeClient) {
            realtimeClient.disconnect();
        }
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        if (realtimeClient) {
            realtimeClient.disconnect();
        }
    });
});

// Start server
server.listen(port, () => {
    console.log('🧠 DONNA Voice Backend Server');
    console.log('==============================');
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🔗 WebSocket endpoint: ws://localhost:${port}/realtime`);
    console.log(`🌐 Health check: http://localhost:${port}/health`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

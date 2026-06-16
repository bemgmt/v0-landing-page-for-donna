import DonnaRealtimeClient from './lib/realtime-websocket-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRealtimeWebSocket() {
    console.log('🧠 DONNA Realtime WebSocket Test');
    console.log('=================================');

    const client = new DonnaRealtimeClient(process.env.OPENAI_API_KEY);

    // Set up event handlers
    client.on('session_created', (session) => {
        console.log('✅ Session created successfully');
        console.log('📋 Session ID:', session.id);
        
        // Test sending a text message
        setTimeout(() => {
            console.log('\n📤 Sending test message...');
            client.sendText("Hello DONNA, this is a test of the realtime system. Please respond briefly.");
        }, 1000);
    });

    client.on('speech_started', () => {
        console.log('🎤 User started speaking');
    });

    client.on('speech_stopped', () => {
        console.log('🎤 User stopped speaking');
    });

    client.on('transcript_delta', (delta) => {
        process.stdout.write(delta); // Real-time transcript
    });

    client.on('audio_delta', (audioData) => {
        console.log('🔊 Received audio chunk:', audioData.length, 'bytes');
    });

    client.on('response_done', (response) => {
        console.log('\n✅ Response completed');
        console.log('📊 Response details:', {
            id: response.id,
            status: response.status,
            usage: response.usage
        });
        
        // Disconnect after test
        setTimeout(() => {
            console.log('\n🔌 Disconnecting...');
            client.disconnect();
        }, 2000);
    });

    client.on('error', (error) => {
        console.error('❌ Error:', error);
    });

    client.on('disconnect', () => {
        console.log('👋 Test completed');
        process.exit(0);
    });

    try {
        console.log('🔗 Connecting to OpenAI Realtime API...');
        console.log('🎯 Model:', client.model);
        console.log('🌐 WebSocket URL:', client.wsUrl);
        
        await client.connect();
        
        console.log('⏳ Waiting for session setup...');
        
    } catch (error) {
        console.error('❌ Connection failed:', error);
        process.exit(1);
    }
}

// Run the test
testRealtimeWebSocket().catch(console.error);

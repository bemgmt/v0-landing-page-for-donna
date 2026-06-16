#!/usr/bin/env node

/**
 * Test Client for DONNA WebSocket Server
 * Demonstrates the secure authentication flow
 * Usage: node test-client.js [jwt_token]
 */

import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const wsUrl = `ws://localhost:${process.env.PORT || 3001}/realtime`;
const token = process.argv[2];

console.log(`🔗 Connecting to: ${wsUrl}`);

if (!token) {
    console.log('⚠️  No JWT token provided');
    console.log('💡 Usage: node test-client.js <jwt_token>');
    console.log('🔧 Generate token with: node generate-jwt.js');
    console.log('📝 Or run without auth if JWT_SECRET not set');
}

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    
    if (token && process.env.JWT_SECRET) {
        console.log('🔐 Authenticating...');
        ws.send(JSON.stringify({
            type: 'authenticate',
            token: token
        }));
    } else {
        console.log('🔓 No authentication required (development mode)');
        // Skip auth and connect directly
        setTimeout(() => {
            console.log('🤖 Connecting to OpenAI Realtime...');
            ws.send(JSON.stringify({
                type: 'connect_realtime'
            }));
        }, 100);
    }
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Received:`, message);
        
        if (message.type === 'auth_success') {
            console.log('✅ Authentication successful!');
            console.log('🤖 Connecting to OpenAI Realtime...');
            ws.send(JSON.stringify({
                type: 'connect_realtime'
            }));
        } else if (message.type === 'auth_error') {
            console.error('❌ Authentication failed:', message.error);
            ws.close();
        } else if (message.type === 'session.created') {
            console.log('🎉 OpenAI session created successfully!');
            // Test sending a simple message
            setTimeout(() => {
                console.log('💬 Sending test message...');
                ws.send(JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                        type: 'message',
                        role: 'user',
                        content: [{
                            type: 'input_text',
                            text: 'Hello, can you hear me?'
                        }]
                    }
                }));
                // Request response
                ws.send(JSON.stringify({
                    type: 'response.create'
                }));
            }, 1000);
        } else if (message.type === 'response.done') {
            console.log('✅ Test completed successfully!');
            setTimeout(() => ws.close(), 1000);
        }
    } catch (error) {
        console.log(`📨 Raw message:`, data.toString().substring(0, 100));
    }
});

ws.on('close', (code, reason) => {
    console.log(`🔌 Connection closed: ${code} ${reason}`);
    process.exit(0);
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
    process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
    console.log('⏰ Test timeout');
    ws.close();
    process.exit(1);
}, 30000);
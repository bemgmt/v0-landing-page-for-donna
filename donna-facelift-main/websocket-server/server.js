import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Initialize Sentry for the WS server if DSN is present
if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
    console.log('🛰️  Sentry initialized for WebSocket server');
}

const app = express();

// Trust proxy for Railway deployment (fixes rate limiting with X-Forwarded-For header)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', true);
}

const server = createServer(app);
const port = process.env.PORT || 3001;

// Security configuration
const ENABLE_WS_PROXY = process.env.ENABLE_WS_PROXY === 'true';
const AUTH_TIMEOUT_MS = parseInt(process.env.AUTH_TIMEOUT_MS || '10000');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
const JWT_SECRET = process.env.JWT_SECRET;
const MAX_CONNECTIONS_PER_IP = parseInt(process.env.MAX_CONNECTIONS_PER_IP || '3');
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minute
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10');
const ENABLE_SERVER_VAD = (process.env.ENABLE_SERVER_VAD || 'false') === 'true';

// --- GEMINI PROPOSED CHANGE START ---
// Connection tracking
const ipConnections = new Map(); // IP -> count
const ipRateLimits = new Map(); // IP -> { count, resetTime }

// Periodic cleanup for stale connections (heartbeat)
const STALE_CONNECTION_CLEANUP_INTERVAL_MS = 60000; // 1 minute

setInterval(() => {
    const now = Date.now();
    let staleRateLimits = 0;
    // Clean up stale IP rate limits
    for (const [ip, rateLimitInfo] of ipRateLimits.entries()) {
        if (now > rateLimitInfo.resetTime) {
            ipRateLimits.delete(ip);
            staleRateLimits++;
        }
    }
    if (staleRateLimits > 0) {
        console.log(`🧹 [HEARTBEAT] Cleaned up ${staleRateLimits} stale IP rate limit entries.`);
    }

    // Log current connection counts for monitoring.
    if (ipConnections.size > 0) {
        console.log('🩺 [HEARTBEAT] Current connection counts:', Object.fromEntries(
            Array.from(ipConnections.entries()).map(([ip, count]) => [sanitizeIP(ip), count])
        ));
    }
}, STALE_CONNECTION_CLEANUP_INTERVAL_MS);
// --- GEMINI PROPOSED CHANGE END ---

// --- OLD CODE TO BE DELETED START ---
// Connection tracking
// const ipConnections = new Map(); // IP -> count
// const ipRateLimits = new Map(); // IP -> { count, resetTime }
// --- OLD CODE TO BE DELETED END ---

// Security utilities
function sanitizeIP(ip) {
    // Mask the last octet for IPv4, last 64 bits for IPv6
    if (ip.includes('.')) {
        return ip.replace(/\.\d+$/, '.xxx');
    } else if (ip.includes(':')) {
        return ip.replace(/:[\w\d]*:[\w\d]*$/, ':xxxx:xxxx');
    }
    return 'xxx.xxx.xxx.xxx';
}

function logSecurityEvent(event, details = {}) {
    const sanitizedDetails = { ...details };
    if (sanitizedDetails.ip) {
        sanitizedDetails.ip = sanitizeIP(sanitizedDetails.ip);
    }
    console.log(`🔒 [SECURITY] ${event}:`, JSON.stringify(sanitizedDetails));
}

function checkRateLimit(ip) {
    const now = Date.now();
    const clientRateLimit = ipRateLimits.get(ip);
    
    if (!clientRateLimit) {
        ipRateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    
    if (now > clientRateLimit.resetTime) {
        ipRateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    
    if (clientRateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    
    clientRateLimit.count++;
    return true;
}

function validateOrigin(origin) {
    // Allow null origin in production (direct WebSocket connections)
    if (!origin || origin === 'null') {
        return true;
    }

    let list = ALLOWED_ORIGINS
    if (!list.length) {
        // If no origins configured, allow all in development
        if (process.env.NODE_ENV !== 'production') {
            return true;
        }
        // In production with no origins configured, allow null origins but log warning
        console.log('⚠️  WARNING: No ALLOWED_ORIGINS configured in production');
        return true;
    }

    return list.some(allowedOrigin => {
        if (allowedOrigin === '*') return true;
        return origin === allowedOrigin || origin?.endsWith(allowedOrigin);
    });
}

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
}

// Express rate limiting for HTTP endpoints
const httpRateLimit = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS * 2, // More lenient for HTTP
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health', // Skip rate limiting for health checks
    handler: (req, res) => {
        const ip = getClientIP(req);
        logSecurityEvent('HTTP_RATE_LIMIT_EXCEEDED', { ip, path: req.path });
        res.status(429).json({ 
            error: 'Too many requests',
            retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
        });
    }
});

// Configure CORS for WebSocket and HTTP requests
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Allow all origins in development
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // In production, check against allowed origins
        if (ALLOWED_ORIGINS.length === 0) {
            // If no origins configured, allow all (with warning)
            return callback(null, true);
        }

        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }

        // Log blocked origin for debugging
        console.log(`🔒 [CORS] Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(httpRateLimit);

// Sentry request middleware (captures breadcrumbs per HTTP request)
if (process.env.SENTRY_DSN) {
    // Place after JSON parsing so request bodies can be attached safely
    app.use(Sentry.Handlers.requestHandler());
}

// Feature flag check middleware
function checkFeatureFlag(req, res, next) {
    if (!ENABLE_WS_PROXY) {
        return res.status(503).json({
            error: 'WebSocket proxy service is currently disabled',
            service: 'DONNA WebSocket Server',
            timestamp: new Date().toISOString()
        });
    }
    next();
}

// Health check (no auth required)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'DONNA WebSocket Server',
        timestamp: new Date().toISOString(),
        websocket_proxy: ENABLE_WS_PROXY,
        features: {
            websocket_proxy: ENABLE_WS_PROXY,
            origin_validation: ALLOWED_ORIGINS.length > 0,
            jwt_auth: !!JWT_SECRET,
            rate_limiting: true
        }
    });
});

// Railway health check (root path)
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'DONNA WebSocket Server',
        message: 'WebSocket server is running',
        websocket_url: `/realtime`
    });
});

// Test endpoint
app.get('/test', checkFeatureFlag, (req, res) => {
    res.json({
        message: 'DONNA WebSocket Server is running!',
        websocket_url: `ws://${req.get('host')}/realtime`,
        security_enabled: {
            authentication: !!JWT_SECRET,
            origin_validation: ALLOWED_ORIGINS.length > 0,
            rate_limiting: true
        }
    });
});

// Sentry error middleware (must be after routes)
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
}

// --- GEMINI PROPOSED CHANGE START ---
// WebSocket server for OpenAI Realtime API
const wss = new WebSocketServer({ 
    server,
    path: '/realtime',
    verifyClient: (info) => {
        // Feature flag check
        if (!ENABLE_WS_PROXY) {
            logSecurityEvent('WS_CONNECTION_BLOCKED_FEATURE_DISABLED', { 
                ip: info.req.connection?.remoteAddress 
            });
            return false;
        }
        
        const ip = getClientIP(info.req);
        const origin = info.origin;
        
        // Origin validation
        if (!validateOrigin(origin)) {
            logSecurityEvent('WS_CONNECTION_BLOCKED_INVALID_ORIGIN', { 
                ip, 
                origin: origin || 'none'
            });
            return false;
        }
        
        // Rate limiting
        if (!checkRateLimit(ip)) {
            logSecurityEvent('WS_CONNECTION_BLOCKED_RATE_LIMIT', { ip });
            return false;
        }
        
        // Connection limits
        const currentConnections = ipConnections.get(ip) || 0;
        if (currentConnections >= MAX_CONNECTIONS_PER_IP) {
            logSecurityEvent('WS_CONNECTION_BLOCKED_CONNECTION_LIMIT', { 
                ip, 
                currentConnections,
                maxAllowed: MAX_CONNECTIONS_PER_IP
            });
            return false;
        }
        
        return true;
    }
});

wss.on('connection', (ws, req) => {
    const ip = getClientIP(req);
    
    // Track connection
    const currentConnections = ipConnections.get(ip) || 0;
    ipConnections.set(ip, currentConnections + 1);
    
    logSecurityEvent('WS_CONNECTION_ESTABLISHED', { 
        ip,
        totalConnections: currentConnections + 1
    });
    
    let openaiWs = null;
    let isAuthenticated = false;
    let authTimeout = null;
    
    // Set authentication timeout
    authTimeout = setTimeout(() => {
        if (!isAuthenticated) {
            logSecurityEvent('WS_CONNECTION_AUTH_TIMEOUT', { ip });
            ws.close(4001, 'Authentication timeout');
        }
    }, AUTH_TIMEOUT_MS);
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            // Handle authentication first
            if (data.type === 'authenticate') {
                if (!JWT_SECRET) {
                    ws.send(JSON.stringify({ 
                        type: 'auth_error', 
                        error: 'Authentication not configured' 
                    }));
                    return;
                }
                
                if (!data.token) {
                    logSecurityEvent('WS_AUTH_FAILED_NO_TOKEN', { ip });
                    ws.send(JSON.stringify({ 
                        type: 'auth_error', 
                        error: 'Token required' 
                    }));
                    return;
                }
                
                try {
                    const decoded = jwt.verify(data.token, JWT_SECRET);
                    isAuthenticated = true;
                    clearTimeout(authTimeout);
                    
                    logSecurityEvent('WS_AUTH_SUCCESS', { 
                        ip,
                        userId: decoded.sub || decoded.userId || 'unknown'
                    });
                    
                    ws.send(JSON.stringify({ 
                        type: 'auth_success',
                        message: 'Authentication successful'
                    }));
                    
                } catch (jwtError) {
                    logSecurityEvent('WS_AUTH_FAILED_INVALID_TOKEN', { 
                        ip,
                        error: jwtError.message
                    });
                    ws.send(JSON.stringify({ 
                        type: 'auth_error', 
                        error: 'Invalid token' 
                    }));
                    ws.close(4003, 'Authentication failed');
                }
                return;
            }
            
            // Require authentication for all other operations
            if (!isAuthenticated) {
                if (JWT_SECRET) {
                    ws.send(JSON.stringify({ 
                        type: 'auth_required', 
                        error: 'Please authenticate first' 
                    }));
                    return;
                } else {
                    // If no JWT secret is configured, skip auth (for development)
                    isAuthenticated = true;
                    clearTimeout(authTimeout);
                }
            }
            
            if (data.type === 'connect_realtime') {
                // Connect to OpenAI Realtime API
                const wsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
                
                openaiWs = new WebSocket(wsUrl, {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'OpenAI-Beta': 'realtime=v1'
                    }
                });

                openaiWs.on('open', () => {
                    console.log('✅ Connected to OpenAI Realtime API');
                    
                    // Send session configuration
                    const sessionConfig = {
                        modalities: ['text', 'audio'],
                        instructions: 'You are DONNA, a professional AI receptionist. Be warm, friendly, and concise.',
                        voice: 'alloy',
                        input_audio_format: 'pcm16',
                        output_audio_format: 'pcm16',
                        temperature: 0.7,
                    };
                    // Conditionally enable server-side VAD turn detection
                    if (ENABLE_SERVER_VAD) {
                        sessionConfig.turn_detection = { type: 'server_vad' };
                    }
                    openaiWs.send(JSON.stringify({
                        type: 'session.update',
                        session: sessionConfig
                    }));
                });

                openaiWs.on('message', (openaiMessage) => {
                    // Forward OpenAI messages to client
                    const text = openaiMessage.toString();
                    try {
                        const data = JSON.parse(text)
                        if (ENABLE_SERVER_VAD && data?.type === 'input_audio_buffer.speech_stopped') {
                            // Auto-request a response on VAD turn end (only when VAD enabled)
                            try { openaiWs.send(JSON.stringify({ type: 'response.create' })) } catch (e) { if (process.env.SENTRY_DSN) Sentry.captureException(e); }
                        }
                    } catch {}
                    ws.send(text);
                });

                openaiWs.on('close', () => {
                    console.log('🔌 OpenAI connection closed');
                    ws.send(JSON.stringify({ type: 'realtime_disconnected' }));
                });

                openaiWs.on('error', (error) => {
                    if (process.env.SENTRY_DSN) Sentry.captureException(error);
                    console.error('❌ OpenAI WebSocket error:', error);
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        error: 'OpenAI connection error' // Don't expose internal details
                    }));
                });

            } else if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
                // Forward client messages to OpenAI
                openaiWs.send(message.toString());
            }

        } catch (error) {
            if (process.env.SENTRY_DSN) Sentry.captureException(error);
            console.error('❌ Message error:', error);
            ws.send(JSON.stringify({ 
                type: 'error', 
                error: 'Invalid message format' // Don't expose internal details
            }));
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`🔌 Client disconnected (code: ${code}, reason: ${reason})`);

        // Clean up authentication timeout
        if (authTimeout) {
            clearTimeout(authTimeout);
        }

        // Decrement connection count with safeguards
        const currentConnections = ipConnections.get(ip) || 0;
        if (currentConnections > 0) {
            const newCount = currentConnections - 1;
            if (newCount === 0) {
                ipConnections.delete(ip);
            } else {
                ipConnections.set(ip, newCount);
            }
            logSecurityEvent('WS_CONNECTION_CLOSED', {
                ip,
                code,
                reason: reason?.toString(),
                remainingConnections: newCount
            });
        } else {
            logSecurityEvent('WS_CONNECTION_CLEANUP_WARNING', {
                ip,
                message: 'Attempted to close a connection that was not properly tracked.',
                currentConnections
            });
        }

        if (openaiWs) {
            openaiWs.close();
        }
    });
    
    ws.on('error', (error) => {
        if (process.env.SENTRY_DSN) Sentry.captureException(error);
        logSecurityEvent('WS_CONNECTION_ERROR', { 
            ip,
            error: error.message
        });
        // The 'close' event should fire automatically after an 'error' event,
        // which will handle the cleanup. We terminate just in case to prevent leaks.
        console.error('💥 WebSocket error, terminating connection:', error.message);
        ws.terminate();
    });
});
// --- GEMINI PROPOSED CHANGE END ---

// --- OLD CODE TO BE DELETED START ---
// // WebSocket server for OpenAI Realtime API
// const wss = new WebSocketServer({ 
//     server,
//     path: '/realtime',
//     verifyClient: (info) => {
//         // Feature flag check
//         if (!ENABLE_WS_PROXY) {
//             logSecurityEvent('WS_CONNECTION_BLOCKED_FEATURE_DISABLED', { 
//                 ip: info.req.connection?.remoteAddress 
//             });
//             return false;
//         }
        
//         const ip = getClientIP(info.req);
//         const origin = info.origin;
        
//         // Origin validation
//         if (!validateOrigin(origin)) {
//             logSecurityEvent('WS_CONNECTION_BLOCKED_INVALID_ORIGIN', { 
//                 ip, 
//                 origin: origin || 'none'
//             });
//             return false;
//         }
        
//         // Rate limiting
//         if (!checkRateLimit(ip)) {
//             logSecurityEvent('WS_CONNECTION_BLOCKED_RATE_LIMIT', { ip });
//             return false;
//         }
        
//         // Connection limits
//         const currentConnections = ipConnections.get(ip) || 0;
//         if (currentConnections >= MAX_CONNECTIONS_PER_IP) {
//             logSecurityEvent('WS_CONNECTION_BLOCKED_CONNECTION_LIMIT', { 
//                 ip, 
//                 currentConnections,
//                 maxAllowed: MAX_CONNECTIONS_PER_IP
//             });
//             return false;
//         }
        
//         return true;
//     }
// });

// wss.on('connection', (ws, req) => {
//     const ip = getClientIP(req);
    
//     // Track connection
//     const currentConnections = ipConnections.get(ip) || 0;
//     ipConnections.set(ip, currentConnections + 1);
    
//     logSecurityEvent('WS_CONNECTION_ESTABLISHED', { 
//         ip,
//         totalConnections: currentConnections + 1
//     });
    
//     let openaiWs = null;
//     let isAuthenticated = false;
//     let authTimeout = null;
    
//     // Set authentication timeout
//     authTimeout = setTimeout(() => {
//         if (!isAuthenticated) {
//             logSecurityEvent('WS_CONNECTION_AUTH_TIMEOUT', { ip });
//             ws.close(4001, 'Authentication timeout');
//         }
//     }, AUTH_TIMEOUT_MS);
    
//     ws.on('message', async (message) => {
//         try {
//             const data = JSON.parse(message.toString());
            
//             // Handle authentication first
//             if (data.type === 'authenticate') {
//                 if (!JWT_SECRET) {
//                     ws.send(JSON.stringify({ 
//                         type: 'auth_error', 
//                         error: 'Authentication not configured' 
//                     }));
//                     return;
//                 }
                
//                 if (!data.token) {
//                     logSecurityEvent('WS_AUTH_FAILED_NO_TOKEN', { ip });
//                     ws.send(JSON.stringify({ 
//                         type: 'auth_error', 
//                         error: 'Token required' 
//                     }));
//                     return;
//                 }
                
//                 try {
//                     const decoded = jwt.verify(data.token, JWT_SECRET);
//                     isAuthenticated = true;
//                     clearTimeout(authTimeout);
                    
//                     logSecurityEvent('WS_AUTH_SUCCESS', { 
//                         ip,
//                         userId: decoded.sub || decoded.userId || 'unknown'
//                     });
                    
//                     ws.send(JSON.stringify({ 
//                         type: 'auth_success',
//                         message: 'Authentication successful'
//                     }));
                    
//                 } catch (jwtError) {
//                     logSecurityEvent('WS_AUTH_FAILED_INVALID_TOKEN', { 
//                         ip,
//                         error: jwtError.message
//                     });
//                     ws.send(JSON.stringify({ 
//                         type: 'auth_error', 
//                         error: 'Invalid token' 
//                     }));
//                     ws.close(4003, 'Authentication failed');
//                 }
//                 return;
//             }
            
//             // Require authentication for all other operations
//             if (!isAuthenticated) {
//                 if (JWT_SECRET) {
//                     ws.send(JSON.stringify({ 
//                         type: 'auth_required', 
//                         error: 'Please authenticate first' 
//                     }));
//                     return;
//                 } else {
//                     // If no JWT secret is configured, skip auth (for development)
//                     isAuthenticated = true;
//                     clearTimeout(authTimeout);
//                 }
//             }
            
//             if (data.type === 'connect_realtime') {
//                 // Connect to OpenAI Realtime API
//                 const wsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
                
//                 openaiWs = new WebSocket(wsUrl, {
//                     headers: {
//                         'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                         'OpenAI-Beta': 'realtime=v1'
//                     }
//                 });

//                 openaiWs.on('open', () => {
//                     console.log('✅ Connected to OpenAI Realtime API');
                    
//                     // Send session configuration
//                     const sessionConfig = {
//                         modalities: ['text', 'audio'],
//                         instructions: 'You are DONNA, a professional AI receptionist. Be warm, friendly, and concise.',
//                         voice: 'alloy',
//                         input_audio_format: 'pcm16',
//                         output_audio_format: 'pcm16',
//                         temperature: 0.7,
//                     };
//                     // Conditionally enable server-side VAD turn detection
//                     if (ENABLE_SERVER_VAD) {
//                         sessionConfig.turn_detection = { type: 'server_vad' };
//                     }
//                     openaiWs.send(JSON.stringify({
//                         type: 'session.update',
//                         session: sessionConfig
//                     }));
//                 });

//                 openaiWs.on('message', (openaiMessage) => {
//                     // Forward OpenAI messages to client
//                     const text = openaiMessage.toString();
//                     try {
//                         const data = JSON.parse(text)
//                         if (ENABLE_SERVER_VAD && data?.type === 'input_audio_buffer.speech_stopped') {
//                             // Auto-request a response on VAD turn end (only when VAD enabled)
//                             try { openaiWs.send(JSON.stringify({ type: 'response.create' })) } catch (e) { if (process.env.SENTRY_DSN) Sentry.captureException(e); }
//                         }
//                     } catch {}
//                     ws.send(text);
//                 });

//                 openaiWs.on('close', () => {
//                     console.log('🔌 OpenAI connection closed');
//                     ws.send(JSON.stringify({ type: 'realtime_disconnected' }));
//                 });

//                 openaiWs.on('error', (error) => {
//                     if (process.env.SENTRY_DSN) Sentry.captureException(error);
//                     console.error('❌ OpenAI WebSocket error:', error);
//                     ws.send(JSON.stringify({ 
//                         type: 'error', 
//                         error: 'OpenAI connection error' // Don't expose internal details
//                     }));
//                 });

//             } else if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
//                 // Forward client messages to OpenAI
//                 openaiWs.send(message.toString());
//             }

//         } catch (error) {
//             if (process.env.SENTRY_DSN) Sentry.captureException(error);
//             console.error('❌ Message error:', error);
//             ws.send(JSON.stringify({ 
//                 type: 'error', 
//                 error: 'Invalid message format' // Don't expose internal details
//             }));
//         }
//     });

//     ws.on('close', (code, reason) => {
//         console.log('🔌 Client disconnected');
        
//         // Clean up authentication timeout
//         if (authTimeout) {
//             clearTimeout(authTimeout);
//         }
        
//         // Decrement connection count
//         const currentConnections = ipConnections.get(ip) || 0;
//         if (currentConnections <= 1) {
//             ipConnections.delete(ip);
//         } else {
//             ipConnections.set(ip, currentConnections - 1);
//         }
        
//         logSecurityEvent('WS_CONNECTION_CLOSED', { 
//             ip,
//             code,
//             reason: reason?.toString(),
//             remainingConnections: Math.max(0, currentConnections - 1)
//         });
        
//         if (openaiWs) {
//             openaiWs.close();
//         }
//     });
    
//     ws.on('error', (error) => {
//         if (process.env.SENTRY_DSN) Sentry.captureException(error);
//         logSecurityEvent('WS_CONNECTION_ERROR', { 
//             ip,
//             error: error.message
//         });
//     });
// });
// --- OLD CODE TO BE DELETED END ---


// Graceful shutdown
process.on('unhandledRejection', (reason) => {
    if (process.env.SENTRY_DSN) {
        const err = reason instanceof Error ? reason : new Error(String(reason));
        Sentry.captureException(err);
    }
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    if (process.env.SENTRY_DSN) Sentry.captureException(error);
    console.error('Uncaught Exception:', error);
});

process.on('SIGTERM', () => {
    console.log('🔄 Graceful shutdown initiated...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🔄 Graceful shutdown initiated...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Railway requires binding to 0.0.0.0, not localhost
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

server.listen(port, host, () => {
    console.log('🧠 DONNA WebSocket Server (Secured)');
    console.log(`🚀 Server running on ${host}:${port}`);
    console.log(`🔗 WebSocket: ws://${host}:${port}/realtime`);
    console.log(`🔒 Security Features:`);
    console.log(`   - WebSocket Proxy: ${ENABLE_WS_PROXY ? 'Enabled' : 'Disabled'}`);
    console.log(`   - JWT Authentication: ${JWT_SECRET ? 'Enabled' : 'Disabled (Development Mode)'}`);
    console.log(`   - Origin Validation: ${ALLOWED_ORIGINS.length > 0 ? 'Enabled' : 'Disabled'}`);
    console.log(`   - Rate Limiting: Enabled (${RATE_LIMIT_MAX_REQUESTS} req/min)`);
    console.log(`   - Connection Limits: ${MAX_CONNECTIONS_PER_IP} per IP`);

    if (!JWT_SECRET) {
        console.log('⚠️  WARNING: JWT_SECRET not set - authentication disabled!');
    }
    if (ALLOWED_ORIGINS.length === 0) {
        console.log('⚠️  WARNING: ALLOWED_ORIGINS not set - all origins allowed!');
    }
});

export default app;
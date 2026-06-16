#!/usr/bin/env node

/**
 * JWT Token Generator for DONNA WebSocket Server
 * Usage: node generate-jwt.js [userId]
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const userId = process.argv[2] || 'test-user';

if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET not found in environment');
    console.log('\n🔧 To generate a new JWT secret:');
    console.log('node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    console.log('\n📝 Add to your .env file:');
    console.log('JWT_SECRET=your_generated_secret');
    process.exit(1);
}

// Generate token with 1 hour expiry
const token = jwt.sign(
    {
        sub: userId,
        userId: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    },
    JWT_SECRET
);

console.log(`✅ Generated JWT token for user: ${userId}`);
console.log(`🔑 Token: ${token}`);
console.log(`⏰ Expires: ${new Date(Date.now() + (60 * 60 * 1000)).toISOString()}`);

// Test the token
try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`✅ Token verification successful`);
    console.log(`👤 User ID: ${decoded.userId || decoded.sub}`);
} catch (error) {
    console.error(`❌ Token verification failed: ${error.message}`);
}
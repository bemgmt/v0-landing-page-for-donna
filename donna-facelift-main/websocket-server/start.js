#!/usr/bin/env node

// Simple startup script for Railway deployment
import './server.js';

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

console.log('WebSocket server startup script loaded');

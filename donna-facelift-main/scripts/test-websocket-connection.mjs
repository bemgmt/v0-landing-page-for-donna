#!/usr/bin/env node

/**
 * WebSocket Connection Test Script
 * 
 * Tests WebSocket connectivity to the production server
 * Validates connection establishment, message handling, and cleanup
 */

import WebSocket from 'ws';
import { setTimeout } from 'timers/promises';

// Configuration
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://donna-interactive-production.up.railway.app/realtime';
const TEST_TIMEOUT = 10000; // 10 seconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class WebSocketTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const color = colors[level] || colors.reset;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  pass(message) {
    this.log('green', `✓ ${message}`);
    this.results.passed++;
  }

  fail(message) {
    this.log('red', `✗ ${message}`);
    this.results.failed++;
  }

  warn(message) {
    this.log('yellow', `⚠ ${message}`);
    this.results.warnings++;
  }

  info(message) {
    this.log('blue', `ℹ ${message}`);
  }

  async testBasicConnection() {
    this.info('Testing basic WebSocket connection...');
    
    return new Promise((resolve) => {
      const ws = new WebSocket(WEBSOCKET_URL);
      let connected = false;
      
      const timeout = setTimeout(() => {
        if (!connected) {
          ws.terminate();
          this.fail('Connection timeout - server not responding');
          resolve(false);
        }
      }, CONNECTION_TIMEOUT);

      ws.on('open', () => {
        connected = true;
        clearTimeout(timeout);
        this.pass('WebSocket connection established successfully');
        ws.close();
        resolve(true);
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        this.fail(`Connection error: ${error.message}`);
        resolve(false);
      });

      ws.on('close', (code, reason) => {
        if (connected) {
          this.info(`Connection closed cleanly (code: ${code})`);
        }
      });
    });
  }

  async testMessageHandling() {
    this.info('Testing message handling...');
    
    return new Promise((resolve) => {
      const ws = new WebSocket(WEBSOCKET_URL);
      let messageReceived = false;
      
      const timeout = setTimeout(() => {
        ws.terminate();
        if (!messageReceived) {
          this.fail('No response received to test message');
        }
        resolve(messageReceived);
      }, TEST_TIMEOUT);

      ws.on('open', () => {
        this.info('Sending test message...');
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.pass(`Received message: ${message.type || 'unknown type'}`);
          messageReceived = true;
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        } catch (error) {
          this.warn(`Received non-JSON message: ${data.toString().substring(0, 100)}`);
          messageReceived = true;
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        this.fail(`Message handling error: ${error.message}`);
        resolve(false);
      });
    });
  }

  async testConnectionLimits() {
    this.info('Testing connection limits...');
    
    const connections = [];
    const maxConnections = 5; // Test with a reasonable number
    
    try {
      for (let i = 0; i < maxConnections; i++) {
        const ws = new WebSocket(WEBSOCKET_URL);
        connections.push(ws);
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Connection ${i + 1} timeout`));
          }, CONNECTION_TIMEOUT);
          
          ws.on('open', () => {
            clearTimeout(timeout);
            resolve();
          });
          
          ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
      }
      
      this.pass(`Successfully established ${maxConnections} concurrent connections`);
      
      // Clean up connections
      connections.forEach(ws => ws.close());
      
      return true;
    } catch (error) {
      this.fail(`Connection limit test failed: ${error.message}`);
      
      // Clean up any open connections
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      
      return false;
    }
  }

  async testCORSHeaders() {
    this.info('Testing CORS configuration...');
    
    // This is a basic test - in a real browser environment, CORS would be enforced
    // Here we just verify the connection works, which implies CORS is properly configured
    
    return new Promise((resolve) => {
      const ws = new WebSocket(WEBSOCKET_URL, {
        headers: {
          'Origin': 'https://donna-interactive-grid.vercel.app'
        }
      });
      
      const timeout = setTimeout(() => {
        ws.terminate();
        this.fail('CORS test timeout');
        resolve(false);
      }, CONNECTION_TIMEOUT);

      ws.on('open', () => {
        clearTimeout(timeout);
        this.pass('CORS configuration allows production origin');
        ws.close();
        resolve(true);
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        this.fail(`CORS test failed: ${error.message}`);
        resolve(false);
      });
    });
  }

  async runAllTests() {
    console.log(`${colors.cyan}=== WebSocket Connection Test Suite ===${colors.reset}`);
    console.log(`${colors.blue}Testing WebSocket server: ${WEBSOCKET_URL}${colors.reset}\n`);

    const tests = [
      { name: 'Basic Connection', fn: () => this.testBasicConnection() },
      { name: 'Message Handling', fn: () => this.testMessageHandling() },
      { name: 'Connection Limits', fn: () => this.testConnectionLimits() },
      { name: 'CORS Configuration', fn: () => this.testCORSHeaders() }
    ];

    for (const test of tests) {
      console.log(`${colors.cyan}--- ${test.name} ---${colors.reset}`);
      try {
        await test.fn();
      } catch (error) {
        this.fail(`Test "${test.name}" threw an error: ${error.message}`);
      }
      console.log(''); // Add spacing between tests
    }

    this.printSummary();
    return this.results.failed === 0;
  }

  printSummary() {
    console.log(`${colors.cyan}=== Test Summary ===${colors.reset}`);
    console.log(`${colors.green}Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${this.results.warnings}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    
    if (this.results.failed === 0) {
      console.log(`\n${colors.green}🎉 All WebSocket tests passed!${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ Some WebSocket tests failed. Check the server configuration.${colors.reset}`);
    }
  }
}

// Main execution
async function main() {
  const tester = new WebSocketTester();
  
  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`${colors.red}Test suite failed with error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default WebSocketTester;

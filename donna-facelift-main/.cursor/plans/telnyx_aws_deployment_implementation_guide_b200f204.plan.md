---
name: Telnyx AWS Deployment Implementation Guide
overview: ""
todos: []
---

# Telnyx AWS Deployment Implementation Guide

## Overview

This guide provides step-by-step instructions for deploying Telnyx voice and messaging integration to AWS. The implementation includes webhook handling, call control, and SMS messaging capabilities.

## Prerequisites

- AWS Account with appropriate permissions
- Telnyx account with API credentials
- Existing DONNA codebase with Telnyx integration files
- AWS CLI configured (for CLI deployments)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Infrastructure                   │
├─────────────────────────────────────────────────────────┤
│  Option 1: Lambda (Serverless)                         │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ API Gateway      │  │ Lambda Function   │           │
│  │ (Webhook)        │→ │ (PHP or Node.js)  │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                         │
│  Option 2: EC2/ECS (Container)                         │
│  ┌──────────────────┐                                  │
│  │ EC2/ECS Instance │                                  │
│  │ (PHP Runtime)    │                                  │
│  └──────────────────┘                                  │
├─────────────────────────────────────────────────────────┤
│  Supporting Services                                    │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ DynamoDB         │  │ CloudWatch Logs  │           │
│  │ (Call History)   │  │ (Monitoring)      │           │
│  └──────────────────┘  └──────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

## Deployment Options

### Option 1: AWS Lambda with PHP (Recommended - Easiest to Copy)

**Best For:** Serverless deployment, automatic scaling, pay-per-use

**Pros:**

- Uses existing PHP webhook code (minimal changes)
- No server management
- Automatic scaling
- Cost-effective for variable traffic

**Cons:**

- Requires Bref runtime layer
- 15-minute execution limit
- Cold start latency

### Option 2: AWS Lambda with Node.js

**Best For:** Better Lambda integration, TypeScript support

**Pros:**

- Native Lambda support
- Better Vercel integration
- TypeScript type safety
- Faster cold starts

**Cons:**

- Requires rewriting webhook handler
- More dependencies

### Option 3: EC2/ECS with PHP

**Best For:** Existing PHP infrastructure, full control

**Pros:**

- Uses existing code as-is
- No Lambda limitations
- Full server control
- Easier debugging

**Cons:**

- Server management required
- Higher base costs
- Manual scaling

---

## Option 1: AWS Lambda with PHP (Bref)

### Step 1: Install Dependencies

```bash
# Install Bref and AWS SDK
composer require bref/bref aws/aws-sdk-php

# Install Serverless Framework
npm install -g serverless
npm install --save-dev serverless
```

### Step 2: Create Lambda Handler

Create file: `lambda/telnyx-webhook-handler.php`

```php
<?php
/**
 * AWS Lambda Handler for Telnyx Webhook
 * Wraps the existing webhook.php to work with Lambda/API Gateway
 */

require __DIR__ . '/../vendor/autoload.php';

use Bref\Context\Context;
use Bref\Event\Http\HttpRequestEvent;
use Bref\Event\Http\HttpResponse;

function handler(HttpRequestEvent $event, Context $context): HttpResponse
{
    try {
        // Get raw request body
        $rawBody = $event->getBody();
        if ($event->isBase64Encoded()) {
            $rawBody = base64_decode($rawBody);
        }
        
        // Get signature from headers
        $headers = $event->getHeaders();
        $signature = $headers['telnyx-signature-ed25519'] ?? 
                     $headers['Telnyx-Signature-Ed25519'] ?? '';
        
        // Verify webhook signature
        $webhookSecret = getenv('TELNYX_WEBHOOK_SECRET');
        if ($webhookSecret && !verifyWebhookSignature($rawBody, $signature, $webhookSecret)) {
            return new HttpResponse(
                json_encode(['error' => 'Invalid webhook signature']),
                401,
                ['Content-Type' => 'application/json']
            );
        }
        
        // Parse webhook data
        $data = json_decode($rawBody, true);
        
        if (!$data || !isset($data['data'])) {
            return new HttpResponse(
                json_encode(['error' => 'Invalid webhook payload']),
                400,
                ['Content-Type' => 'application/json']
            );
        }
        
        $eventType = $data['data']['event_type'] ?? $data['event_type'] ?? 'unknown';
        $eventData = $data['data']['payload'] ?? $data['data'] ?? [];
        
        // Handle different event types
        switch ($eventType) {
            case 'call.initiated':
            case 'call.answered':
            case 'call.ended':
            case 'call.hangup':
                handleCallEvent($eventType, $eventData);
                break;
                
            case 'message.received':
            case 'message.finalized':
            case 'message.sending.failed':
                handleMessagingEvent($eventType, $eventData);
                break;
                
            default:
                error_log("Telnyx webhook: Unknown event type: $eventType");
        }
        
        return new HttpResponse(
            json_encode(['status' => 'received']),
            200,
            ['Content-Type' => 'application/json']
        );
        
    } catch (Exception $e) {
        error_log("Telnyx webhook error: " . $e->getMessage());
        return new HttpResponse(
            json_encode(['status' => 'error', 'message' => $e->getMessage()]),
            200,
            ['Content-Type' => 'application/json']
        );
    }
}

function handleCallEvent($eventType, $eventData) {
    $callId = $eventData['call_control_id'] ?? $eventData['call_session_id'] ?? null;
    $from = $eventData['from'] ?? null;
    $to = $eventData['to'] ?? null;
    $status = $eventData['call_status'] ?? 'unknown';
    
    storeCallEvent([
        'call_id' => $callId,
        'event_type' => $eventType,
        'from' => $from,
        'to' => $to,
        'status' => $status,
        'occurred_at' => $eventData['occurred_at'] ?? date('c'),
        'duration' => $eventData['duration_seconds'] ?? null,
        'recording_url' => $eventData['recording_urls'][0] ?? null,
        'raw_data' => $eventData
    ]);
    
    if (getenv('ENABLE_VOICE_FANOUT')) {
        fanoutCallEvent($eventType, $eventData);
    }
}

function handleMessagingEvent($eventType, $eventData) {
    $messageId = $eventData['id'] ?? null;
    $from = $eventData['from']['phone_number'] ?? $eventData['from'] ?? null;
    $to = $eventData['to'][0]['phone_number'] ?? $eventData['to'] ?? null;
    $text = $eventData['text'] ?? $eventData['body'] ?? '';
    $status = $eventData['status'] ?? 'unknown';
    
    storeMessageEvent([
        'message_id' => $messageId,
        'event_type' => $eventType,
        'from' => $from,
        'to' => $to,
        'text' => $text,
        'status' => $status,
        'occurred_at' => $eventData['occurred_at'] ?? date('c'),
        'raw_data' => $eventData
    ]);
    
    if ($eventType === 'message.received') {
        processIncomingMessage($eventData);
    }
}

function storeCallEvent($eventData) {
    // Option 1: DynamoDB
    if (getenv('AWS_DYNAMODB_TABLE')) {
        try {
            $dynamodb = new \Aws\DynamoDb\DynamoDbClient([
                'region' => getenv('AWS_REGION') ?: 'us-east-1',
                'version' => 'latest'
            ]);
            
            $dynamodb->putItem([
                'TableName' => getenv('AWS_DYNAMODB_TABLE'),
                'Item' => [
                    'call_id' => ['S' => $eventData['call_id'] ?? 'unknown'],
                    'timestamp' => ['N' => (string)time()],
                    'event_data' => ['S' => json_encode($eventData)]
                ]
            ]);
            return;
        } catch (Exception $e) {
            error_log("DynamoDB error: " . $e->getMessage());
        }
    }
    
    // Option 2: Supabase
    if (getenv('SUPABASE_URL') && getenv('SUPABASE_SERVICE_ROLE_KEY')) {
        try {
            $ch = curl_init(getenv('SUPABASE_URL') . '/rest/v1/call_history');
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => [
                    'apikey: ' . getenv('SUPABASE_SERVICE_ROLE_KEY'),
                    'Authorization: Bearer ' . getenv('SUPABASE_SERVICE_ROLE_KEY'),
                    'Content-Type: application/json',
                    'Prefer: return=minimal'
                ],
                CURLOPT_POSTFIELDS => json_encode([$eventData]),
                CURLOPT_RETURNTRANSFER => true
            ]);
            curl_exec($ch);
            curl_close($ch);
            return;
        } catch (Exception $e) {
            error_log("Supabase error: " . $e->getMessage());
        }
    }
    
    // Option 3: CloudWatch Logs (always available)
    error_log("Call event: " . json_encode($eventData));
}

function storeMessageEvent($eventData) {
    error_log("Message event: " . json_encode($eventData));
}

function fanoutCallEvent($eventType, $eventData) {
    $endpoints = [
        '/api/marketing.php',
        '/api/sales/overview.php',
        '/api/secretary/dashboard.php'
    ];
    
    $baseUrl = getenv('API_BASE_URL') ?: getenv('DOMAIN_NAME') ?: '';
    
    foreach ($endpoints as $endpoint) {
        $ch = curl_init($baseUrl . $endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'action' => 'voice_event',
                'event_type' => $eventType,
                'data' => $eventData
            ]),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-Internal-Secret: ' . (getenv('API_SECRET') ?: '')
            ],
            CURLOPT_TIMEOUT => 2,
            CURLOPT_RETURNTRANSFER => true
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}

function processIncomingMessage($eventData) {
    error_log("Incoming message: " . json_encode($eventData));
}

function verifyWebhookSignature($payload, $signature, $secret) {
    if (empty($signature) || empty($secret)) return false;
    // TODO: Implement proper Ed25519 verification
    return !empty($signature);
}
```

### Step 3: Create Serverless Configuration

Create file: `serverless.yml`

```yaml
service: donna-telnyx-webhook

provider:
  name: aws
  runtime: provided.al2
  region: us-east-1
  environment:
    TELNYX_WEBHOOK_SECRET: ${env:TELNYX_WEBHOOK_SECRET}
    TELNYX_API_KEY: ${env:TELNYX_API_KEY}
    TELNYX_CONNECTION_ID: ${env:TELNYX_CONNECTION_ID}
    SUPABASE_URL: ${env:SUPABASE_URL}
    SUPABASE_SERVICE_ROLE_KEY: ${env:SUPABASE_SERVICE_ROLE_KEY}
    API_BASE_URL: ${env:API_BASE_URL}
    API_SECRET: ${env:API_SECRET}
    ENABLE_VOICE_FANOUT: ${env:ENABLE_VOICE_FANOUT, 'false'}
    AWS_DYNAMODB_TABLE: ${env:AWS_DYNAMODB_TABLE, ''}
    AWS_REGION: ${env:AWS_REGION, 'us-east-1'}

functions:
  webhook:
    handler: lambda/telnyx-webhook-handler.php
    description: Telnyx webhook handler for call and messaging events
    timeout: 30
    memorySize: 512
    events:
      - httpApi:
          path: /api/telnyx/webhook
          method: post
          cors: true

plugins:
  - ./vendor/bref/bref

bref:
  layers:
    - ${bref:layer.php-81}
```

### Step 4: Deploy to AWS

```bash
# Configure AWS credentials
aws configure

# Deploy
serverless deploy

# Output will show webhook URL:
# https://xxxxx.execute-api.us-east-1.amazonaws.com/api/telnyx/webhook
```

### Step 5: Configure Environment Variables

Set in AWS Lambda Console or via CLI:

```bash
aws lambda update-function-configuration \
  --function-name donna-telnyx-webhook-dev-webhook \
  --environment Variables="{
    TELNYX_WEBHOOK_SECRET=your_secret,
    TELNYX_API_KEY=your_key,
    TELNYX_CONNECTION_ID=your_connection_id,
    SUPABASE_URL=your_url,
    SUPABASE_SERVICE_ROLE_KEY=your_key
  }"
```

---

## Option 2: AWS Lambda with Node.js

### Step 1: Create Node.js Handler

Create file: `lambda/telnyx-webhook-handler.js` (or `.ts`)

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
}));

exports.handler = async (event) => {
  try {
    // Get raw body
    const rawBody = event.body || '';
    const body = event.isBase64Encoded ? Buffer.from(rawBody, 'base64').toString() : rawBody;
    
    // Get signature
    const headers = event.headers || {};
    const signature = headers['telnyx-signature-ed25519'] || 
                      headers['Telnyx-Signature-Ed25519'] || '';
    
    // Verify signature
    const webhookSecret = process.env.TELNYX_WEBHOOK_SECRET;
    if (webhookSecret && !verifyWebhookSignature(body, signature, webhookSecret)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid webhook signature' })
      };
    }
    
    // Parse data
    const data = JSON.parse(body);
    if (!data || !data.data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid webhook payload' })
      };
    }
    
    const eventType = data.data.event_type || data.event_type || 'unknown';
    const eventData = data.data.payload || data.data || [];
    
    // Handle events
    switch (eventType) {
      case 'call.initiated':
      case 'call.answered':
      case 'call.ended':
      case 'call.hangup':
        await handleCallEvent(eventType, eventData);
        break;
      case 'message.received':
      case 'message.finalized':
      case 'message.sending.failed':
        await handleMessagingEvent(eventType, eventData);
        break;
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'received' })
    };
    
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 200, // Return 200 to prevent retries
      body: JSON.stringify({ status: 'error', message: error.message })
    };
  }
};

async function handleCallEvent(eventType, eventData) {
  const callEvent = {
    call_id: eventData.call_control_id || eventData.call_session_id || null,
    event_type: eventType,
    from: eventData.from || null,
    to: eventData.to || null,
    status: eventData.call_status || 'unknown',
    occurred_at: eventData.occurred_at || new Date().toISOString(),
    duration: eventData.duration_seconds || null,
    recording_url: eventData.recording_urls?.[0] || null,
    raw_data: eventData
  };
  
  await storeCallEvent(callEvent);
  
  if (process.env.ENABLE_VOICE_FANOUT === 'true') {
    await fanoutCallEvent(eventType, eventData);
  }
}

async function handleMessagingEvent(eventType, eventData) {
  const messageEvent = {
    message_id: eventData.id || null,
    event_type: eventType,
    from: eventData.from?.phone_number || eventData.from || null,
    to: eventData.to?.[0]?.phone_number || eventData.to || null,
    text: eventData.text || eventData.body || '',
    status: eventData.status || 'unknown',
    occurred_at: eventData.occurred_at || new Date().toISOString(),
    raw_data: eventData
  };
  
  await storeMessageEvent(messageEvent);
  
  if (eventType === 'message.received') {
    await processIncomingMessage(eventData);
  }
}

async function storeCallEvent(eventData) {
  // Option 1: DynamoDB
  if (process.env.AWS_DYNAMODB_TABLE) {
    try {
      await dynamoClient.send(new PutCommand({
        TableName: process.env.AWS_DYNAMODB_TABLE,
        Item: {
          call_id: eventData.call_id || 'unknown',
          timestamp: Date.now(),
          event_data: eventData
        }
      }));
      return;
    } catch (error) {
      console.error('DynamoDB error:', error);
    }
  }
  
  // Option 2: Supabase
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/call_history`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify([eventData])
      });
      if (!response.ok) throw new Error(`Supabase error: ${response.statusText}`);
      return;
    } catch (error) {
      console.error('Supabase error:', error);
    }
  }
  
  // Option 3: CloudWatch Logs
  console.log('Call event:', JSON.stringify(eventData));
}

async function storeMessageEvent(eventData) {
  console.log('Message event:', JSON.stringify(eventData));
}

async function fanoutCallEvent(eventType, eventData) {
  const endpoints = [
    '/api/marketing.php',
    '/api/sales/overview.php',
    '/api/secretary/dashboard.php'
  ];
  
  const baseUrl = process.env.API_BASE_URL || process.env.DOMAIN_NAME || '';
  
  const promises = endpoints.map(endpoint => 
    fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.API_SECRET || ''
      },
      body: JSON.stringify({
        action: 'voice_event',
        event_type: eventType,
        data: eventData
      }),
      signal: AbortSignal.timeout(2000)
    }).catch(err => console.error(`Fanout error for ${endpoint}:`, err))
  );
  
  await Promise.allSettled(promises);
}

async function processIncomingMessage(eventData) {
  console.log('Incoming message:', JSON.stringify(eventData));
}

function verifyWebhookSignature(payload, signature, secret) {
  if (!signature || !secret) return false;
  // TODO: Implement proper Ed25519 verification using crypto library
  // For now, basic validation
  return signature.length > 0;
}
```

### Step 2: Create package.json

Create file: `lambda/package.json`

```json
{
  "name": "telnyx-webhook-handler",
  "version": "1.0.0",
  "description": "Telnyx webhook handler for AWS Lambda",
  "main": "telnyx-webhook-handler.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  },
  "engines": {
    "node": ">=18.x"
  }
}
```

### Step 3: Create Serverless Configuration

Create file: `serverless-nodejs.yml`

```yaml
service: donna-telnyx-webhook-nodejs

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    TELNYX_WEBHOOK_SECRET: ${env:TELNYX_WEBHOOK_SECRET}
    TELNYX_API_KEY: ${env:TELNYX_API_KEY}
    TELNYX_CONNECTION_ID: ${env:TELNYX_CONNECTION_ID}
    SUPABASE_URL: ${env:SUPABASE_URL}
    SUPABASE_SERVICE_ROLE_KEY: ${env:SUPABASE_SERVICE_ROLE_KEY}
    API_BASE_URL: ${env:API_BASE_URL}
    API_SECRET: ${env:API_SECRET}
    ENABLE_VOICE_FANOUT: ${env:ENABLE_VOICE_FANOUT, 'false'}
    AWS_DYNAMODB_TABLE: ${env:AWS_DYNAMODB_TABLE, ''}
    AWS_REGION: ${env:AWS_REGION, 'us-east-1'}

functions:
  webhook:
    handler: lambda/telnyx-webhook-handler.handler
    description: Telnyx webhook handler for call and messaging events
    timeout: 30
    memorySize: 512
    events:
      - httpApi:
          path: /api/telnyx/webhook
          method: post
          cors: true
```

### Step 4: Deploy to AWS

```bash
# Install dependencies
cd lambda
npm install
cd ..

# Deploy
serverless deploy --config serverless-nodejs.yml
```

---

## Option 3: EC2/ECS with PHP

### Step 1: Create Dockerfile

Create file: `Dockerfile`

```dockerfile
FROM php:8.1-apache

# Install dependencies
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    curl \
    && docker-php-ext-install zip pdo pdo_mysql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application
WORKDIR /var/www/html
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Configure Apache
RUN a2enmod rewrite
COPY docker/apache-config.conf /etc/apache2/sites-available/000-default.conf

# Set permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
CMD ["apache2-foreground"]
```

### Step 2: Create Apache Configuration

Create file: `docker/apache-config.conf`

```apache
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html
    
    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

### Step 3: Create ECS Task Definition

Create file: `ecs-task-definition.json`

```json
{
  "family": "donna-telnyx-webhook",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "telnyx-webhook",
      "image": "YOUR_ECR_REPO_URI:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "TELNYX_WEBHOOK_SECRET",
          "value": "YOUR_SECRET"
        },
        {
          "name": "TELNYX_API_KEY",
          "value": "YOUR_KEY"
        },
        {
          "name": "SUPABASE_URL",
          "value": "YOUR_URL"
        },
        {
          "name": "SUPABASE_SERVICE_ROLE_KEY",
          "value": "YOUR_KEY"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/donna-telnyx-webhook",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Step 4: Deploy to ECS

```bash
# Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker build -t donna-telnyx-webhook .
docker tag donna-telnyx-webhook:latest YOUR_ECR_REPO_URI:latest
docker push YOUR_ECR_REPO_URI:latest

# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create or update service
aws ecs create-service \
  --cluster YOUR_CLUSTER \
  --service-name donna-telnyx-webhook \
  --task-definition donna-telnyx-webhook \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Alternative: Deploy to EC2

```bash
# Launch EC2 instance with PHP 8.1
# Install dependencies
sudo apt-get update
sudo apt-get install -y apache2 php8.1 php8.1-cli php8.1-curl php8.1-mysql composer

# Clone and deploy code
git clone YOUR_REPO
cd YOUR_REPO
composer install --no-dev --optimize-autoloader

# Configure Apache
sudo cp -r * /var/www/html/
sudo chown -R www-data:www-data /var/www/html

# Configure webhook endpoint
# Point Apache to /var/www/html/api/telnyx/webhook.php
```

---

## Testing

### Test Webhook Locally

#### For Lambda (PHP):

```bash
# Install Bref CLI
composer require bref/bref

# Run locally
php -S localhost:8000 -t .
# Or use Bref local development
vendor/bin/bref local
```

#### For Lambda (Node.js):

```bash
# Install serverless-offline
npm install --save-dev serverless-offline

# Add to serverless.yml plugins
plugins:
  - serverless-offline

# Run locally
serverless offline
```

#### For EC2/ECS:

```bash
# Build and run Docker container
docker build -t donna-telnyx-webhook .
docker run -p 8080:80 \
  -e TELNYX_WEBHOOK_SECRET=test_secret \
  -e TELNYX_API_KEY=test_key \
  donna-telnyx-webhook

# Test webhook
curl -X POST http://localhost:8080/api/telnyx/webhook \
  -H "Content-Type: application/json" \
  -H "Telnyx-Signature-Ed25519: test_signature" \
  -d '{"data":{"event_type":"call.initiated","payload":{"from":"+1234567890","to":"+0987654321"}}}'
```

### Test with Telnyx Webhook Simulator

1. Go to Telnyx Dashboard → Webhooks
2. Use webhook testing tool or send test events
3. Verify events are received and processed

### Verify Event Storage

```bash
# Check DynamoDB
aws dynamodb scan --table-name YOUR_TABLE_NAME

# Check CloudWatch Logs
aws logs tail /aws/lambda/donna-telnyx-webhook-dev-webhook --follow

# Check Supabase
# Query call_history table in Supabase dashboard
```

---

## Monitoring

### CloudWatch Metrics

Key metrics to monitor:

- **Invocation count**: Number of webhook calls
- **Error rate**: Failed webhook processing
- **Duration**: Processing time
- **Throttles**: Lambda throttling events

### CloudWatch Alarms

Create alarms for:

- Error rate > 5%
- Duration > 10 seconds
- Throttles > 0
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name telnyx-webhook-errors \
  --alarm-description "Alert on webhook errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```


### Logging

All webhook events are logged to CloudWatch Logs. Search for:

- `Call event:` - Call-related events
- `Message event:` - Messaging events
- `Webhook error:` - Error conditions

---

## Security Considerations

### Webhook Signature Verification

**CRITICAL**: Always verify webhook signatures in production.

Implement proper Ed25519 verification:

```php
// PHP implementation
function verifyWebhookSignature($payload, $signature, $secret) {
    if (empty($signature) || empty($secret)) {
        return false;
    }
    
    // Decode base64 signature
    $decodedSignature = base64_decode($signature);
    
    // Use sodium extension for Ed25519 verification
    if (!function_exists('sodium_crypto_sign_verify_detached')) {
        error_log('sodium extension not available');
        return false;
    }
    
    // Verify signature
    return sodium_crypto_sign_verify_detached(
        $decodedSignature,
        $payload,
        hex2bin($secret)
    );
}
```
```javascript
// Node.js implementation
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  if (!signature || !secret) return false;
  
  try {
    const decodedSignature = Buffer.from(signature, 'base64');
    const publicKey = Buffer.from(secret, 'hex');
    
    return crypto.verify(
      null,
      Buffer.from(payload),
      publicKey,
      decodedSignature
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
```

### Environment Variables

- Store secrets in AWS Secrets Manager or Parameter Store
- Never commit secrets to version control
- Rotate secrets regularly
```bash
# Store in Secrets Manager
aws secretsmanager create-secret \
  --name telnyx/webhook-secret \
  --secret-string "your_secret_here"

# Retrieve in Lambda
aws secretsmanager get-secret-value --secret-id telnyx/webhook-secret
```


### Network Security

- Use VPC for Lambda if accessing private resources
- Configure security groups appropriately
- Enable API Gateway request throttling
- Use WAF rules if needed

---

## Troubleshooting

### Common Issues

#### 1. Webhook Not Receiving Events

**Symptoms**: No events in CloudWatch Logs

**Solutions**:

- Verify webhook URL in Telnyx dashboard
- Check API Gateway logs
- Verify CORS configuration
- Check Lambda function permissions

#### 2. Signature Verification Failing

**Symptoms**: 401 errors in logs

**Solutions**:

- Verify `TELNYX_WEBHOOK_SECRET` environment variable
- Check signature header name (case-sensitive)
- Ensure raw body is used for verification
- Implement proper Ed25519 verification

#### 3. Timeout Errors

**Symptoms**: Lambda timeouts, 504 errors

**Solutions**:

- Increase Lambda timeout (max 15 minutes)
- Optimize database queries
- Use async processing for fanout
- Consider moving to ECS for longer processing

#### 4. DynamoDB Write Failures

**Symptoms**: Events not stored in DynamoDB

**Solutions**:

- Verify IAM permissions for DynamoDB
- Check table name and region
- Verify table exists
- Check item size limits (400KB)

#### 5. Supabase Connection Issues

**Symptoms**: Supabase storage failing

**Solutions**:

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check network connectivity
- Verify table schema exists
- Check Supabase rate limits

### Debug Commands

```bash
# View Lambda logs
aws logs tail /aws/lambda/donna-telnyx-webhook-dev-webhook --follow

# Test Lambda function
aws lambda invoke \
  --function-name donna-telnyx-webhook-dev-webhook \
  --payload file://test-payload.json \
  response.json

# Check API Gateway logs
aws logs tail /aws/apigateway/donna-telnyx-webhook --follow

# View ECS task logs
aws logs tail /ecs/donna-telnyx-webhook --follow
```

---

## Next Steps

### 1. Implement Call Control

Add Lambda functions for:

- Initiating calls
- Answering calls
- Transferring calls
- Recording calls

### 2. Implement SMS Sending

Add Lambda function to send SMS via Telnyx API:

```php
function sendSMS($to, $message) {
    $ch = curl_init('https://api.telnyx.com/v2/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . getenv('TELNYX_API_KEY'),
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'from' => getenv('TELNYX_PHONE_NUMBER'),
            'to' => $to,
            'text' => $message
        ]),
        CURLOPT_RETURNTRANSFER => true
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}
```

### 3. Set Up DynamoDB Tables

Create tables for:

- `call_history` - Call events
- `message_history` - SMS events
- `call_sessions` - Active call sessions

### 4. Add Monitoring Dashboard

Create CloudWatch dashboard with:

- Webhook event counts
- Error rates
- Processing times
- Call/message statistics

### 5. Implement Auto-Response Logic

Add business logic to:

- Auto-respond to SMS messages
- Route calls based on time/availability
- Integrate with DONNA AI assistant

### 6. Set Up CI/CD

Automate deployments:

- GitHub Actions / GitLab CI
- Automated testing
- Blue-green deployments
- Rollback procedures

---

## Additional Resources

- [Telnyx API Documentation](https://developers.telnyx.com/)
- [AWS Lambda PHP with Bref](https://bref.sh/)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

---

## Summary

This guide provides three deployment options for Telnyx webhook handling on AWS:

1. **Lambda with PHP (Bref)** - Easiest migration, uses existing code
2. **Lambda with Node.js** - Better Lambda integration, TypeScript support
3. **EC2/ECS with PHP** - Full control, no Lambda limitations

Choose based on your requirements:

- **Serverless**: Option 1 or 2
- **Existing PHP infrastructure**: Option 3
- **TypeScript/Node.js preference**: Option 2

All options support:

- Webhook signature verification
- Event storage (DynamoDB/Supabase/CloudWatch)
- Event fanout to other services
- Monitoring and logging

For production deployments, ensure:

- Proper signature verification
- Secrets management
- Error handling
- Monitoring and alerting
- Scalability planning
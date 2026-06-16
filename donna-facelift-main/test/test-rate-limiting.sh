#!/bin/bash

# Test Rate Limiting for PHP Endpoints
# This script tests that rate limiting is properly enforced

echo "================================"
echo "PHP API Rate Limiting Test"
echo "================================"
echo ""

# Test endpoint
ENDPOINT="http://localhost/donna/api/test-rate-limit.php"

# Test 1: Basic rate limiting
echo "Test 1: Basic Rate Limiting"
echo "----------------------------"
echo "Making 10 requests to test endpoint (limit is 5 for test endpoint)..."

for i in {1..10}; do
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$ENDPOINT?endpoint=test-marketing")
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
    
    if [ "$http_code" = "429" ]; then
        echo "Request $i: BLOCKED (429 - Rate Limited) ✓"
    else
        echo "Request $i: ALLOWED (HTTP $http_code)"
    fi
done

echo ""
echo "Test 2: Rate Limit Headers"
echo "---------------------------"
echo "Checking for proper headers..."

response=$(curl -s -i "$ENDPOINT?endpoint=test-marketing" | head -20)
echo "$response" | grep -E "X-RateLimit-|Retry-After"

echo ""
echo "Test 3: Window Reset"
echo "---------------------"
echo "Status before waiting:"
curl -s "$ENDPOINT?action=status&endpoint=test-marketing" | python3 -m json.tool 2>/dev/null || jq . 2>/dev/null

echo ""
echo "Waiting 61 seconds for window to reset..."
sleep 61

echo "Status after reset:"
curl -s "$ENDPOINT?action=status&endpoint=test-marketing" | python3 -m json.tool 2>/dev/null || jq . 2>/dev/null

echo ""
echo "Test 4: Production Endpoint"
echo "----------------------------"
echo "Testing actual marketing endpoint..."

for i in {1..3}; do
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "http://localhost/donna/api/marketing.php?action=inbox&limit=1")
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
    echo "Request $i: HTTP $http_code"
done

echo ""
echo "================================"
echo "Rate Limiting Tests Complete"
echo "================================"
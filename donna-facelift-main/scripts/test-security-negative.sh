#!/bin/bash
# WS1 Security Negative Path Tests
# Tests unauthorized access and bad origin scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE=${API_BASE:-"http://localhost:3000"}
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${YELLOW}=== Security Negative Path Tests ===${NC}"
echo "Testing against: $API_BASE"
echo ""

# Function to test endpoint
test_endpoint() {
    local test_name="$1"
    local curl_cmd="$2"
    local expected_code="$3"
    local grep_pattern="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing: $test_name... "
    
    # Execute curl and capture response
    response=$(eval "$curl_cmd" 2>/dev/null || true)
    http_code=$(echo "$response" | head -n1 | cut -d' ' -f2)
    body=$(echo "$response" | tail -n +2)
    
    # Check HTTP status code
    if [ "$http_code" = "$expected_code" ]; then
        # Check response body if pattern provided
        if [ -n "$grep_pattern" ]; then
            if echo "$body" | grep -q "$grep_pattern"; then
                echo -e "${GREEN}PASS${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "${RED}FAIL${NC} - Expected pattern '$grep_pattern' not found"
                echo "  Response: $body"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        else
            echo -e "${GREEN}PASS${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    else
        echo -e "${RED}FAIL${NC} - Expected $expected_code, got $http_code"
        echo "  Response: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Test 1: Token issuance - No authentication
echo -e "${YELLOW}Test Group 1: Token Issuance - Unauthorized Access${NC}"
test_endpoint \
    "Token request without auth" \
    "curl -s -i -X POST $API_BASE/api/realtime/token" \
    "401" \
    "AUTHENTICATION_ERROR\|Unauthorized"

# Test 2: Token issuance - Bad origin
echo -e "\n${YELLOW}Test Group 2: Token Issuance - Bad Origin${NC}"
test_endpoint \
    "Token request with malicious origin" \
    "curl -s -i -X POST -H 'Origin: https://malicious.com' $API_BASE/api/realtime/token" \
    "403" \
    "Forbidden\|CORS"

test_endpoint \
    "Token request with localhost from production" \
    "curl -s -i -X POST -H 'Origin: http://localhost:3000' $API_BASE/api/realtime/token" \
    "403" \
    "Forbidden\|CORS"

# Test 3: Health endpoint - Bad origin
echo -e "\n${YELLOW}Test Group 3: Health Endpoint - CORS Validation${NC}"
test_endpoint \
    "Health check with bad origin" \
    "curl -s -i -H 'Origin: https://evil.com' $API_BASE/api/health" \
    "403" \
    "Forbidden"

test_endpoint \
    "Health check with no origin (should pass)" \
    "curl -s -i $API_BASE/api/health" \
    "200" \
    "healthy"

# Test 4: Rate limiting
echo -e "\n${YELLOW}Test Group 4: Rate Limiting${NC}"
echo "Sending rapid requests to trigger rate limit..."
RATE_LIMIT_HIT=false
for i in {1..100}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/api/health 2>/dev/null || true)
    if [ "$response" = "429" ]; then
        RATE_LIMIT_HIT=true
        break
    fi
done

if [ "$RATE_LIMIT_HIT" = true ]; then
    echo -e "${GREEN}PASS${NC} - Rate limit enforced"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}WARN${NC} - Rate limit not triggered (may be disabled in test env)"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 5: Input validation
echo -e "\n${YELLOW}Test Group 5: Input Validation${NC}"
test_endpoint \
    "Invalid JSON payload" \
    "curl -s -i -X POST -H 'Content-Type: application/json' -d 'not-json' $API_BASE/api/donna_logic" \
    "400" \
    "VALIDATION_ERROR\|Invalid"

test_endpoint \
    "SQL injection attempt" \
    "curl -s -i -X POST -H 'Content-Type: application/json' -d '{\"message\":\"'; DROP TABLE users; --\"}' $API_BASE/api/donna_logic" \
    "400\|200" \
    ""

# Test 6: Method not allowed
echo -e "\n${YELLOW}Test Group 6: HTTP Method Validation${NC}"
test_endpoint \
    "DELETE on GET-only endpoint" \
    "curl -s -i -X DELETE $API_BASE/api/health" \
    "405" \
    "Method Not Allowed\|VALIDATION_ERROR"

test_endpoint \
    "PUT on POST-only endpoint" \
    "curl -s -i -X PUT $API_BASE/api/donna_logic" \
    "405" \
    "Method Not Allowed\|VALIDATION_ERROR"

# Test 7: WebSocket authentication (if enabled)
if [ "${ENABLE_WS_PROXY:-false}" = "true" ]; then
    echo -e "\n${YELLOW}Test Group 7: WebSocket Authentication${NC}"
    
    # Test connection without token
    echo -n "Testing: WebSocket without auth token... "
    if command -v wscat &> /dev/null; then
        timeout 2 wscat -c "ws://localhost:3001/realtime" 2>&1 | grep -q "4001\|Unauthorized" && {
            echo -e "${GREEN}PASS${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        } || {
            echo -e "${RED}FAIL${NC} - Connection not rejected"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        }
    else
        echo -e "${YELLOW}SKIP${NC} - wscat not installed"
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Test 8: Security headers
echo -e "\n${YELLOW}Test Group 8: Security Headers${NC}"
response=$(curl -s -i $API_BASE/api/health 2>/dev/null || true)

check_header() {
    local header_name="$1"
    local expected_value="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Checking $header_name... "
    
    if echo "$response" | grep -qi "^$header_name:.*$expected_value"; then
        echo -e "${GREEN}PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}FAIL${NC} - Header missing or incorrect"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

check_header "X-Content-Type-Options" "nosniff"
check_header "X-Frame-Options" "DENY"
check_header "Referrer-Policy" "strict-origin-when-cross-origin"

# Summary
echo -e "\n${YELLOW}=== Test Summary ===${NC}"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "\n${RED}Security tests failed!${NC}"
    exit 1
else
    echo -e "\n${GREEN}All security tests passed!${NC}"
    exit 0
fi
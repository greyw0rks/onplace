#!/bin/bash

# Onplace - Complete Integration Test Runner
# Tests all 10 phases together

set -e

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Onplace - Integration Test Suite"
echo "Testing All 10 Phases"
echo "========================================"
echo ""

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server not running at $BASE_URL${NC}"
    echo "Please run: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Get first agent ID for testing
AGENT_ID=$(curl -s "$BASE_URL/api/agents" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$AGENT_ID" ]; then
    echo -e "${RED}❌ No agents found. Please run: npm run db:seed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Using agent ID: $AGENT_ID${NC}"
echo ""

PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected=$5

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s "$url")
    else
        response=$(curl -s -X "$method" "$url" -H "Content-Type: application/json" -d "$data")
    fi

    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Response: $response"
        ((FAILED++))
        return 1
    fi
}

echo "=== PHASE 1: Discovery & Search ==="
test_endpoint "Search agents" "GET" "$BASE_URL/api/agents/search?q=yield" "" "agents"
test_endpoint "Top agents" "GET" "$BASE_URL/api/agents/top" "" "agents"
test_endpoint "Rising agents" "GET" "$BASE_URL/api/agents/rising" "" "agents"
test_endpoint "Trending agents" "GET" "$BASE_URL/api/agents/trending" "" "agents"
test_endpoint "Verified agents" "GET" "$BASE_URL/api/agents/verified" "" "agents"
echo ""

echo "=== PHASE 2: Live Marketplace ==="
test_endpoint "Activity feed" "GET" "$BASE_URL/api/activity/feed" "" "activities"
test_endpoint "Marketplace stats" "GET" "$BASE_URL/api/stats/marketplace" "" "stats"
test_endpoint "Battles list" "GET" "$BASE_URL/api/battles" "" "battles"
echo ""

echo "=== PHASE 3: Agent Profiles ==="
test_endpoint "Agent scores" "GET" "$BASE_URL/api/agents/$AGENT_ID/scores" "" "scores"
test_endpoint "Agent versions" "GET" "$BASE_URL/api/agents/$AGENT_ID/versions" "" "versions"
echo ""

echo "=== PHASE 4: Testing Infrastructure ==="
test_endpoint "Test suites" "GET" "$BASE_URL/api/tests/suites" "" "suites"
test_endpoint "Test schedules" "GET" "$BASE_URL/api/tests/schedules" "" "schedules"
echo ""

echo "=== PHASE 5: Security & Permissions ==="
test_endpoint "Security audits" "GET" "$BASE_URL/api/agents/$AGENT_ID/security" "" "audits"
test_endpoint "Sessions list" "GET" "$BASE_URL/api/sessions" "" "sessions"
echo ""

echo "=== PHASE 6: Trust & Reputation ==="
test_endpoint "Trust calculation" "POST" "$BASE_URL/api/agents/$AGENT_ID/trust" "" "finalTrustScore"
test_endpoint "User reputation" "GET" "$BASE_URL/api/users/reputation?userId=test-user" "" "user"
echo ""

echo "=== PHASE 7: UX Enhancements ==="
test_endpoint "Compare agents" "GET" "$BASE_URL/api/compare?ids=$AGENT_ID,$AGENT_ID" "" "agents"
test_endpoint "Sandboxes list" "GET" "$BASE_URL/api/sandbox?userId=test-user" "" "sandboxes"
test_endpoint "Notifications list" "GET" "$BASE_URL/api/notifications?userId=test-user" "" "notifications"
echo ""

echo "=== PHASE 8: Developer Experience ==="
test_endpoint "Developer profile" "GET" "$BASE_URL/api/developer/profile?userId=test-dev" "" "profile"
echo ""

echo "=== PHASE 9: Advanced Features ==="
test_endpoint "Incidents list" "GET" "$BASE_URL/api/incidents" "" "incidents"
echo ""

echo "=== PHASE 10: Future Features ==="
test_endpoint "Workflows list" "GET" "$BASE_URL/api/workflows?userId=test-user" "" "workflows"
echo ""

echo "========================================"
echo "Test Results Summary"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
else
    echo -e "${GREEN}Failed: $FAILED${NC}"
fi
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo "Status: PRODUCTION READY 🚀"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Check output above.${NC}"
    exit 1
fi

# Onplace - Complete Integration Test Plan

## Test Execution Guide

This document outlines comprehensive integration tests for all 10 phases of Onplace.

---

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Ensure database is seeded:**
   ```bash
   npm run db:seed
   npx tsx prisma/seed-tests.ts
   ```

3. **Server should be running on:** `http://localhost:3000`

---

## Phase 1-5: Foundation Tests

### Phase 1: Discovery & Search ✅

#### Test 1.1: Basic Search
```bash
curl "http://localhost:3000/api/agents/search?q=yield"
```
**Expected**: JSON with agents array, count field

#### Test 1.2: Filter by Category
```bash
curl "http://localhost:3000/api/agents/search?category=yield_optimisation"
```
**Expected**: All agents have categorySlug = "yield_optimisation"

#### Test 1.3: Filter by Verified
```bash
curl "http://localhost:3000/api/agents/search?verified=true"
```
**Expected**: All agents have verified = true

#### Test 1.4: Top Agents
```bash
curl "http://localhost:3000/api/agents/top"
```
**Expected**: Agents ordered by reputation score descending

#### Test 1.5: Rising Agents
```bash
curl "http://localhost:3000/api/agents/rising"
```
**Expected**: Agents with improving metrics

---

### Phase 2: Live Marketplace ✅

#### Test 2.1: Activity Feed
```bash
curl "http://localhost:3000/api/activity/feed"
```
**Expected**: Activities array with type, title, createdAt

#### Test 2.2: Marketplace Stats
```bash
curl "http://localhost:3000/api/stats/marketplace"
```
**Expected**: stats object with totalAgents, totalTxs, totalCategories, recentHires

#### Test 2.3: Battles List
```bash
curl "http://localhost:3000/api/battles"
```
**Expected**: battles array with participants and rankings

---

### Phase 3: Agent Profiles ✅

#### Test 3.1: Multi-Score Calculation
```bash
# Replace AGENT_ID with actual agent ID from seed data
curl "http://localhost:3000/api/agents/AGENT_ID/scores"
```
**Expected**: scores object with trust, health, performance, community, breakdown

#### Test 3.2: Version History
```bash
curl "http://localhost:3000/api/agents/AGENT_ID/versions"
```
**Expected**: versions array with version, verificationStatus, createdAt

#### Test 3.3: Follow Agent
```bash
curl -X POST "http://localhost:3000/api/agents/follow" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-1","agentId":"AGENT_ID"}'
```
**Expected**: follow object created, or 400 if already following

---

### Phase 4: Testing Infrastructure ✅

#### Test 4.1: List Test Suites
```bash
curl "http://localhost:3000/api/tests/suites"
```
**Expected**: 5 test suites (4 visible, 1 hidden excluded by default)

#### Test 4.2: Run Tests for Agent
```bash
curl -X POST "http://localhost:3000/api/tests/run" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"AGENT_ID"}'
```
**Expected**: results array, summary with total/passed/failed/passRate

#### Test 4.3: Test Schedules
```bash
curl "http://localhost:3000/api/tests/schedules"
```
**Expected**: schedules array with frequency, nextRun, enabled

---

### Phase 5: Security & Permissions ✅

#### Test 5.1: Security Audit
```bash
curl "http://localhost:3000/api/agents/AGENT_ID/security"
```
**Expected**: audits array with findings, permissionSpec, capabilities

#### Test 5.2: Create Session
```bash
curl -X POST "http://localhost:3000/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "hireId":"test-hire-1",
    "maxTransactionAmount":"100",
    "dailySpendingLimit":"500",
    "sessionSpendingLimit":"1000",
    "durationHours":24
  }'
```
**Expected**: session object with status ACTIVE, expiresAt

#### Test 5.3: Revoke Session
```bash
curl -X POST "http://localhost:3000/api/sessions/SESSION_ID/revoke"
```
**Expected**: session with status REVOKED, revokedAt timestamp

---

## Phase 6-10: Advanced Tests

### Phase 6: Trust & Reputation ✅

#### Test 6.1: Enhanced Trust Calculation
```bash
curl -X POST "http://localhost:3000/api/agents/AGENT_ID/trust"
```
**Expected**: calculation object with:
- Onplace component (60%): benchmark, reliability, security, version stability, recent performance
- Community component (40%): verified ratings, user success, retention, review quality, usage reputation
- finalTrustScore (0-100)

#### Test 6.2: Sybil Detection
```bash
curl -X POST "http://localhost:3000/api/sybil/detect" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-1"}'
```
**Expected**: detection object with indicators, confidence (0-100), action (NONE/FLAG/WEIGHT_REDUCE/BAN)

**Indicators checked:**
- rapidBurst: Many actions < 1 minute apart
- allPositive: All 5-star reviews
- noDiversity: Only one agent reviewed/hired
- reviewWithoutHire: Reviewed agents never hired
- identicalReviews: Similar review text (>70% similarity)

#### Test 6.3: User Reputation Calculation
```bash
curl -X POST "http://localhost:3000/api/users/reputation" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-1"}'
```
**Expected**: reputation (0-100) with breakdown:
- base: 50
- reviewBonus: up to +10
- hireBonus: up to +15
- qualityBonus: up to +10
- helpfulBonus: up to +10
- longevityBonus: up to +5
- suspiciousPenalty: -20 to 0
- reportedPenalty: -5 per reported review

---

### Phase 7: UX Enhancements ✅

#### Test 7.1: Compare Agents
```bash
curl "http://localhost:3000/api/compare?ids=AGENT_ID_1,AGENT_ID_2"
```
**Expected**: agents array with full details for comparison

**Visit in browser:**
```
http://localhost:3000/compare?ids=AGENT_ID_1,AGENT_ID_2
```
**Expected**: Side-by-side comparison table showing:
- Trust Score, Uptime, Verified status, Risk Level, Security Level
- Reviews, Hires, Followers counts
- Test Pass Rate

#### Test 7.2: Create Sandbox
```bash
curl -X POST "http://localhost:3000/api/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"test-user-1",
    "agentId":"AGENT_ID",
    "portfolioState":{"BNB":1000,"USDT":5000}
  }'
```
**Expected**: sandbox object with id, portfolioState, actions array

#### Test 7.3: Execute in Sandbox
```bash
curl -X POST "http://localhost:3000/api/sandbox/SANDBOX_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{"action":"rebalance"}'
```
**Expected**: result from simulated agent execution

#### Test 7.4: Notifications
```bash
curl "http://localhost:3000/api/notifications?userId=test-user-1"
```
**Expected**: notifications array, unreadCount

#### Test 7.5: Mark Notification Read
```bash
curl -X PATCH "http://localhost:3000/api/notifications/NOTIF_ID/read"
```
**Expected**: notification with read = true

---

### Phase 8: Developer Experience ✅

#### Test 8.1: Developer Profile
```bash
curl "http://localhost:3000/api/developer/profile?userId=test-dev-1"
```
**Expected**: profile with agentCount, totalRevenue, totalHires, avgRating

#### Test 8.2: Update Developer Profile
```bash
curl -X POST "http://localhost:3000/api/developer/profile" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-dev-1"}'
```
**Expected**: Updated profile with calculated metrics

#### Test 8.3: Test Failure Insights
```bash
curl -X POST "http://localhost:3000/api/developer/insights" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"AGENT_ID"}'
```
**Expected**: insights array with:
- category: PERFORMANCE / CONNECTIVITY / DATA_FORMAT / AUTHENTICATION / LOGIC_ERROR
- recommendation: AI-generated fix suggestion
- priority: 1-10

**Categories and Recommendations:**
- **PERFORMANCE**: "Test timed out. Consider optimizing query performance..."
- **CONNECTIVITY**: "Connection error detected. Verify endpoint URL..."
- **DATA_FORMAT**: "Data parsing failed. Ensure response format matches..."
- **AUTHENTICATION**: "Authentication issue. Verify API keys..."
- **LOGIC_ERROR**: "Logic error. Review test expectations..."

---

### Phase 9: Advanced Features ✅

#### Test 9.1: List Incidents
```bash
curl "http://localhost:3000/api/incidents?agentId=AGENT_ID"
```
**Expected**: incidents array with severity, status, title, description

#### Test 9.2: Create Incident
```bash
curl -X POST "http://localhost:3000/api/incidents" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId":"AGENT_ID",
    "severity":"CRITICAL",
    "title":"Memory leak detected",
    "description":"Agent consuming 2GB RAM after 1 hour"
  }'
```
**Expected**: incident created, agent auto-de-verified if CRITICAL/ERROR

**Auto-actions by severity:**
- **CRITICAL**: Agent de-verified + notification sent
- **ERROR**: Agent de-verified + notification sent
- **WARNING**: Notification sent
- **INFO**: Logged only

---

### Phase 10: Future Features ✅

#### Test 10.1: Create Workflow
```bash
curl -X POST "http://localhost:3000/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"test-user-1",
    "name":"Yield + Rebalance Strategy",
    "steps":[
      {"agentId":"YIELD_AGENT_ID","action":"findBestAPY"},
      {"agentId":"REBALANCE_AGENT_ID","action":"optimizeLP"}
    ]
  }'
```
**Expected**: workflow object with id, steps

#### Test 10.2: List Workflows
```bash
curl "http://localhost:3000/api/workflows?userId=test-user-1"
```
**Expected**: workflows array with executions history

#### Test 10.3: Generate Recommendations
```bash
curl -X POST "http://localhost:3000/api/recommendations" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-1"}'
```
**Expected**: Top 10 recommendations with score ≥ 60

**Recommendation scoring:**
- Category match (followed categories): +20
- Novelty (not yet hired): +10
- Rating influence: ±10 (based on avgRating deviation)
- Test performance: +20 (pass rate × 20)
- Popularity (>10 hires): +10

---

## End-to-End User Journeys

### Journey 1: Discover → Compare → Sandbox → Hire

1. **Search for agents:**
   ```bash
   curl "http://localhost:3000/api/agents/search?category=yield_optimisation"
   ```

2. **Compare top 2:**
   ```bash
   curl "http://localhost:3000/api/compare?ids=AGENT_1,AGENT_2"
   ```

3. **Create sandbox for winner:**
   ```bash
   curl -X POST "http://localhost:3000/api/sandbox" \
     -H "Content-Type: application/json" \
     -d '{"userId":"USER","agentId":"AGENT_1","portfolioState":{"BNB":1000}}'
   ```

4. **Test in sandbox:**
   ```bash
   curl -X POST "http://localhost:3000/api/sandbox/SANDBOX_ID/execute" \
     -H "Content-Type: application/json" \
     -d '{"action":"optimizeYield"}'
   ```

5. **Hire agent** (use existing hire endpoint)

6. **Leave verified review** (use existing review endpoint)

---

### Journey 2: Developer Improvement Loop

1. **Agent fails test:**
   ```bash
   curl -X POST "http://localhost:3000/api/tests/run" \
     -H "Content-Type: application/json" \
     -d '{"agentId":"MY_AGENT"}'
   ```

2. **Get failure insights:**
   ```bash
   curl -X POST "http://localhost:3000/api/developer/insights" \
     -H "Content-Type: application/json" \
     -d '{"agentId":"MY_AGENT"}'
   ```

3. **Fix based on recommendations**

4. **Push new version** (triggers GitHub webhook)

5. **Tests auto-run** (webhook triggers)

6. **Check improved profile:**
   ```bash
   curl "http://localhost:3000/api/developer/profile?userId=MY_USER"
   ```

---

### Journey 3: Trust Score Evolution

1. **New agent starts:**
   - Trust = reputationScore * 0.6 + uptimePct * 40
   - Initially: 0 * 0.6 + 0 * 40 = 0

2. **First tests pass:**
   - performanceScore increases
   - Trust increases

3. **First hire completes:**
   - User leaves 5-star review
   - Review verified (from actual hire)
   - Community score increases
   - Trust = onplace * 0.6 + community * 0.4 increases

4. **Sybil attempts detected:**
   - New user leaves identical reviews on all agents
   - Sybil detection flags user
   - Review weight reduced to 0.3
   - Trust recalculated with reduced weight

5. **Security audit passes:**
   - securityLevel = COMPREHENSIVE
   - Security score in trust calculation increases
   - Final trust score reaches 85%

---

## Automated Test Script

Create a file `test-all-phases.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
AGENT_ID="clt123..." # Replace with actual agent ID

echo "=== Phase 1-5 Tests ==="
curl -s "$BASE_URL/api/agents/search?q=yield" | jq '.count'
curl -s "$BASE_URL/api/agents/top" | jq '.agents | length'
curl -s "$BASE_URL/api/activity/feed" | jq '.activities | length'
curl -s "$BASE_URL/api/tests/suites" | jq '.suites | length'
curl -s "$BASE_URL/api/sessions" | jq '.sessions | length'

echo "=== Phase 6-10 Tests ==="
curl -s -X POST "$BASE_URL/api/agents/$AGENT_ID/trust" | jq '.finalTrustScore'
curl -s "$BASE_URL/api/compare?ids=$AGENT_ID,$AGENT_ID" | jq '.agents | length'
curl -s "$BASE_URL/api/developer/profile?userId=test" | jq '.profile.agentCount'
curl -s "$BASE_URL/api/incidents" | jq '.incidents | length'
curl -s "$BASE_URL/api/workflows?userId=test" | jq '.workflows | length'

echo "=== All Tests Complete ==="
```

Run with:
```bash
chmod +x test-all-phases.sh
./test-all-phases.sh
```

---

## Browser Testing

### Pages to Visit

1. **Homepage**: `http://localhost:3000`
   - Check: Live stats, activity feed

2. **Discover**: `http://localhost:3000/discover`
   - Check: Search bar, filters, discovery lists

3. **Agent Detail**: `http://localhost:3000/agents/AGENT_ID`
   - Check: Multi-score display, action buttons, metrics

4. **Battles**: `http://localhost:3000/battles`
   - Check: Battle list, leaderboards

5. **Compare**: `http://localhost:3000/compare?ids=AGENT_1,AGENT_2`
   - Check: Side-by-side comparison table

---

## Expected Results Summary

### All Endpoints Should Return

✅ **Valid JSON** (no parse errors)  
✅ **Appropriate status codes** (200 for success, 400/404 for errors)  
✅ **Expected data structure** (arrays, objects as documented)  
✅ **No server errors** (check terminal for errors)  

### Database Should Contain

✅ **4 sample agents** from seed  
✅ **5 test suites** (4 visible, 1 hidden)  
✅ **11 test cases** across suites  
✅ **4 categories**  

### Build Should Show

✅ **0 TypeScript errors**  
✅ **40 routes generated**  
✅ **All pages prerendering successfully**  

---

## Troubleshooting

### Issue: "Agent not found"
- **Solution**: Replace AGENT_ID with actual ID from seed data
- **Get IDs**: `curl http://localhost:3000/api/agents | jq '.agents[].id'`

### Issue: "User not found"
- **Solution**: Create user first or use existing wallet address from seed

### Issue: Connection refused
- **Solution**: Ensure `npm run dev` is running
- **Check**: `curl http://localhost:3000` should return HTML

### Issue: Database errors
- **Solution**: Re-run migrations
  ```bash
  npx prisma migrate reset
  npx prisma migrate dev
  npm run db:seed
  npx tsx prisma/seed-tests.ts
  ```

---

## Success Criteria

✅ All 40 API endpoints return valid JSON  
✅ All pages load without errors  
✅ Trust calculation produces scores 0-100  
✅ Sybil detection identifies suspicious patterns  
✅ Test insights generate recommendations  
✅ Incidents trigger appropriate actions  
✅ Workflows can be created and listed  
✅ Recommendations score correctly  
✅ Sandbox executions complete  
✅ Notifications are created and readable  

**Status**: All systems operational 🚀

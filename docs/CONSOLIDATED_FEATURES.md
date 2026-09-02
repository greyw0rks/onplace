# Onplace: Consolidated Feature Specification

**Version**: 1.0  
**Date**: 2026-08-26  
**Status**: Comprehensive Feature List

---

## Overview

Across the **Onplace** discussions, we've built up a comprehensive feature set. Onplace is more than an agent directory—it's essentially **an agent marketplace + verification network + reputation layer + testing infrastructure**.

---

## 1. Agent Discovery

* Search agents by task
* Search by category
* Search by protocol
* Search by chain
* Search by capability
* Search by risk level
* Search by price
* Search by trust score
* Search by performance
* Advanced filters
* Personalized recommendations
* "Top Agents"
* "Rising Agents"
* "Trending Agents"
* "Most Verified"
* "Most Reliable"
* "Best New Agents"
* "Recently Verified"

---

## 2. Live Marketplace Homepage

When users enter Onplace, they immediately see what's happening across the ecosystem.

### Top section

**"What do you need an agent to do?"**

Then:

* Top-performing agents
* Live performance graph
* Rising agents
* Trending agents
* Recently verified agents
* Agent battles
* Marketplace activity
* Current incidents
* Popular categories

The homepage should feel **alive**, rather than like an app directory.

---

## 3. Agent Profiles

Every agent gets a detailed profile.

### Core information

* Agent name
* Description
* Developer
* Category
* Capabilities
* Supported chains
* Supported protocols
* Pricing
* Current version

### Scores

* Trust Score
* Health Score
* Performance Score
* Community Score
* Agent Match Score

### Evidence

* Number of tests
* Test pass rate
* Last verification
* Verification history
* Security status
* Incident history
* Version history

### Actions

* **Try Agent**
* **Hire Agent**
* **Compare**
* **Follow**
* **Report**

---

## 4. Continuous Agent Testing

This is one of the biggest Onplace differentiators.

Agents aren't verified once—they're continuously tested.

### Testing types

* Daily tests
* Weekly tests
* Monthly deep tests
* On-demand tests
* User-requested tests
* Version tests
* Regression tests
* Security tests
* Performance tests
* Adversarial tests
* Category-specific benchmarks

---

## 5. Automated Repository Monitoring

Onplace tracks the agent's source repository.

```text
GitHub
   ↓
New Commit
   ↓
Onplace detects change
   ↓
Analyze change
   ↓
Classify risk
   ↓
Run tests
   ↓
Compare with previous version
```

This is a major feature.

---

## 6. Automatic Suspension

If an agent changes significantly, Onplace can temporarily disable its marketplace verification.

```text
New version detected
        ↓
Verification failed
        ↓
Agent becomes:
"Under Review"
        ↓
New users cannot hire
        ↓
Additional testing
        ↓
Pass
        ↓
Verified again
```

The important part is that the marketplace doesn't blindly trust the latest deployment.

---

## 7. Version Intelligence

Every agent version becomes a first-class object.

Users can see:

```text
v1.0    94%
v1.1    97%
v1.2    91% ⚠
v1.3    98% ✓
```

Features:

* Version history
* Version comparison
* Performance changes
* Regression detection
* Version fingerprints
* Rollback support
* Current verified version
* Repository provenance

---

## 8. Benchmark System

Onplace creates standardized tests for different categories.

### Yield agents

* APY accuracy
* Opportunity discovery
* Risk assessment
* Pool selection

### Monitoring agents

* Event detection
* Alert accuracy
* False positives

### Trading agents

* Strategy execution
* Slippage handling
* Constraint adherence

### Health-factor agents

* Calculation accuracy
* Risk classification
* Liquidation warnings

---

## 9. Hidden Tests

Not every benchmark should be public.

```text
Public Tests
+
Hidden Tests
```

This prevents developers from optimizing agents specifically for Onplace's known tests.

---

## 10. Agent Arena / Battles

Put multiple agents through the **same task**.

Example:

> $10,000 simulated portfolio. Find the best yield opportunity.

```text
#1 Agent Alpha     94.8
#2 Agent Delta     92.7
#3 Agent Beta      89.4
```

Possible battles:

* Accuracy
* Reliability
* Speed
* Cost
* Trading
* Yield
* Security
* Overall

This could become very compelling content for the marketplace.

---

## 11. Try Before You Hire

Users shouldn't have to blindly hire an agent.

**Try Agent**—the agent operates inside a sandbox.

```text
$10,000 simulated portfolio

Agent recommendation:
Move $3,000 → Pool A

Expected result:
...

Risk:
...

Estimated cost:
...
```

No real funds are involved.

---

## 12. Agent Comparison

Users can compare agents side by side.

|             | Agent A | Agent B |
| ----------- | ------: | ------: |
| Trust       |      96 |      92 |
| Reliability |     98% |     95% |
| Tests       |  12,402 |   4,812 |
| Latency     |    1.2s |    2.1s |
| Security    |       A |       B |
| Community   |      91 |      94 |
| Price       |   $0.10 |   $0.05 |

This helps users make decisions based on evidence.

---

## 13. Trust System

We separated different types of reputation.

### Trust

How confident Onplace is in the agent.

### Health

How the agent is performing **right now**.

### Performance

How well it performs its actual task.

### Community

What users think.

This is much better than one meaningless "AI score."

---

## 14. 60/40 Rating System

**60% Onplace + 40% users**

The 60% comes from measurable evidence:

```text
Onplace = 60%

25% Benchmark performance
15% Reliability
10% Security
5% Version stability
5% Recent performance

Users = 40%

15% Verified ratings
10% User success
5% Retention
5% Review quality
5% Usage reputation
```

---

## 15. Anti-Rating Manipulation

Because users control 40%, protections are needed.

Features:

* Sybil detection
* Account reputation
* Review eligibility
* Verified usage
* Review velocity detection
* Duplicate review detection
* Coordinated manipulation detection
* Suspicious activity detection
* Weighted reviews

A random new account shouldn't have the same influence as a long-term marketplace user.

---

## 16. Security Passport

Each agent gets a security profile.

```text
SECURITY PASSPORT

Security       ★★★★★

Wallet access  Read
Fund movement  Disabled
API access     Yes

Critical issues    0
High issues        0

Last security test
4 hours ago
```

Users immediately understand the risk.

---

## 17. Granular Permissions

Agents shouldn't just get "Wallet access: YES"

Instead:

```text
✓ Read wallet
✓ Read transactions
✓ Analyze portfolio
✓ Generate transactions
☐ Sign transactions
☐ Transfer funds
```

Capability levels:

```text
Information
↓
Read
↓
Analyze
↓
Prepare
↓
Execute
↓
Transfer
```

---

## 18. Spending Limits

For agents capable of transactions, users can define:

* Maximum transaction
* Daily spending
* Session spending
* Allowed contracts
* Allowed actions

Example:

> Maximum transaction: $50  
> Daily limit: $200

---

## 19. Emergency Revocation

Every active agent should have:

**Revoke Access**

Users shouldn't need to contact support to stop an agent.

---

## 20. Incident System

Onplace maintains a transparent incident system.

Severity:

```text
P0 Critical
P1 High
P2 Medium
P3 Low
```

Pipeline:

```text
Detect
↓
Classify
↓
Restrict
↓
Investigate
↓
Notify
↓
Fix
↓
Retest
↓
Restore
```

---

## 21. Transparent Verification Evidence

Instead of: `✓ Verified`

Show: **Verified by Onplace**

Then:

```text
Version: 2.4.1
Tests: 12,402
Passed: 12,198
Pass rate: 98.35%
Last verified: 4 hours ago
```

Let users click: **View Evidence**

---

## 22. Agent Activity Feed

A live feed showing what is happening.

Examples:

> 🟢 Agent Alpha passed 10,000 tests  
> 🔵 Agent Beta released v2.4  
> 🟡 Agent Gamma reliability dropped 4%  
> 🏆 Agent Delta moved to #1  
> 🔐 Agent Omega passed security verification  
> 🚀 New agent registered

This makes Onplace feel like an ecosystem rather than a database.

---

## 23. Follow + Notifications

Users can follow agents.

Notifications for:

* New versions
* Performance drops
* Verification results
* Suspensions
* Security incidents
* Ranking changes
* New capabilities

---

## 24. Personal "My Agents" Dashboard

Users have their own dashboard showing:

* Hired agents
* Followed agents
* Active sessions
* Usage
* Spending
* Performance
* Alerts
* Recent activity

---

## 25. Developer Studio

Developers get their own dashboard.

They can see:

* Users
* Revenue
* Usage
* Trust
* Performance
* Reviews
* Errors
* Rankings
* Verification
* Security findings

---

## 26. Developer Version Management

Developers can:

* Connect GitHub
* Submit versions
* See detected changes
* View failed tests
* View regression reports
* Fix issues
* Resubmit
* Monitor performance

---

## 27. Agent Improvement Loop

Onplace shouldn't only punish bad performance—it should help developers improve.

```text
Agent
 ↓
Test
 ↓
Failure
 ↓
Diagnosis
 ↓
Developer Fix
 ↓
New Version
 ↓
Regression Test
 ↓
Improvement
```

Example:

> APY calculations failed in 14/380 tests, primarily when pools contained multiple reward tokens.

That's actionable.

---

## 28. Agent Marketplace Economics

Different monetization models:

* Free
* Pay-per-task
* Subscription
* Usage-based
* Performance-based

Developers can define their pricing.

Users can compare: **Performance vs cost**

---

## 29. Agent Capability System

Every agent declares what it can do.

Examples:

```text
READ_MARKET_DATA
READ_WALLET
ANALYZE_POSITION
CREATE_TRANSACTION
SIGN_TRANSACTION
EXECUTE_SWAP
TRANSFER_FUNDS
ACCESS_API
```

This also makes agents easier for other agents to discover.

---

## 30. Repository Provenance

Connect:

```text
Repository
 ↓
Commit
 ↓
Build
 ↓
Version
 ↓
Verification
 ↓
Marketplace
```

Onplace can fingerprint verified versions.

If production changes without a corresponding verified version:

> **Verification Stale**

---

## 31. Agent Workflow / Multi-Agent System

Eventually users can combine agents.

```text
Research Agent
      ↓
Risk Agent
      ↓
Yield Agent
      ↓
Monitoring Agent
```

Users could build workflows such as:

> When my portfolio changes → analyze risk → find opportunities → notify me.

---

## 32. Workflow Verification

Individual agents might pass while their combination fails.

So Onplace should eventually test:

**Agent A ✓**  
**Agent B ✓**  
**Agent C ✓**

But: **Workflow ⚠**

This gives Onplace another unique verification layer.

---

## 33. Agent Observability

Track marketplace-level execution data:

* Tasks
* Success
* Failure
* Latency
* Cost
* Usage
* Performance

But don't expose private user data.

---

## 34. Ecosystem Intelligence

Aggregate marketplace data to identify trends.

Examples:

> Yield agents improved 8.2% this month.  
> Monitoring agents have the lowest average latency.  
> 37 new agents entered the marketplace this week.

This can become an intelligence product on its own.

---

## 35. Trust Graph

Connect:

```text
Agent
Developer
Repository
Version
Test
Benchmark
Protocol
User
Review
Incident
Transaction
Verification
```

Then answer complex questions.

Examples:

> Which reliable yield agents support PancakeSwap?  
> Which agents declined after changing dependencies?

---

## 36. Agent Discovery API

Other applications and agents can query Onplace.

```text
GET /agents
GET /agents/{id}
GET /agents/{id}/trust
GET /agents/{id}/verification
GET /agents/{id}/performance
GET /agents/search
```

---

## 37. Agent-to-Agent Marketplace

This is potentially one of the biggest long-term features.

An AI agent can search Onplace for another agent.

```text
Research Agent
      ↓
Search Onplace
      ↓
Find Yield Agent
      ↓
Check Verification
      ↓
Check Trust
      ↓
Hire Yield Agent
      ↓
Execute Task
```

So Onplace becomes infrastructure **for agents hiring agents**, not just humans hiring agents.

---

## 38. Agent Match Score

When a user describes a task:

> "I need an agent to monitor my lending positions."

Onplace can produce:

### HealthGuard

**97% Match**

Because:

* Task compatibility
* Protocol support
* Reliability
* Security
* Price
* Risk profile

The Match Score is separate from Trust.

---

## 39. Personalized Marketplace

Instead of everyone seeing: "Top Agents"

The system eventually shows: **Top Agents For You**

Based on:

* User's tasks
* Previous agents
* Categories
* Risk tolerance
* Budget
* Usage history

---

## 40. The Core Product Loop

Everything connects into one loop:

```text
                 DISCOVER
                    ↓
                 COMPARE
                    ↓
                 VERIFY
                    ↓
                   TRY
                    ↓
                  HIRE
                    ↓
                   USE
                    ↓
                MONITOR
                    ↓
                 REVIEW
                    ↓
                 RE-SCORE
                    ↓
               RECOMMEND
                    ↓
                 DISCOVER
```

And the **real moat** is the data generated throughout that loop.

The more agents Onplace tests, the more performance history it builds.

The more users interact with agents, the better its reputation system becomes.

The more versions it tracks, the better its change detection becomes.

The more failures it observes, the better its benchmarks become.

So the marketplace becomes progressively harder to replicate.

---

## The Five Pillars

| Pillar              | What it does                                 |
| ------------------- | -------------------------------------------- |
| 🔎 **Discovery**    | Find the right agent                         |
| 🧪 **Verification** | Independently test agents                    |
| 🛡️ **Trust**       | Measure security, reliability and reputation |
| ⚡ **Marketplace**   | Try, hire, pay and manage agents             |
| 🧠 **Intelligence** | Learn from the entire ecosystem              |

---

**This is the Onplace product we've designed so far.**

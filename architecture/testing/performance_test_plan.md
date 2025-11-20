# Performance Test Plan
HPCL Procurement Automation System
Version: 1.0 | Last Updated: 2025-11-21
Owner: Performance Engineer

---
## 1. Goals
- Validate scalability to projected peak: 5K PRs/day, 500 concurrent users.
- Maintain p95 latency <800ms for critical APIs.
- Ensure workflow processing within SLA (approval path <5m end-to-end).
- Confirm system resiliency under stress (retry logic, queue stability).

## 2. Scope
Included:
- PR CRUD endpoints
- Approval submission endpoints
- PO creation (mock SAP success + failure)
- Attachment upload (10MB cap)
- Workflow worker throughput
Excluded: Long-term archival jobs

## 3. Test Types
| Type | Purpose |
|------|---------|
| Baseline | Establish normal throughput/latency |
| Load | 1x → 5x normal user concurrency |
| Stress | Push until degradation, record failure point |
| Spike | Sudden traffic surge (0 → peak in <10s) |
| Endurance | 4-hour sustained load for memory/GC leaks |

## 4. Environment
- STAGING cluster (close to production config)
- Isolated test window (no other deployments)

## 5. Tools
- k6 for HTTP load
- JMeter for mixed workflow scenarios
- Prometheus + Grafana for metrics

## 6. Metrics
| Metric | Target |
|--------|--------|
| p95 latency PR create | <800ms |
| p95 latency approval | <700ms |
| Error rate | <1% |
| Workflow completion (PR_APPROVAL) | <5m |
| CPU utilization (API pods) | <70% avg |
| Memory utilization (API pods) | <75% avg |
| GC pause (JVM) | <200ms p95 |

## 7. Scenarios
| ID | Scenario | Users | Duration |
|----|----------|-------|----------|
| PERF-001 | Baseline PR create | 50 VUs | 10m |
| PERF-002 | Load PR + approval mix | 200 VUs | 20m |
| PERF-003 | Spike 0→300 VUs | 300 VUs | 5m |
| PERF-004 | Stress incremental | +50 VUs / 5m until fail | variable |
| PERF-005 | Endurance mixed | 150 VUs | 4h |
| PERF-006 | Attachment upload | 50 VUs | 15m |
| PERF-007 | PO creation with SAP success/fail | 100 VUs | 20m |

## 8. k6 Example Script (PR Create)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '8m', target: 50 },
    { duration: '2m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01']
  }
};

const TOKEN = __ENV.JWT_TOKEN;

export default function () {
  const payload = JSON.stringify({
    description: `Load PR ${__ITER}`,
    estimated_budget: 10000,
    required_date: '2025-12-31',
    category: 'GENERAL'
  });

  const res = http.post(`${__ENV.BASE_URL}/api/v1/pr`, payload, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` }
  });
  check(res, {
    'status is 201': r => r.status === 201
  });
  sleep(1);
}
```

Run:
```bash
JWT_TOKEN=$TEST_TOKEN BASE_URL=https://api.staging k6 run perf/pr_create.js
```

## 9. Monitoring During Test
```bash
kubectl top pods -n hpcl-procurement
kubectl logs deployment/procurement-api -n hpcl-procurement | grep -E 'ERROR|WARN' | wc -l
curl -s https://api.staging/actuator/metrics/jvm.memory.used | jq '.measurement[0].value'
```

## 10. Degradation Criteria
Stop stress test if:
- Error rate >5% sustained 2m
- p95 latency >2s sustained 5m
- JVM OOM warnings appear

## 11. Data Reset
Post-test cleanup:
```bash
mysql -e "DELETE FROM purchase_requests WHERE description LIKE 'Load PR%';"
mysql -e "DELETE FROM audit_log WHERE resource_type='PR' AND resource_id IS NULL;"
```

## 12. Reporting
Include:
- Scenario summaries (latency percentiles, error rates)
- Resource charts (CPU/memory lines)
- Bottleneck analysis (threads, DB pool usage)
- Recommendations (scale targets, query optimizations)

## 13. Exit Criteria
- All baseline targets met
- Capacity margin (stress threshold ≥2x planned peak)
- No memory leak (stable RSS over endurance)
- Workflow SLA maintained under load

## 14. Approvals
- Performance Engineer
- Backend Lead
- Ops Lead

Version History: v1.0 Initial

# Incident Response Runbook
HPCL Procurement Automation System
Version: 1.0 | Last Updated: 2025-11-21
Owner: Operations Lead

---
## Format Per Incident
- Symptoms
- Root Cause Checklist
- Immediate Actions (First 15 minutes)
- Escalation Path
- Recovery Validation

---
## 1. SAP Integration Failures
**Symptoms**
- Increased SAP API 5xx responses
- DLQ messages piling (>50 in 10 min)
- PO creation workflow stuck at SAP task
- Alert: `sap_integration_error_rate > 5%`

**Root Cause Checklist**
- [ ] Network reachability (ping / curl to SAP endpoint)
- [ ] Expired credentials / API key
- [ ] Idempotency key collision
- [ ] CPI / BAPI interface down
- [ ] Payload schema change from SAP side

**Immediate Actions**
```bash
# Check logs
kubectl logs deployment/sap-adapter -n hpcl-procurement | grep ERROR | tail -n 50
# Test connectivity
curl -v https://sap-prod.hpcl.com/api/ping
# Inspect DLQ
kafka-console-consumer --bootstrap-server $KAFKA --topic sap.dlq --from-beginning --max-messages 5
```
- Retry stuck messages (if transient) via manual requeue script
- Pause new SAP calls if failure rate >50%

**Escalation Path**
- T+15m: SAP Basis Team
- T+30m: Integration Architect
- T+60m: Incident Manager (Severity P1 if sustained)

**Recovery Validation**
- DLQ growth stopped
- New PO creation succeeds
- Error rate <1%

---
## 2. GeM / CPPP Publish Failures
**Symptoms**
- Tender publication job failing
- Non-200 responses from GeM API
- Reconciliation job showing increasing delta
- Alert: `gem_publish_failures > 10 in 30m`

**Root Cause Checklist**
- [ ] OAuth token expired / invalid
- [ ] Rate limit exceeded
- [ ] API schema change
- [ ] Vendor mapping mismatch
- [ ] RPA fallback robot down

**Immediate Actions**
```bash
# Token status
curl -H "Authorization: Bearer $GEM_TOKEN" https://gem.api.example.com/status
# Error pattern
kubectl logs deployment/gem-adapter -n hpcl-procurement | grep PUBLISH_ERROR | tail -n 50
```
- Regenerate OAuth token
- Throttle publishes (drop to 25% volume) if rate limit suspected
- Switch to RPA fallback if API outage confirmed (>30 min)

**Escalation Path**
- T+15m: GeM Support Desk
- T+30m: Procurement Process Owner

**Recovery Validation**
- All queued publications processed
- Reconciliation delta <2% of daily volume

---
## 3. Workflow Engine Errors (Camunda/Zeebe)
**Symptoms**
- Stalled processes (no token movement >15m)
- Worker exceptions (task retries exhausted)
- Alert: `zeebe_job_failures > threshold`
- gRPC connectivity failures to gateway

**Root Cause Checklist**
- [ ] Gateway unreachable (port 26500 closed)
- [ ] Worker pod crash loop
- [ ] BPMN deployment missing/new version incompatible
- [ ] Message correlation key mismatch
- [ ] High load exhausting thread pool

**Immediate Actions**
```bash
kubectl get pods -l app=workflow-orchestrator -n hpcl-procurement
kubectl logs deployment/workflow-orchestrator -n hpcl-procurement | grep ERROR | tail -n 50
nc -zv zeebe-gateway.hpcl-procurement.svc.cluster.local 26500
```
- Restart failed workers
- Redeploy BPMN models if missing

**Escalation Path**
- T+30m: Workflow Specialist
- T+60m: Solution Architect

**Recovery Validation**
- Stalled instances progress
- Failed jobs retry success rate >90%

---
## 4. Database Outage
**Symptoms**
- 500 errors on API endpoints (DB connection timeout)
- Alert: `db_connection_failures > 20 in 5m`
- MySQL pod CrashLoopBackOff

**Root Cause Checklist**
- [ ] Pod terminated / PVC issue
- [ ] Out-of-disk space
- [ ] Connection pool exhaustion
- [ ] Deadlocks / high slow queries
- [ ] Misapplied migration

**Immediate Actions**
```bash
kubectl get pod -l app=mysql -n hpcl-procurement
kubectl logs statefulset/mysql -n hpcl-procurement | tail -n 50
kubectl exec -it mysql-0 -n hpcl-procurement -- mysql -e 'SHOW PROCESSLIST;' | head
```
- Scale API replicas down to reduce load (if pool exhaustion)
- If corruption suspected: switch to last snapshot (see backup_restore.md)

**Escalation Path**
- T+15m: DBA Team (P1 if complete outage)
- T+30m: Infra Lead

**Recovery Validation**
- Connections stable
- Latency within baseline
- Error rate <1%

---
## 5. API Latency / High Error Rate
**Symptoms**
- p95 latency > SLA (800ms) for 10 min
- Error rate spike (>5%)
- Alert: `http_server_errors_total` surge

**Root Cause Checklist**
- [ ] Recent deployment regression
- [ ] GC thrashing / memory pressure
- [ ] Downstream dependency slow (SAP, DB)
- [ ] Thread pool saturation
- [ ] Hot code path inefficiency

**Immediate Actions**
```bash
kubectl top pods -n hpcl-procurement | grep procurement-api
kubectl logs deployment/procurement-api -n hpcl-procurement | grep ERROR | tail -n 50
curl -f https://api.hpcl-procurement.example.com/actuator/metrics/http.server.requests | jq '.data'
```
- Enable canary rollback (see deploy_runbook.md)
- Increase replicas temporarily (HPA override)

**Escalation Path**
- T+15m: Backend Lead
- T+45m: Performance Engineer

**Recovery Validation**
- p95 latency <800ms
- Error rate baseline restored

---
## 6. Rule Engine Malfunction
**Symptoms**
- PR approvals bypassing thresholds
- Excessive rule evaluation failures
- Alert: `rule_evaluation_error_rate > 5%`

**Root Cause Checklist**
- [ ] Corrupted rule config
- [ ] New rules missing validation
- [ ] DB read failure for rule set
- [ ] Serialization error (JSON parsing)

**Immediate Actions**
```bash
kubectl logs deployment/procurement-api -n hpcl-procurement | grep RULE_EVAL | tail -n 50
mysql -e 'SELECT COUNT(*) FROM business_rules;' # via exec pod
```
- Disable problematic rule (flag in DB)
- Revert to last known good rule export

**Escalation Path**
- T+20m: Business Analyst
- T+40m: Solution Architect

**Recovery Validation**
- Evaluations succeed (>98%)
- Approval SLA adherence restored

---
## 7. DSC Signing Issues
**Symptoms**
- PO / Approval documents stuck unsigned
- eMudhra API timeout / invalid signature errors
- Alert: `esign_failures > threshold`

**Root Cause Checklist**
- [ ] Certificate expired / revoked
- [ ] API key invalidated
- [ ] Payload hash mismatch
- [ ] Network TLS handshake failure

**Immediate Actions**
```bash
kubectl logs deployment/dms-adapter -n hpcl-procurement | grep SIGN_ERROR | tail -n 50
curl -v https://api.emudhra.example.com/ping
```
- Retry signature with regenerated hash
- Fallback: queue for manual signing (if >2h outage)

**Escalation Path**
- T+15m: Security Officer
- T+30m: Vendor Support (eMudhra)

**Recovery Validation**
- New documents signed successfully
- Signature verification passes

---
## 8. Security Incident
**Symptoms**
- Unauthorized access attempts (403 spikes)
- Multiple failed logins (brute force >50 attempts)
- Unexpected admin role assignment
- Alert: `security_incident_flag == true`

**Root Cause Checklist**
- [ ] Credential compromise
- [ ] Privilege escalation
- [ ] API key leakage
- [ ] Injection / exploit attempt

**Immediate Actions**
```bash
# Fetch audit events
mysql -e "SELECT * FROM audit_log WHERE timestamp > NOW() - INTERVAL 15 MINUTE" | head
# Check role changes
mysql -e "SELECT * FROM user_roles WHERE updated_at > NOW() - INTERVAL 15 MINUTE" | head
```
- Revoke compromised tokens (Keycloak admin)
- Lock affected accounts
- Increase logging verbosity
- Snapshot evidence (logs, audit DB dump)

**Escalation Path**
- Immediate: CISO (P1)
- T+15m: Security Operations Team
- T+30m: Legal & Compliance (if data exposure)

**Recovery Validation**
- No further unauthorized actions
- Accounts secured / rotated
- Post-incident report drafted

---
## Severity Classification
| Severity | Definition | Target Response |
|----------|------------|-----------------|
| P1 | Full outage / data breach | Acknowledge <5 min |
| P2 | Degraded core function | Acknowledge <15 min |
| P3 | Minor functionality issue | Acknowledge <60 min |
| P4 | Cosmetic / advisory | Planned within sprint |

---
## Communication Template (P1)
```
Subject: [P1] Incident - <Short Description>
Start: <UTC Time>
Impact: <Systems / Users>
Current Status: <Investigating / Mitigating / Resolved>
Next Update: <Time>
Actions Taken: <Bullets>
Owner: <Name>
```

---
Version History: v1.0 Initial
Reviewers: Ops Lead, Security Officer, Integration Architect

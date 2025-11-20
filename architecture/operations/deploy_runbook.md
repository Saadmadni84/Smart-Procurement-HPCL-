# Deploy Runbook
HPCL Procurement Automation System
Version: 1.0 | Last Updated: 2025-11-21
Owner: Release Manager

---
## 1. Pre-Deployment Checklist
- [ ] Change ticket approved (CAB ID recorded)
- [ ] All pipelines green (build, test, security scan)
- [ ] Vulnerabilities: No Critical / High unapproved
- [ ] Flyway migrations reviewed & peer approved
- [ ] Backup completed (DB + documents) within last 12h
- [ ] Rollback artifacts available (previous image tag)
- [ ] Secrets rotated if >90 days old
- [ ] Capacity OK (cluster <70% CPU / <70% memory)
- [ ] Incident queue clear (no P1 open)
- [ ] DNS / TLS cert valid (>30 days to expiry)

---
## 2. Backend Deployment (Spring Boot + Flyway)

### Build & Package
```bash
# From repo root
cd backend
mvn clean package -DskipTests
```

### Build & Push Image
```bash
export IMAGE_TAG=$(git rev-parse --short HEAD)
docker build -t harbor.hpcl.com/procurement/procurement-api:$IMAGE_TAG .
docker push harbor.hpcl.com/procurement/procurement-api:$IMAGE_TAG
```

### Database Migration (Dry Run)
```bash
flyway -url=$JDBC_URL -user=$DB_USER -password=$DB_PASS -locations=filesystem:./src/main/resources/db/migration info
flyway -url=$JDBC_URL -user=$DB_USER -password=$DB_PASS -locations=filesystem:./src/main/resources/db/migration migrate
```
(Abort if validation errors shown)

---
## 3. Frontend Build & Deploy (React/Vite)
```bash
cd frontend
npm ci
npm run build
# Build image
docker build -t harbor.hpcl.com/procurement/procurement-frontend:$IMAGE_TAG .
docker push harbor.hpcl.com/procurement/procurement-frontend:$IMAGE_TAG
```

---
## 4. Kubernetes Deployment

### Apply Manifests (Standard)
```bash
kubectl apply -f architecture/infra/k8s/deployment-manifests.yaml
```

### Helm (If using chart)
```bash
helm upgrade --install procurement-api charts/procurement-api \
  --namespace hpcl-procurement \
  --set image.tag=$IMAGE_TAG
helm upgrade --install procurement-frontend charts/procurement-frontend \
  --namespace hpcl-procurement \
  --set image.tag=$IMAGE_TAG
```

### Image Update (Rolling)
```bash
kubectl set image deployment/procurement-api procurement-api=harbor.hpcl.com/procurement/procurement-api:$IMAGE_TAG -n hpcl-procurement
kubectl set image deployment/procurement-frontend nginx=harbor.hpcl.com/procurement/procurement-frontend:$IMAGE_TAG -n hpcl-procurement
```

---
## 5. Secrets Handling (KMS / Vault)

### Vault Dynamic DB Credentials
```bash
vault read database/creds/procurement-api
# Export to deployment env
export DB_USERNAME=...; export DB_PASSWORD=...
```

### Rotate JWT Key (If scheduled)
```bash
vault kv get secret/jwt/private | grep key > new_key.pem
# Update K8s secret
kubectl create secret generic jwt-key --from-file=key=new_key.pem -n hpcl-procurement --dry-run=client -o yaml | kubectl apply -f -
# Trigger rollout
kubectl rollout restart deployment/procurement-api -n hpcl-procurement
```

---
## 6. Canary Deployment Steps

1. Tag canary image: `harbor.hpcl.com/procurement/procurement-api:$IMAGE_TAG-canary`
2. Create canary deployment (10% traffic):
```bash
kubectl scale deployment procurement-api --replicas=2 -n hpcl-procurement
kubectl create deployment procurement-api-canary --image=harbor.hpcl.com/procurement/procurement-api:$IMAGE_TAG -n hpcl-procurement
kubectl scale deployment procurement-api-canary --replicas=1 -n hpcl-procurement
```
3. Update Ingress / Service weight (example with NGINX annotations or service mesh route)
4. Monitor 15 minutes:
   - Error rate <1%
   - p95 latency <800ms
   - No new exceptions in logs
5. Proceed to full rollout (replace original deployment image)

---
## 7. Rollback Procedure

### Criteria
- Error rate >5% sustained 5 min
- p95 latency >1500ms sustained 5 min
- New critical exceptions (SAP, DB, workflow)

### Steps
```bash
# Identify previous stable tag
export PREV_TAG=<previous_good_sha>
# Revert image
kubectl set image deployment/procurement-api procurement-api=harbor.hpcl.com/procurement/procurement-api:$PREV_TAG -n hpcl-procurement
kubectl set image deployment/procurement-frontend nginx=harbor.hpcl.com/procurement/procurement-frontend:$PREV_TAG -n hpcl-procurement
# If migrations caused issue: restore DB snapshot (see backup_restore.md)
```

### Post-Rollback
- Confirm health endpoints OK
- Notify stakeholders (email + Teams)
- Create incident ticket (Severity P2)

---
## 8. Post-Deployment Validation

### Pods & Rollout
```bash
kubectl get pods -n hpcl-procurement
kubectl rollout status deployment/procurement-api -n hpcl-procurement --timeout=5m
```

### Health & Actuator
```bash
curl -f https://api.hpcl-procurement.example.com/actuator/health
curl -f https://api.hpcl-procurement.example.com/actuator/info
```

### API Smoke
```bash
curl -f -H "Authorization: Bearer $TEST_TOKEN" -H "Content-Type: application/json" \
  -d '{"description":"Smoke PR","estimated_budget":1000,"required_date":"2025-12-31","category":"GENERAL"}' \
  https://api.hpcl-procurement.example.com/api/v1/pr
```

### Logs & Metrics
```bash
kubectl logs deployment/procurement-api -n hpcl-procurement | tail -n 50
kubectl top pods -n hpcl-procurement
```

### Database Connectivity
```bash
kubectl exec -it $(kubectl get pod -n hpcl-procurement -l app=procurement-api -o jsonpath='{.items[0].metadata.name}') -n hpcl-procurement -- \
  bash -c 'wget -qO- localhost:8081/actuator/health'
```

### Workflow Engine
```bash
# Check Zeebe gateway
nc -zv zeebe-gateway.hpcl-procurement.svc.cluster.local 26500
```

---
## 9. Acceptance
- All health checks green
- Error rate baseline unchanged
- p95 latency within SLA
- New PR creation + approval path works
- Audit log entries created
- Workflows start & complete

---
## 10. Communication
- Deployment start notice (T-10m)
- Deployment completion summary
- Rollback notification (if executed)

---
Version History: v1.0 Initial
Reviewers: Release Manager, Dev Lead, Ops Lead

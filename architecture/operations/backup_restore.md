# Backup & Restore Runbook
HPCL Procurement Automation System
Version: 1.0 | Last Updated: 2025-11-21
Owner: DBA Lead

---
## 1. Scope
Components covered:
- MySQL Database
- Document Storage (S3 / MinIO)
- Workflow State (Zeebe)
- Search Index (Elasticsearch)
- Disaster Recovery (DR) Procedures

Retention: 7 years (audit + procurement docs)

---
## 2. MySQL Backup

### Daily Full Backup
```bash
export TS=$(date +%Y%m%d_%H%M)
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS \
  --single-transaction --routines --triggers --events --set-gtid-purged=OFF \
  hpcl_procurement | gzip > mysql_full_$TS.sql.gz
aws s3 cp mysql_full_$TS.sql.gz s3://hpcl-procurement-backups/db/daily/
```

### Hourly Incremental (Binary Logs)
```bash
mysql -e 'FLUSH LOGS;'
# Copy latest binlog
LATEST=$(mysql -e 'SHOW BINARY LOGS;' | tail -n 1 | awk '{print $1}')
aws s3 cp /var/lib/mysql/$LATEST s3://hpcl-procurement-backups/db/binlogs/
```

### Verification
```bash
gunzip -c mysql_full_$TS.sql.gz | head -n 50
```

---
## 3. MySQL Restore

### Point-in-Time Recovery
1. Provision new MySQL instance (same version)
2. Restore latest full:
```bash
zcat mysql_full_<DATE>.sql.gz | mysql -u $DB_USER -p$DB_PASS hpcl_procurement
```
3. Apply binlogs sequentially:
```bash
mysqlbinlog binlog.000123 | mysql -u $DB_USER -p$DB_PASS hpcl_procurement
```
4. Validate row counts vs pre-incident snapshot

### Integrity Checks
```bash
mysql -e 'CHECK TABLE purchase_requests;' | grep OK
```

---
## 4. Document Storage Backup (S3 / MinIO)

### Daily Sync
```bash
aws s3 sync s3://hpcl-procurement-documents s3://hpcl-procurement-backups/documents/daily/ \
  --storage-class GLACIER --exclude "temp/*"
```

### Versioning & Object Lock
- Bucket versioning: ENABLED
- Object Lock: Compliance mode (retain 7y)
- Tamper detection: Compare SHA-256 checksum field stored in DB vs object metadata

### Restore
```bash
aws s3 cp s3://hpcl-procurement-backups/documents/daily/<path> s3://hpcl-procurement-documents/<path>
```

---
## 5. Workflow State Backup (Zeebe)

### Export State (Snapshots)
- Use Zeebe broker snapshot directory (e.g., `/usr/local/zeebe/data/snapshots`) daily
```bash
rsync -av /usr/local/zeebe/data/snapshots/ /backup/zeebe/$TS/
aws s3 sync /backup/zeebe/$TS s3://hpcl-procurement-backups/workflow/snapshots/$TS
```

### Restore Procedure
1. Stop brokers
2. Clear data directories (retain backups)
3. Copy snapshot to each node's data path
4. Start brokers, confirm partition health

### Validation
- Start a test process instance
- Query existing instances count matches pre-backup metrics

---
## 6. Elasticsearch Snapshot Process

### Repository Registration
```bash
PUT _snapshot/hpcl_backup_repo
{
  "type": "s3",
  "settings": {
    "bucket": "hpcl-procurement-backups-es",
    "region": "ap-south-1"
  }
}
```

### Daily Snapshot
```bash
PUT _snapshot/hpcl_backup_repo/daily-$(date +%Y%m%d)?wait_for_completion=true
```

### Restore
```bash
POST _snapshot/hpcl_backup_repo/daily-<DATE>/_restore
{
  "indices": "audit-log-index,pr-index",
  "include_global_state": false
}
```

### Validation
```bash
GET pr-index/_count
GET audit-log-index/_count
```

---
## 7. Disaster Recovery Plan

| Component | RPO | RTO | Strategy |
|-----------|-----|-----|----------|
| MySQL     | 15m | 2h  | Full + binlog replay |
| Documents | 24h | 4h  | Daily S3 sync + versioning |
| Workflow  | 1h  | 3h  | Daily snapshots |
| Elasticsearch | 1h | 2h | Daily snapshots |
| Kafka     | 15m | 3h  | Multi-AZ + topic replication |

### DR Site Activation Steps
1. Declare DR (CIO approval)
2. Provision infra (Terraform DR workspace)
3. Restore MySQL snapshot + binlogs
4. Restore document bucket (critical subset first)
5. Apply workflow snapshots
6. Restore Elasticsearch snapshots
7. Update DNS (failover to DR LB)
8. Run smoke tests
9. Notify stakeholders

---
## 8. Quarterly DR Test Procedure

### Preparation
- Select maintenance window
- Freeze non-essential deployments

### Execution
1. Simulate primary region loss (disable routing)
2. Perform full DR activation steps (Section 7)
3. Execute validation script:
```bash
curl -f https://dr-api.hpcl-procurement.example.com/actuator/health
curl -f -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"description":"DR Test PR","estimated_budget":5000,"required_date":"2025-12-31","category":"GENERAL"}' \
  https://dr-api.hpcl-procurement.example.com/api/v1/pr
```
4. Approve PR through workflow
5. Generate PO (SAP sandbox endpoint)
6. Verify audit logs present

### Validation Criteria
- All critical APIs operational < RTO target
- Data discrepancy < RPO tolerance (no missing PRs in last 15m)
- Workflow instances resume correctly
- Search index responds with expected counts

### Post-Test
- Collect metrics (actual RTO/RPO vs targets)
- Document gaps & remediation actions
- Update DR runbook if required

---
## 9. Monitoring & Alerts (Backup Health)
- Alert if last full DB backup >24h
- Alert if binlog gap >30m
- Alert if document sync fails
- Alert if snapshot creation fails (Elasticsearch)

---
## 10. Acceptance Criteria
- Automated daily full DB backup success 30-day streak
- Binlog retention covers last 7 days
- Document bucket versioning + lock enforced
- Successful quarterly DR test with metrics recorded
- No unresolved backup verification failures

---
Version History: v1.0 Initial
Reviewers: DBA Lead, Ops Lead, Security Officer

# System Architecture - HPCL Procurement Automation

## Overview

This document describes the comprehensive system architecture for the HPCL Procurement Automation System, including component interactions, network topology, security boundaries, and integration patterns.

---

## 1. High-Level Architecture

### Architecture Principles

1. **Microservices-Based**: Independently deployable services with clear boundaries
2. **Event-Driven**: Async communication via Kafka for loose coupling
3. **API-First**: OpenAPI contracts for all services
4. **Cloud-Native**: Containerized, orchestrated by Kubernetes
5. **Security by Design**: Defense in depth, zero-trust network
6. **Observability**: Built-in metrics, logs, traces
7. **Resilience**: Circuit breakers, retries, graceful degradation

---

## 2. System Context Diagram

```plantuml
@startuml system_context
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title System Context - HPCL Procurement Automation

Person(user, "Procurement User", "Requestor, Approver, Admin")
Person(vendor, "Vendor", "Supplier, Bidder")
Person(auditor, "Auditor", "CVC, Internal Audit")

System(procurement, "HPCL Procurement System", "Automates PR to PO lifecycle with ML-based evaluation")

System_Ext(sap, "SAP ERP", "Master data, PO creation, GRN, Invoice")
System_Ext(gem, "GeM Portal", "Government e-Marketplace for tenders")
System_Ext(cppp, "CPPP Portal", "Central Public Procurement Portal")
System_Ext(dms, "Document Management", "Sharepoint/Alfresco for docs")
System_Ext(dsc, "DSC Provider", "eMudhra/Sify for digital signatures")
System_Ext(email, "Email/SMS Gateway", "Notifications")
System_Ext(ldap, "Active Directory", "SSO authentication")

Rel(user, procurement, "Uses", "HTTPS")
Rel(vendor, procurement, "Submits bids", "HTTPS")
Rel(auditor, procurement, "Reviews audit logs", "HTTPS (Read-only)")

Rel(procurement, sap, "Syncs PRs, creates POs", "HTTPS/RFC")
Rel(procurement, gem, "Publishes tenders", "API/RPA")
Rel(procurement, cppp, "Publishes tenders", "API/RPA")
Rel(procurement, dms, "Stores documents", "WebDAV/REST")
Rel(procurement, dsc, "Signs documents", "PKCS#11/REST")
Rel(procurement, email, "Sends notifications", "SMTP/REST")
Rel(procurement, ldap, "Authenticates users", "LDAP/SAML")

@enduml
```

---

## 3. Container Diagram (Microservices)

```plantuml
@startuml container_diagram
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_TOP_DOWN()

title Container Diagram - HPCL Procurement System

Person(user, "User", "Browser/Mobile")

System_Boundary(procurement, "HPCL Procurement System") {
    Container(web, "Web Application", "React + Vite", "SPA for procurement workflows")
    Container(api_gw, "API Gateway", "Kong", "Rate limiting, JWT validation, routing")
    Container(auth, "Auth Service", "Keycloak", "SSO (SAML/OIDC), JWT issuer, 2FA")
    
    Container(pr_api, "Procurement API", "Spring Boot", "PR/PO CRUD, approvals, rules")
    Container(workflow, "Workflow Orchestrator", "Camunda Zeebe", "BPMN process execution")
    Container(rule_engine, "Rule Engine", "Drools", "Business rule evaluation")
    Container(doc_intel, "Document Intelligence", "Python/FastAPI", "OCR, NLP, data extraction")
    Container(ml_scoring, "ML Scoring Service", "Python/FastAPI", "Vendor scoring, price prediction")
    Container(sap_adapter, "SAP Adapter", "Spring Boot", "SAP CPI/BAPI integration")
    Container(integration_adapter, "Integration Adapter", "Spring Boot", "GeM, CPPP, DMS, eSign")
    
    ContainerDb(db, "Database", "MySQL 8.0", "Transactional data")
    ContainerDb(search, "Search Engine", "Elasticsearch", "Full-text search, analytics")
    ContainerDb(datalake, "Data Lake", "S3/HDFS", "Raw data, ML training sets")
    
    Container(kafka, "Message Bus", "Kafka", "Event streaming, audit log")
    
    Container(prometheus, "Metrics", "Prometheus", "Time-series metrics")
    Container(grafana, "Dashboards", "Grafana", "Monitoring dashboards")
    Container(elk, "Logging", "ELK Stack", "Centralized logs")
    Container(jaeger, "Tracing", "Jaeger", "Distributed tracing")
}

System_Ext(sap, "SAP ERP")
System_Ext(gem, "GeM")
System_Ext(dms, "DMS")
System_Ext(dsc, "DSC Provider")

Rel(user, web, "Uses", "HTTPS")
Rel(web, api_gw, "API calls", "HTTPS/REST")
Rel(api_gw, auth, "Validates JWT", "gRPC")
Rel(api_gw, pr_api, "Routes requests", "HTTP/REST")

Rel(pr_api, workflow, "Triggers process", "gRPC")
Rel(pr_api, rule_engine, "Evaluates rules", "HTTP/REST")
Rel(pr_api, db, "Reads/Writes", "JDBC")
Rel(pr_api, kafka, "Publishes events", "Kafka Protocol")

Rel(workflow, kafka, "Emits process events", "Kafka Protocol")
Rel(workflow, pr_api, "Calls back", "HTTP/REST")

Rel(doc_intel, db, "Stores extracted data", "JDBC")
Rel(doc_intel, datalake, "Stores raw files", "S3 API")

Rel(ml_scoring, db, "Reads historical data", "JDBC")
Rel(ml_scoring, datalake, "Reads training data", "S3 API")

Rel(sap_adapter, sap, "Creates POs", "RFC/OData")
Rel(integration_adapter, gem, "Publishes tenders", "REST/RPA")
Rel(integration_adapter, dms, "Uploads docs", "WebDAV")
Rel(integration_adapter, dsc, "Signs docs", "PKCS#11")

Rel(kafka, search, "Streams events", "Kafka Connect")
Rel(pr_api, search, "Indexes data", "HTTP/REST")

Rel(pr_api, prometheus, "Exports metrics", "HTTP")
Rel(workflow, prometheus, "Exports metrics", "HTTP")
Rel(sap_adapter, prometheus, "Exports metrics", "HTTP")

Rel(prometheus, grafana, "Data source", "HTTP")
Rel(pr_api, elk, "Ships logs", "Filebeat")
Rel(pr_api, jaeger, "Sends traces", "UDP/HTTP")

@enduml
```

---

## 4. Network Topology & Security Zones

```plantuml
@startuml network_topology
!define AWSPuml https://raw.githubusercontent.com/awslabs/aws-icons-for-plantuml/v14.0/dist
!include AWSPuml/AWSCommon.puml
!include AWSPuml/NetworkingContentDelivery/VPC.puml
!include AWSPuml/Compute/EKS.puml
!include AWSPuml/Database/RDS.puml
!include AWSPuml/Storage/S3.puml

title Network Topology - HPCL Procurement System

package "Internet" {
    actor User
    cloud "CDN" as cdn
}

package "DMZ (Public Subnet)" {
    component "Load Balancer" as lb
    component "WAF" as waf
}

package "Application Tier (Private Subnet)" {
    component "K8s Cluster" as k8s {
        component "Ingress Controller" as ingress
        component "Frontend Pods" as frontend
        component "API Gateway Pods" as api_gw
        component "Backend Service Pods" as backend
        component "Workflow Engine Pods" as workflow
    }
}

package "Data Tier (Private Subnet)" {
    database "MySQL (RDS)" as mysql
    database "Elasticsearch" as es
    storage "S3 (DMS)" as s3
    queue "Kafka Cluster" as kafka
}

package "Management Tier (Private Subnet)" {
    component "Prometheus" as prom
    component "Grafana" as grafana
    component "ELK Stack" as elk
    component "Bastion Host" as bastion
}

package "External Systems" {
    cloud "SAP ERP" as sap
    cloud "GeM Portal" as gem
    cloud "DSC Provider" as dsc
}

User --> cdn : HTTPS
cdn --> waf : HTTPS
waf --> lb : HTTPS
lb --> ingress : HTTPS
ingress --> frontend : HTTP
ingress --> api_gw : HTTP
api_gw --> backend : HTTP
backend --> workflow : gRPC
backend --> mysql : JDBC (TLS)
backend --> kafka : Kafka (TLS)
backend --> es : HTTPS
backend --> s3 : HTTPS
backend --> sap : HTTPS/RFC
backend --> gem : HTTPS
backend --> dsc : HTTPS

backend --> prom : Metrics
backend --> elk : Logs
bastion --> k8s : kubectl (SSH tunnel)

note right of waf
  • DDoS protection
  • SQL injection filtering
  • Rate limiting
end note

note right of ingress
  • TLS termination
  • mTLS to backend
  • JWT validation
end note

note right of mysql
  • Encrypted at rest (AES-256)
  • TLS in transit
  • Private subnet (no public IP)
  • Automated backups
end note

note right of kafka
  • Event log (audit trail)
  • TLS + SASL authentication
  • Retention: infinite for audit.log
end note

@enduml
```

---

## 5. Component Descriptions

### 5.1 Frontend Layer

#### Web Application (React + Vite)
- **Purpose**: User interface for procurement workflows
- **Technology**: React 18, Vite 5, TypeScript
- **Features**:
  - PR creation and tracking
  - Approval workflows with digital signature
  - Rule management dashboard
  - Analytics and reporting
  - Exception handling
- **Deployment**: Static files served via NGINX/CDN
- **Security**: CSP headers, XSS protection, HTTPS only

---

### 5.2 API Gateway (Kong)

- **Purpose**: Single entry point for all backend APIs
- **Features**:
  - **Authentication**: JWT validation (RS256 signature)
  - **Authorization**: Scope-based access control
  - **Rate Limiting**: 1000 req/min per user, 10K req/min global
  - **Logging**: Access logs to ELK
  - **Caching**: Response caching for read-heavy endpoints
  - **Circuit Breaker**: Fail-fast for unhealthy backends
- **Plugins**:
  - `jwt`, `rate-limiting`, `cors`, `request-transformer`, `prometheus`

---

### 5.3 Auth Service (Keycloak)

- **Purpose**: Centralized authentication and authorization
- **Features**:
  - **SSO**: SAML 2.0 integration with Active Directory
  - **OIDC**: JWT token issuance for APIs
  - **2FA**: TOTP for admin actions (PO approval, rule changes)
  - **RBAC**: Fine-grained roles (Requestor, Approver, Admin, Auditor)
  - **Session Management**: Configurable timeout, concurrent sessions
- **Deployment**: Clustered (3 replicas) with PostgreSQL backend

---

### 5.4 Procurement API (Spring Boot)

- **Purpose**: Core business logic for PR/PO lifecycle
- **Endpoints**:
  - `/api/pr` - PR CRUD operations
  - `/api/approvals` - Approval inbox and actions
  - `/api/rules` - Rule management
  - `/api/exceptions` - Exception handling
  - `/api/reports` - Analytics and dashboards
- **Integrations**:
  - **Database**: MySQL (JPA/Hibernate)
  - **Workflow**: Camunda Zeebe (gRPC client)
  - **Rule Engine**: Drools (embedded)
  - **Events**: Kafka producer
  - **Search**: Elasticsearch client
- **Architecture**:
  - Layered (Controller → Service → Repository)
  - DTO pattern for API contracts
  - Exception handling with global `@ControllerAdvice`
  - Auditing with Spring Data JPA `@EntityListeners`

---

### 5.5 Workflow Orchestrator (Camunda Zeebe)

- **Purpose**: BPMN process execution for approval workflows
- **Processes**:
  - **PR Approval Flow**: Submit → Rule Check → Multi-level Approval → SAP Sync
  - **PO Issuance Flow**: Vendor Selection → PO Draft → eSign → SAP PO Creation
  - **Exception Handling Flow**: Exception Raised → Assign → Resolve → Close
- **Features**:
  - **Human Tasks**: Tasklist integration for manual approvals
  - **Service Tasks**: HTTP/gRPC calls to backend services
  - **Timers**: SLA tracking, escalations
  - **Error Handling**: Boundary events, compensation
- **Deployment**: 3-broker cluster (quorum), 1 gateway, 1 Operate instance

---

### 5.6 Rule Engine (Drools)

- **Purpose**: Business rule evaluation for procurement policies
- **Rules**:
  - Approval hierarchy (value thresholds)
  - Vendor eligibility checks
  - Category-specific validations
  - Compliance checks (CVC guidelines)
- **Rule Format**: Drools DRL (Domain-Specific Language)
- **Deployment**: Embedded in Procurement API, hot-reload from DB

**Example Rule:**
```drl
rule "CFO Approval Required"
when
    $pr : PurchaseRequest(estimatedValue > 1000000)
then
    $pr.addApprover("CFO");
    $pr.setPriority("HIGH");
end
```

---

### 5.7 Document Intelligence (Python/FastAPI)

- **Purpose**: OCR and NLP for document processing
- **Features**:
  - **OCR**: Extract text from scanned invoices, quotations
  - **NLP**: Named entity recognition (vendor, amount, dates)
  - **Classification**: Document type detection
  - **Validation**: Cross-check extracted data with PR
- **Technology**: Tesseract OCR, spaCy NLP, PyTorch models
- **API**: RESTful endpoints (`/ocr`, `/extract`, `/classify`)
- **Storage**: Raw files in S3, extracted data in MySQL

---

### 5.8 ML Scoring Service (Python/FastAPI)

- **Purpose**: ML-based vendor scoring and price prediction
- **Models**:
  - **Vendor Scoring**: Logistic regression on historical performance
  - **Price Prediction**: LSTM for time-series forecasting
  - **Anomaly Detection**: Isolation Forest for unusual bids
- **Training**: Scheduled batch jobs (weekly), data from MySQL
- **Inference**: Real-time API (`/score-vendor`, `/predict-price`)
- **Monitoring**: Model drift detection, A/B testing

---

### 5.9 SAP Adapter (Spring Boot)

- **Purpose**: Integration with SAP ERP for PO lifecycle
- **Integration Patterns**:
  - **Preferred**: SAP CPI (Cloud Platform Integration) with OData APIs
  - **Fallback**: Direct BAPI calls via SAP JCo connector
- **Operations**:
  - **Create PO**: BAPI_PO_CREATE (PR → SAP PO)
  - **Get PO Status**: BAPI_PO_GETDETAIL
  - **Create GRN**: BAPI_GOODSMVT_CREATE
  - **Post Invoice**: BAPI_INCOMINGINVOICE_CREATE
- **Idempotency**: Use `PR_ID + TIMESTAMP` as external reference
- **Error Handling**: Retry with exponential backoff, DLQ for failures
- **Monitoring**: Metrics for success/failure rates, latency

---

### 5.10 Integration Adapter (Spring Boot)

- **Purpose**: Integration with GeM, CPPP, DMS, eSign
- **GeM Integration**:
  - **API**: REST endpoints for tender publishing (if available)
  - **RPA Fallback**: UiPath bot for portal automation
  - **Reconciliation**: Daily batch to sync bid statuses
- **CPPP Integration**: Similar to GeM (API + RPA)
- **DMS Integration**:
  - **Storage**: WebDAV/S3 for document upload
  - **Versioning**: Maintain document versions with checksums
- **eSign Integration**:
  - **Provider**: eMudhra/Sify DSC
  - **Flow**: Document → Hash → Sign with DSC → Store signature
  - **Verification**: Public key verification on retrieval

---

### 5.11 Data Layer

#### MySQL (RDS)
- **Purpose**: Primary transactional database
- **Schema**: Normalized (3NF) with audit tables
- **Configuration**:
  - **Instance**: db.r5.xlarge (4 vCPU, 32 GB RAM)
  - **Storage**: 500 GB SSD (gp3), auto-scaling to 2 TB
  - **Replicas**: 1 read replica for analytics
  - **Backups**: Daily automated, 7-day retention
  - **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Performance**: Connection pooling (HikariCP, max 50 connections)

#### Elasticsearch
- **Purpose**: Full-text search, log aggregation, analytics
- **Indices**:
  - `pr-index`: PR documents with full-text search
  - `audit-log-*`: Daily audit logs (time-series)
  - `vendor-index`: Vendor master data
- **Configuration**: 3-node cluster (1 master, 2 data)
- **Retention**: Audit logs retained for 7 years (compliance)

#### S3 (Data Lake)
- **Purpose**: Raw document storage, ML training data
- **Buckets**:
  - `hpcl-procurement-docs`: Scanned documents, attachments
  - `hpcl-procurement-ml`: Training datasets, model artifacts
- **Lifecycle**: Transition to Glacier after 1 year
- **Encryption**: SSE-S3 (server-side encryption)

---

### 5.12 Messaging Layer (Kafka)

- **Purpose**: Event streaming, audit log, async processing
- **Topics**:
  - `pr.created`, `pr.approved`, `pr.rejected`
  - `po.issued`, `po.ack.received`
  - `rule.evaluated`, `exception.raised`
  - `audit.log` (infinite retention, immutable)
- **Configuration**:
  - **Brokers**: 3 (quorum for high availability)
  - **Replication Factor**: 3
  - **Partitions**: 10 per topic (load distribution)
  - **Retention**: 30 days (except audit.log: infinite)
- **Security**: TLS + SASL_SSL (PLAIN or SCRAM-SHA-512)

---

### 5.13 Observability Stack

#### Prometheus (Metrics)
- **Purpose**: Time-series metrics collection
- **Metrics**:
  - **Application**: HTTP request rate, latency, error rate (RED metrics)
  - **Workflow**: Process instances, completion time, failure rate
  - **SAP Adapter**: PO creation success/failure, sync latency
  - **JVM**: Heap usage, GC pauses, thread count
- **Scrape Interval**: 15 seconds
- **Retention**: 30 days (long-term storage in Thanos/Cortex)

#### Grafana (Dashboards)
- **Dashboards**:
  - **Application**: Request throughput, error rates, latency percentiles
  - **Workflow**: BPMN process metrics, SLA compliance
  - **Infrastructure**: Pod CPU/memory, node health
  - **Business**: PRs created, approval cycle time, PO value
- **Alerts**: Configured via Alertmanager (email, Slack, PagerDuty)

#### ELK Stack (Logging)
- **Elasticsearch**: Log storage and search
- **Logstash**: Log parsing and enrichment
- **Kibana**: Log visualization and dashboards
- **Filebeat**: Log shipping from K8s pods
- **Log Format**: JSON with correlation ID for tracing

#### Jaeger (Tracing)
- **Purpose**: Distributed tracing for request flows
- **Sampling**: 10% for production, 100% for staging
- **Trace Context**: W3C Trace Context standard
- **Storage**: Elasticsearch backend

---

## 6. Deployment Architecture (Kubernetes)

```plantuml
@startuml k8s_architecture
!define KubernetesPuml https://raw.githubusercontent.com/dcasati/kubernetes-PlantUML/master/dist

!includeurl KubernetesPuml/kubernetes_Common.puml
!includeurl KubernetesPuml/kubernetes_Context.puml
!includeurl KubernetesPuml/kubernetes_Simplified.puml

!includeurl KubernetesPuml/OSS/KubernetesPod.puml
!includeurl KubernetesPuml/OSS/KubernetesIng.puml
!includeurl KubernetesPuml/OSS/KubernetesSvc.puml

title Kubernetes Deployment Architecture

Cluster_Boundary(cluster, "HPCL K8s Cluster") {
    Namespace_Boundary(ns_frontend, "frontend") {
        KubernetesPod(web_pod, "web", "")
        KubernetesSvc(web_svc, "web-svc", "")
    }
    
    Namespace_Boundary(ns_backend, "backend") {
        KubernetesPod(api_pod, "procurement-api", "")
        KubernetesPod(sap_pod, "sap-adapter", "")
        KubernetesPod(integration_pod, "integration-adapter", "")
        KubernetesSvc(api_svc, "api-svc", "")
    }
    
    Namespace_Boundary(ns_workflow, "workflow") {
        KubernetesPod(zeebe_pod, "zeebe-broker", "")
        KubernetesPod(operate_pod, "camunda-operate", "")
        KubernetesSvc(zeebe_svc, "zeebe-gateway", "")
    }
    
    Namespace_Boundary(ns_data, "data") {
        KubernetesPod(kafka_pod, "kafka", "")
        KubernetesPod(mysql_pod, "mysql-proxy", "")
        KubernetesSvc(kafka_svc, "kafka-svc", "")
    }
    
    Namespace_Boundary(ns_monitoring, "monitoring") {
        KubernetesPod(prom_pod, "prometheus", "")
        KubernetesPod(grafana_pod, "grafana", "")
    }
    
    KubernetesIng(ingress, "ingress-nginx", "")
}

ingress --> web_svc
ingress --> api_svc
api_svc --> api_pod
api_pod --> zeebe_svc
api_pod --> kafka_svc

@enduml
```

---

## 7. Scalability & Performance

### Horizontal Pod Autoscaling (HPA)

| Service | Min Replicas | Max Replicas | Target CPU | Target Memory |
|---------|--------------|--------------|------------|---------------|
| procurement-api | 3 | 20 | 70% | 80% |
| sap-adapter | 2 | 10 | 60% | 75% |
| integration-adapter | 2 | 8 | 60% | 75% |
| workflow (Zeebe) | 3 | 3 | N/A | N/A |
| document-intelligence | 2 | 10 | 80% | 85% |
| ml-scoring | 2 | 5 | 75% | 80% |

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| PR Submission Response Time | < 2s | p95 latency |
| Approval Action Response Time | < 1s | p95 latency |
| SAP PO Creation | < 5s | p95 end-to-end |
| Search Query Response | < 500ms | p95 latency |
| Dashboard Load Time | < 3s | p95 initial load |
| System Availability | 99.9% | Monthly uptime |

---

## 8. Disaster Recovery

### RTO & RPO

| Component | RTO | RPO | Strategy |
|-----------|-----|-----|----------|
| MySQL | 1 hour | 5 minutes | Automated backups, point-in-time recovery |
| Kafka | 30 minutes | 0 (replicated) | Multi-broker replication |
| Elasticsearch | 2 hours | 1 hour | Snapshot to S3 |
| K8s Cluster | 4 hours | N/A | IaC rebuild (Terraform) |
| Application State | 1 hour | 5 minutes | Stateless apps, DB-backed |

### Backup Schedule

- **MySQL**: Daily full backup (2 AM IST), hourly incremental
- **Kafka**: Continuous replication (no backup needed)
- **Elasticsearch**: Daily snapshot to S3
- **S3 (DMS)**: Versioning enabled, cross-region replication
- **Config**: Git-backed (GitOps), versioned in Git

---

## 9. Security Architecture

### Defense in Depth

```
Layer 1: Network (VPC, Security Groups, NACLs)
Layer 2: Application (WAF, Rate Limiting, Input Validation)
Layer 3: Authentication (SSO, JWT, 2FA)
Layer 4: Authorization (RBAC, Attribute-Based Access Control)
Layer 5: Data (Encryption at rest, TLS in transit)
Layer 6: Audit (Immutable logs, tamper detection)
```

### Security Controls

| Control | Implementation | Owner |
|---------|---------------|--------|
| Network Segmentation | VPC with private subnets | Infra Team |
| DDoS Protection | CloudFlare/AWS Shield | Infra Team |
| WAF | ModSecurity rules | Security Team |
| Secrets Management | HashiCorp Vault | Security Team |
| Encryption (rest) | KMS-managed keys (AES-256) | Security Team |
| Encryption (transit) | TLS 1.3, mTLS for internal | Security Team |
| Audit Logging | Append-only Kafka topic | Backend Team |
| Vulnerability Scanning | Trivy, Snyk | DevOps Team |
| Pen Testing | Annual by external auditor | Security Team |

---

## 10. Cost Estimation (Monthly)

| Component | Specification | Cost (INR) |
|-----------|---------------|------------|
| **Compute (K8s)** | 10 nodes (8 vCPU, 32 GB each) | ₹3,00,000 |
| **MySQL (RDS)** | db.r5.xlarge + replica | ₹80,000 |
| **Elasticsearch** | 3-node cluster (m5.large) | ₹60,000 |
| **Kafka** | 3 brokers (m5.large) | ₹50,000 |
| **S3 Storage** | 5 TB (standard) | ₹10,000 |
| **Load Balancer** | Application LB | ₹20,000 |
| **Data Transfer** | 2 TB egress/month | ₹15,000 |
| **Monitoring** | Prometheus, Grafana, ELK | ₹30,000 |
| **Backups** | MySQL, ES snapshots | ₹10,000 |
| **Support** | Cloud provider support | ₹50,000 |
| **Total** | | **₹6,25,000/month** |

**Annual Cost**: ~₹75,00,000 (~$90,000 USD)

---

## 11. Top 10 Architecture Risks & Mitigations

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | SAP API unavailability | High | Retry logic, DLQ, manual fallback process |
| 2 | GeM/CPPP API rate limits | Medium | RPA fallback, request throttling |
| 3 | Database connection exhaustion | High | Connection pooling, read replicas, caching |
| 4 | Kafka message loss | High | Replication factor 3, acks=all, idempotent producer |
| 5 | Zeebe cluster failure | High | 3-broker quorum, backups, fast failover |
| 6 | DSC provider downtime | Medium | Queue signatures, retry, offline signing option |
| 7 | DMS storage quota exceeded | Low | Lifecycle policies, archival to Glacier |
| 8 | Security breach (API) | High | WAF, rate limiting, JWT expiry, audit logs |
| 9 | Data residency compliance | Medium | Deploy in India region, data sovereignty controls |
| 10 | Vendor lock-in (cloud) | Low | Use Kubernetes (portable), avoid proprietary services |

---

## 12. Rollout Strategy

### Blue-Green Deployment

1. **Blue Environment**: Current production (v1.0)
2. **Green Environment**: New version (v1.1)
3. **Switch**: Route 100% traffic to Green after validation
4. **Rollback**: Instant switch back to Blue if issues detected

### Canary Deployment

1. **10% Traffic**: Route 10% to new version, monitor metrics
2. **50% Traffic**: If stable, increase to 50%
3. **100% Traffic**: Full rollout after 24h stability
4. **Monitoring**: Error rates, latency, business metrics

### Database Migrations (Flyway)

1. **Backward-Compatible**: New columns nullable, no column drops
2. **Versioned**: V1__init.sql, V2__add_pr_category.sql
3. **Testing**: Test migrations on staging before prod
4. **Rollback**: Manual rollback scripts for critical changes

---

## 13. Acceptance Criteria

✅ **System architecture diagram reviewed and approved by:**
- Solution Architect
- Infrastructure Lead
- SAP SME
- Security Officer

✅ **PlantUML diagrams render without errors**

✅ **Network topology validated for security compliance:**
- Private subnets for data tier
- No public IPs for databases
- Security groups restrict access

✅ **Scalability targets validated:**
- HPA configured for all services
- Load testing confirms 10K concurrent users

✅ **Disaster recovery plan validated:**
- RTO/RPO meet SLA requirements
- Backup/restore tested

✅ **Cost estimation reviewed and approved by finance**

✅ **Architecture risks reviewed with mitigation plans**

---

## Next Steps

1. **Week 1**: Stakeholder review and approval
2. **Week 1**: SAP sandbox connectivity test
3. **Week 2**: Camunda PoC deployment on K8s
4. **Week 2**: Security architecture validation
5. **Week 3**: Infrastructure setup (Terraform, K8s cluster)

---

**Document Owner**: Solution Architect  
**Last Updated**: 2025-11-21  
**Version**: 1.0

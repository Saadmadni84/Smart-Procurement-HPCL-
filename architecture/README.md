# STEP 3: ARCHITECTURE & INTEGRATION DESIGN
## HPCL Procurement Automation System

### Purpose & Scope

This document package contains the complete technical architecture and integration design for the HPCL Procurement Automation System. It serves as the authoritative reference for development, infrastructure, security, and operational teams implementing the procurement transformation.

**Scope of Deliverables:**
- System architecture diagrams (component, sequence, data flow, ER)
- Integration specifications for SAP, GeM, CPPP, DMS, eSign
- Security architecture and policies (SSO, encryption, DSC, audit logs)
- Infrastructure as Code (Kubernetes, Terraform)
- CI/CD pipeline definitions
- API contracts (OpenAPI 3.0)
- Database schemas and data policies
- Operational runbooks and monitoring playbooks
- Testing strategies and governance frameworks
- Acceptance criteria and implementation roadmap

---

## Implementation Roadmap

### Phase 1: Design & Validation (Week 1-2)
**Objective:** Validate architecture with stakeholders, secure approvals

**Activities:**
- Architecture review with infra, security, SAP SME
- SAP connectivity test (sandbox handshake)
- Workflow engine PoC (Camunda vs Flowable)
- Security architecture validation with CISO
- OpenAPI contract reviews with frontend/backend teams

**Deliverables:**
- Approved system architecture diagram
- SAP integration test report
- Workflow engine selection justification
- Security sign-off

**Exit Criteria:**
- All diagrams reviewed and approved
- SAP sandbox connectivity confirmed
- Workflow engine selected

---

### Phase 2: PoC Development (Week 3-4)
**Objective:** Build proof-of-concept for critical integrations

**Activities:**
- SAP adapter PoC (PR → SAP PO creation)
- Camunda/Zeebe workflow PoC (simple PR approval flow)
- DSC signing integration PoC
- K8s deployment to dev cluster
- CI/CD pipeline setup (build → test → deploy to dev)

**Deliverables:**
- Working SAP adapter with sample payloads
- BPMN workflow deployed to Camunda
- eSign integration demo
- Dev environment running on K8s
- Automated build pipeline

**Exit Criteria:**
- SAP round-trip (create PO, read status) successful
- Workflow engine processes PR approval
- DSC signature captured and verified
- Dev deployment automated

---

### Phase 3: Pilot Implementation (Week 5-8)
**Objective:** Deploy to staging with full integration suite

**Activities:**
- Complete backend APIs (PRs, approvals, rules, exceptions)
- Frontend integration with backend
- SAP, GeM, CPPP adapters (API + RPA fallback)
- Document Intelligence (OCR, NLP) integration
- ML-based scoring module
- Security hardening (SSO, JWT, encryption, audit logs)
- Staging deployment with production-like config
- Integration testing (end-to-end scenarios)
- Performance testing (load, stress)
- Security testing (pen-test, OWASP)

**Deliverables:**
- Fully functional staging environment
- All integrations tested (SAP, GeM, CPPP, DMS, eSign)
- Test reports (functional, integration, performance, security)
- Production deployment runbooks
- Monitoring dashboards (Grafana, Kibana)

**Exit Criteria:**
- All API contracts implemented and tested
- Integration tests pass (SAP, GeM, CPPP)
- Performance benchmarks met (target: <2s PR submission, <5s approval)
- Security scan passes with zero critical/high vulnerabilities
- Staging environment stable for 1 week

---

### Phase 4: Production Rollout (Week 9-12)
**Objective:** Deploy to production with controlled rollout

**Activities:**
- Blue-green deployment to production
- Canary rollout (10% → 50% → 100% traffic)
- Production monitoring and alerting setup
- User training and onboarding
- Hypercare support (24x7 for first 2 weeks)
- Bug fixes and performance tuning
- Post-deployment review

**Deliverables:**
- Production deployment
- Monitoring and alerting active
- User training materials
- Post-deployment report
- Lessons learned document

**Exit Criteria:**
- Production deployment successful (zero-downtime)
- All critical business flows functional
- Monitoring and alerting validated
- User acceptance sign-off
- Hypercare period completed

---

## Stakeholders & Owners

| Role | Name | Responsibilities |
|------|------|------------------|
| **Solution Architect** | TBD | Overall architecture design, technology selection, integration patterns |
| **Infrastructure Lead** | TBD | K8s setup, Terraform, networking, security groups, load balancers |
| **SAP SME** | TBD | SAP integration patterns, BAPI/IDoc mapping, sandbox access |
| **Security Officer** | TBD | Security architecture, DSC policy, encryption, audit logs, compliance |
| **Procurement Owner** | TBD | Business requirements, GeM/CPPP workflows, approval hierarchies |
| **DevOps Lead** | TBD | CI/CD pipelines, deployment automation, monitoring, alerting |
| **Frontend Lead** | TBD | React UI implementation, API integration, UX design |
| **Backend Lead** | TBD | Spring Boot APIs, workflow integration, rule engine, ML models |
| **QA Lead** | TBD | Test strategy, automation, integration testing, UAT coordination |
| **DBA** | TBD | MySQL schema, migrations, backup/restore, performance tuning |

---

## Artifact Organization

### 📁 diagrams/
System architecture, sequence diagrams, data flow, ER diagrams (PlantUML)

### 📁 integration/
- **sap/**: SAP integration specs, sample payloads, error handling
- **gem_cppp/**: GeM/CPPP integration, API examples, RPA fallback
- **dms_esign/**: Document management and digital signature specs

### 📁 security/
Security architecture, KMS, DSC policy, audit log specifications

### 📁 infra/
- **k8s/**: Kubernetes deployment manifests, Helm charts
- **terraform/**: Infrastructure as Code for cloud resources
- **ci-cd/**: GitLab CI pipeline definitions

### 📁 api_contracts/
OpenAPI 3.0 specifications for all APIs

### 📁 data/
Database schemas, data retention policies

### 📁 ops/
- **runbooks/**: Deployment, incident response, backup/restore procedures
- **monitoring/**: Monitoring playbooks, alerting rules

### 📁 testing/
Integration test plans, contract test scenarios

### 📁 governance/
Compliance checklists, change control policies

### 📄 acceptance_criteria.md
Concrete pass/fail criteria for design acceptance

---

## How to Use These Artifacts

### For Developers
1. Review **diagrams/01_system_architecture.md** for system overview
2. Implement APIs per **api_contracts/openapi-*.yml** specifications
3. Use **data/db_schema.sql** for database schema reference
4. Follow **integration/** specs for external system integrations
5. Run tests per **testing/integration-test-plan.md**

### For Infrastructure Teams
1. Review **infra/k8s/deployment-manifests.yaml** for K8s setup
2. Use **infra/terraform/terraform-outline.tf** for cloud provisioning
3. Implement **infra/ci-cd/gitlab-ci.yml** pipeline
4. Follow **ops/runbooks/deploy_runbook.md** for deployments
5. Configure monitoring per **ops/monitoring/monitoring_playbook.md**

### For Security Teams
1. Review **security/security_architecture.md** for security controls
2. Implement **security/kms_key_management.md** key management
3. Configure **security/dsc_esign_policy.md** digital signature flows
4. Validate **security/audit_log_spec.md** compliance requirements
5. Use **governance/compliance-checklist.md** for audits

### For SAP Integration Teams
1. Review **integration/sap/sap_integration_spec.md**
2. Test with **integration/sap/sap_sample_payloads.json**
3. Implement error handling per **integration/sap/sap_error_handling.md**
4. Conduct sandbox testing

### For Operations Teams
1. Follow **ops/runbooks/deploy_runbook.md** for deployments
2. Use **ops/runbooks/incident_response.md** for troubleshooting
3. Configure alerts per **ops/monitoring/alerting_rules.yml**
4. Monitor SLOs per **ops/monitoring/monitoring_playbook.md**

---

## Technology Stack (Fixed)

| Category | Technology | Version | Justification |
|----------|-----------|---------|---------------|
| **Backend** | Spring Boot | 3.2+ | Enterprise-grade, mature ecosystem, excellent SAP/DB integration |
| **Language** | Java | 17+ | LTS version, modern features, wide PSU adoption |
| **Database** | MySQL | 8.0+ | Proven reliability, excellent tooling, cost-effective |
| **ORM** | Hibernate/JPA | 6.x | Standard JPA, reduces boilerplate, lazy loading support |
| **Migrations** | Flyway | 9.x | Version-controlled schema changes, rollback support |
| **Frontend** | React | 18+ | Component reusability, large ecosystem, HPCL theme support |
| **Build Tool** | Vite | 5.x | Fast builds, HMR, optimized production bundles |
| **Workflow** | Camunda 8 (Zeebe) | 8.x | Cloud-native, horizontally scalable, BPMN 2.0, strong community |
| **Messaging** | Kafka | 3.x | Event sourcing, high throughput, durability, exactly-once semantics |
| **Auth** | Keycloak (OIDC/SAML) | 23+ | Open-source, SSO, 2FA, fine-grained RBAC |
| **API Gateway** | Kong | 3.x | Rate limiting, JWT validation, API analytics |
| **Container** | Docker | 24+ | Standard containerization, reproducible builds |
| **Orchestration** | Kubernetes | 1.28+ | Industry standard, auto-scaling, self-healing |
| **IaC** | Terraform | 1.6+ | Multi-cloud, state management, declarative |
| **CI/CD** | GitLab CI | 16+ | Integrated with Git, pipeline as code, security scanning |
| **Monitoring** | Prometheus + Grafana | Latest | Metrics collection, alerting, visualization |
| **Logging** | ELK Stack | 8.x | Centralized logging, search, analytics |
| **Tracing** | Jaeger | Latest | Distributed tracing, root cause analysis |

---

## Key Architecture Decisions

### 1. Workflow Engine: Camunda 8 (Zeebe)

**Rationale:**
- **Cloud-native**: Zeebe is designed for Kubernetes, horizontally scalable
- **Performance**: High throughput (10K+ workflow instances/sec)
- **BPMN 2.0**: Industry standard, visual process modeling
- **Resilience**: Built-in fault tolerance, automatic retries
- **Observability**: Metrics, tracing, audit trails
- **Community**: Strong enterprise support, active development

**vs. Flowable:**
- Flowable is JVM-based, better for monolithic deployments
- Zeebe is distributed-first, better for microservices
- HPCL needs horizontal scaling for multi-site rollout → Zeebe wins

**Implementation:**
- Deploy Zeebe cluster (3 brokers) on K8s
- Use Camunda Operate for process monitoring
- Use Camunda Tasklist for human tasks (approvals)
- Integrate with Spring Boot via Zeebe Java client

---

### 2. Messaging: Kafka

**Rationale:**
- **Event Sourcing**: Append-only log, replay capability (compliance requirement)
- **Durability**: Persistent storage, configurable retention
- **Throughput**: Millions of messages/sec, low latency
- **Exactly-Once**: Transactional guarantees for critical workflows
- **Integration**: Native Spring Kafka support, Camunda connector

**vs. RabbitMQ:**
- RabbitMQ is better for request/reply, complex routing
- Kafka is better for event streaming, audit trails
- HPCL needs event log for compliance → Kafka wins

**Topics:**
- `pr.created`, `pr.approved`, `pr.rejected`
- `po.issued`, `po.ack.received`
- `rule.evaluated`, `exception.raised`
- `audit.log` (immutable, infinite retention)

---

### 3. Database: Managed MySQL (Cloud RDS/CloudSQL)

**Rationale:**
- **Managed Service**: Automated backups, patching, high availability
- **Cost**: Lower TCO than self-hosted (no ops overhead)
- **Compliance**: Encryption at rest, audit logs, point-in-time recovery
- **Performance**: Read replicas for analytics, connection pooling

**vs. Self-hosted:**
- Self-hosted requires DBA team, backup infrastructure
- Managed service provides 99.95% SLA
- HPCL priorities: reliability > control → Managed wins

**Schema Strategy:**
- Use Flyway for version-controlled migrations
- Backward-compatible changes only (no downtime)
- Separate schema for audit logs (append-only, WORM-enabled)

---

### 4. Integration Patterns

**SAP Integration:**
- **Preferred**: SAP CPI (Cloud Platform Integration) with OData APIs
- **Fallback**: Direct BAPI/IDoc calls via JCo connector
- **Why**: CPI provides API gateway, rate limiting, monitoring
- **Idempotency**: Use `PR_ID + TIMESTAMP` as business key

**GeM/CPPP Integration:**
- **Preferred**: REST APIs (if available)
- **Fallback**: RPA (UiPath/Automation Anywhere) for portal automation
- **Why**: APIs are faster, reliable; RPA handles legacy portals
- **Reconciliation**: Daily batch job to sync statuses

**DMS/eSign Integration:**
- **DMS**: S3-compatible object storage (MinIO/AWS S3)
- **eSign**: Integration with licensed DSC provider (eMudhra, Sify)
- **Why**: Compliance with Indian IT Act, legal validity

---

## Next Steps

1. **Week 1**: Architecture review meetings with all stakeholders
2. **Week 1**: SAP sandbox access request and connectivity test
3. **Week 1**: Camunda PoC setup on local K8s (minikube/kind)
4. **Week 2**: Security architecture validation with CISO
5. **Week 2**: OpenAPI contract finalization with frontend/backend teams
6. **Week 3**: Begin PoC development (see Phase 2 roadmap)

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-21 | Solution Architect | Initial architecture design |

---

## References

- [Camunda 8 Documentation](https://docs.camunda.io/)
- [Spring Boot Best Practices](https://spring.io/guides)
- [Kubernetes Patterns](https://k8s-patterns.io/)
- [SAP Integration Guide](https://help.sap.com/)
- [GeM Portal](https://gem.gov.in/)
- [CVC Guidelines](https://cvc.gov.in/)
- [Indian IT Act 2000](https://www.meity.gov.in/content/information-technology-act)

---

**For questions or clarifications, contact:**
- Solution Architect: architect@hpcl.com
- Project Manager: pm-procurement@hpcl.com

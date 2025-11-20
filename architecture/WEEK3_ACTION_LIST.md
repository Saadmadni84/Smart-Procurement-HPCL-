# Week 3 Action List - HPCL Procurement Automation System
## Architecture & Integration Design Phase

**Week**: Week 3 (November 25-29, 2025)  
**Phase**: Architecture Validation & PoC Development  
**Status**: Ready for Execution  

---

## 🎯 **PRIORITY 1: Architecture Validation** (Day 1-2)

### ✅ **Action 1.1: Stakeholder Review Meetings**

**Objective**: Get formal approval on architecture deliverables

**Schedule**:
- **Monday, Nov 25, 9:00 AM - 11:00 AM**: Architecture Walkthrough
  - **Attendees**: Solution Architect, Infra Lead, Security Officer, Backend Lead, Frontend Lead
  - **Agenda**:
    - Present system architecture diagrams (C4 model, network topology, K8s architecture)
    - Review technology stack decisions (Camunda 8, Kafka, MySQL)
    - Discuss scalability targets (10K users, 5K PRs/day)
    - Review cost estimates (₹6.25L/month)
    - Walk through disaster recovery plan (RTO: 1h, RPO: 5min)
  - **Deliverables**: Signed architecture approval document
  - **Success Criteria**: All stakeholders approve with no blocking concerns

- **Monday, Nov 25, 2:00 PM - 4:00 PM**: SAP Integration Deep-Dive
  - **Attendees**: SAP SME, Integration Team, Backend Lead
  - **Agenda**:
    - Review SAP integration specification
    - Discuss BAPI field mappings (EKKO, EKPO, EKKN)
    - Validate idempotency strategy
    - Review error handling and retry logic
    - Plan SAP sandbox connectivity test
  - **Deliverables**: SAP integration spec approval, sandbox access request
  - **Success Criteria**: SAP SME approves integration approach

- **Tuesday, Nov 26, 10:00 AM - 12:00 PM**: Security Architecture Validation
  - **Attendees**: CISO, Security Officer, Solution Architect, DevOps Lead
  - **Agenda**:
    - Review security architecture (defense in depth)
    - Validate encryption strategy (AES-256 at rest, TLS 1.3 in transit)
    - Discuss DSC integration for digital signatures
    - Review audit log design (append-only, 7-year retention)
    - Validate secrets management (HashiCorp Vault)
  - **Deliverables**: Security architecture approval
  - **Success Criteria**: CISO signs off on security controls

**Owner**: Solution Architect  
**Dependencies**: Architecture documents completed  

---

### ✅ **Action 1.2: SAP Sandbox Connectivity Test**

**Objective**: Validate network connectivity and BAPI execution in SAP sandbox

**Tasks**:
1. **Request SAP Sandbox Access** (Monday, Nov 25)
   - Contact SAP SME for sandbox credentials
   - Obtain:
     - SAP hostname/IP
     - RFC destination name
     - SAP user ID/password
     - Client number (e.g., 100 for sandbox)
   - **Deliverable**: Credentials received

2. **Test Network Connectivity** (Tuesday, Nov 26 AM)
   - Ping SAP sandbox server from application server
   - Test port 3300 (SAP Gateway) connectivity: `telnet <sap-host> 3300`
   - Verify firewall rules allow traffic
   - **Deliverable**: Network connectivity confirmed

3. **Execute Test BAPI Call** (Tuesday, Nov 26 PM)
   - Set up SAP JCo connector in development environment
   - Execute `BAPI_PO_CREATE1` with test data:
     ```
     Vendor: 100001 (test vendor)
     Material: MAT-TEST-001
     Quantity: 10
     Plant: 1000
     ```
   - Verify PO created in SAP (T-Code: ME23N)
   - Extract SAP PO number from response
   - **Deliverable**: SAP PO number retrieved successfully

4. **Document Test Results**
   - Create test report with:
     - Request payload
     - Response payload
     - SAP PO screenshot
     - Network latency measurements
   - **Deliverable**: SAP Connectivity Test Report (PDF)

**Owner**: SAP Integration Team (Backend Developer + SAP SME)  
**Dependencies**: SAP sandbox access  
**Success Criteria**: BAPI call succeeds, PO created in SAP with PO number returned  
**Estimated Effort**: 6 hours  

---

## 🎯 **PRIORITY 2: PoC Development** (Day 3-5)

### ✅ **Action 2.1: Camunda PoC Deployment**

**Objective**: Validate Camunda Zeebe workflow orchestration with PR approval flow

**Tasks**:
1. **Set Up Local Kubernetes Cluster** (Wednesday, Nov 27 AM)
   - Install minikube or kind on development machine
   - Start cluster: `minikube start --cpus=4 --memory=8192`
   - Verify: `kubectl get nodes`
   - **Deliverable**: K8s cluster running locally

2. **Deploy Camunda Zeebe** (Wednesday, Nov 27 PM)
   - Add Camunda Helm repo:
     ```bash
     helm repo add camunda https://helm.camunda.io
     helm repo update
     ```
   - Install Zeebe:
     ```bash
     helm install zeebe camunda/camunda-platform \
       --set zeebe.clusterSize=1 \
       --set zeebe.partitionCount=1 \
       --set zeebe.replicationFactor=1
     ```
   - Wait for pods to be ready: `kubectl get pods -w`
   - **Deliverable**: Zeebe cluster running in K8s

3. **Create PR Approval BPMN** (Thursday, Nov 28 AM)
   - Design BPMN process in Camunda Modeler:
     - Start Event: PR Submitted
     - Service Task: Evaluate Business Rules
     - User Task: L1 Approval
     - Exclusive Gateway: L1 Decision
     - User Task: L2 Approval (if budget > 5L)
     - Exclusive Gateway: L2 Decision
     - Service Task: Create PO in SAP
     - End Event: PR Approved
   - Export BPMN XML
   - **Deliverable**: pr-approval-workflow.bpmn

4. **Integrate Zeebe Java Client** (Thursday, Nov 28 PM)
   - Add Zeebe Spring Boot Starter dependency
   - Create workflow deployment endpoint
   - Create job workers for service tasks:
     - Rule evaluation worker
     - SAP PO creation worker
   - Test workflow execution with REST API
   - **Deliverable**: Spring Boot app with Zeebe integration

5. **Demo Workflow Execution** (Friday, Nov 29 AM)
   - Start workflow instance with test PR data
   - Complete L1 approval via Zeebe API
   - Verify L2 task created (for budget > 5L)
   - Complete L2 approval
   - Verify SAP service task triggered
   - **Deliverable**: Screen recording of workflow execution

**Owner**: Backend Team Lead  
**Dependencies**: Docker, Kubernetes, Camunda Modeler installed  
**Success Criteria**: BPMN workflow executes successfully, user tasks assigned correctly  
**Estimated Effort**: 16 hours  

---

### ✅ **Action 2.2: CI/CD Pipeline Setup**

**Objective**: Automate build, test, and deployment to dev environment

**Tasks**:
1. **Create GitLab CI Pipeline** (Wednesday, Nov 27)
   - Create `.gitlab-ci.yml` with stages:
     - `build`: Maven compile
     - `test`: Unit tests (JUnit)
     - `security-scan`: Trivy image scan
     - `build-image`: Docker build & push
     - `deploy-dev`: Deploy to dev K8s cluster
   - **Deliverable**: `.gitlab-ci.yml` committed to repo

2. **Configure Docker Registry** (Thursday, Nov 28 AM)
   - Set up Harbor registry (or use GitLab registry)
   - Create robot account for CI/CD
   - Configure credentials in GitLab CI/CD variables
   - **Deliverable**: Docker registry accessible from pipeline

3. **Deploy to Dev Cluster** (Thursday, Nov 28 PM)
   - Create K8s deployment manifest (dev namespace)
   - Configure kubectl context in CI runner
   - Test deployment:
     ```bash
     kubectl apply -f k8s/dev/deployment.yaml
     kubectl rollout status deployment/procurement-api
     ```
   - **Deliverable**: Application deployed to dev cluster

4. **Run Smoke Tests** (Friday, Nov 29 AM)
   - Create smoke test script:
     - Health check: `GET /actuator/health`
     - Create PR: `POST /api/v1/pr`
     - List PRs: `GET /api/v1/pr`
   - Integrate smoke tests into CI pipeline
   - **Deliverable**: Smoke tests passing in pipeline

**Owner**: DevOps Team  
**Dependencies**: GitLab runner configured, K8s dev cluster accessible  
**Success Criteria**: Code commit triggers auto-build and deploy to dev  
**Estimated Effort**: 12 hours  

---

### ✅ **Action 2.3: OpenAPI Contract Finalization**

**Objective**: Align frontend and backend teams on API contracts

**Tasks**:
1. **Review OpenAPI Specs** (Wednesday, Nov 27)
   - Backend team reviews `openapi-pr.yml`
   - Frontend team reviews endpoints and schemas
   - Identify any missing fields or endpoints
   - **Deliverable**: Review feedback documented

2. **Validate with Swagger CLI** (Wednesday, Nov 27)
   - Install Swagger CLI: `npm install -g @apidevtools/swagger-cli`
   - Validate spec:
     ```bash
     swagger-cli validate architecture/api_contracts/openapi-pr.yml
     ```
   - Fix any validation errors
   - **Deliverable**: Valid OpenAPI spec (no errors)

3. **Generate API Documentation** (Thursday, Nov 28)
   - Generate Swagger UI from spec:
     ```bash
     docker run -p 8081:8080 \
       -e SWAGGER_JSON=/openapi.yml \
       -v $(pwd)/openapi-pr.yml:/openapi.yml \
       swaggerapi/swagger-ui
     ```
   - Access UI: http://localhost:8081
   - **Deliverable**: API docs published

4. **Frontend/Backend Contract Approval** (Friday, Nov 29)
   - Conduct joint meeting (Frontend + Backend leads)
   - Review API contracts
   - Agree on request/response schemas
   - Sign off on contracts
   - **Deliverable**: Approved OpenAPI contracts

**Owner**: Backend Lead + Frontend Lead  
**Dependencies**: OpenAPI specs created  
**Success Criteria**: Both teams approve API contracts, no blocking issues  
**Estimated Effort**: 8 hours  

---

## 📋 **ACTION SUMMARY TABLE**

| Action | Owner | Start Date | End Date | Estimated Effort | Status |
|--------|-------|------------|----------|------------------|--------|
| **1.1 Stakeholder Review Meetings** | Solution Architect | Nov 25 | Nov 26 | 8 hours | 🔴 Not Started |
| **1.2 SAP Sandbox Connectivity Test** | SAP Integration Team | Nov 25 | Nov 26 | 6 hours | 🔴 Not Started |
| **2.1 Camunda PoC Deployment** | Backend Team | Nov 27 | Nov 29 | 16 hours | 🔴 Not Started |
| **2.2 CI/CD Pipeline Setup** | DevOps Team | Nov 27 | Nov 29 | 12 hours | 🔴 Not Started |
| **2.3 OpenAPI Contract Finalization** | Backend + Frontend Leads | Nov 27 | Nov 29 | 8 hours | 🔴 Not Started |

**Total Estimated Effort**: 50 hours  
**Team Size**: 5 people  
**Timeline**: 5 days (Nov 25-29)  

---

## 🚦 **SUCCESS CRITERIA**

### Must-Have (Week 3 Completion)
- ✅ Architecture approved by all stakeholders (Solution Architect, Infra Lead, CISO)
- ✅ SAP sandbox connectivity successful (PO created via BAPI)
- ✅ Camunda workflow executes PR approval flow
- ✅ CI/CD pipeline deploys to dev cluster
- ✅ OpenAPI contracts approved by frontend + backend teams

### Nice-to-Have (If Time Permits)
- 🟡 GeM API credentials requested
- 🟡 eMudhra sandbox access obtained
- 🟡 Database schema reviewed by DBA
- 🟡 Security scan (Trivy) integrated into CI pipeline

---

## 📞 **ESCALATION MATRIX**

| Issue | Escalate To | Response Time |
|-------|-------------|---------------|
| SAP sandbox access delayed | SAP SME → IT Manager | 4 hours |
| Camunda deployment issues | Backend Lead → Solution Architect | 2 hours |
| CI/CD pipeline failures | DevOps Lead → Infra Lead | 1 hour |
| API contract disputes | Backend Lead + Frontend Lead → Solution Architect | 4 hours |
| Security concerns | Security Officer → CISO | 24 hours |

---

## 📝 **DAILY STANDUP AGENDA**

**Time**: 10:00 AM daily  
**Duration**: 15 minutes  
**Format**:
1. What did I complete yesterday?
2. What am I working on today?
3. Any blockers?

**Tracking**: Update action status daily in tracking sheet

---

## 🎯 **WEEK 4 PREVIEW**

Based on Week 3 outcomes, Week 4 will focus on:
1. **Full Backend API Development** (PR CRUD, Approvals, Business Rules)
2. **Frontend Integration** (React components calling APIs)
3. **Database Migration** (Flyway scripts for schema deployment)
4. **Integration Development** (SAP adapter, GeM adapter, eSign adapter)
5. **Security Implementation** (Keycloak SSO, JWT validation, RBAC)

**Goal**: Working end-to-end demo (PR creation → Approval → PO creation)

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-21  
**Next Review**: 2025-11-29 (End of Week 3)  

---

## ✅ **CHECKLIST FOR WEEK 3 KICKOFF**

Before starting Week 3, ensure:
- [ ] All team members have access to GitLab repository
- [ ] Development machines have Docker, Kubernetes (minikube/kind) installed
- [ ] SAP sandbox access request submitted
- [ ] Architecture documents reviewed by all stakeholders
- [ ] Meeting rooms booked for stakeholder reviews
- [ ] CI/CD runner configured in GitLab
- [ ] Development K8s cluster provisioned
- [ ] Swagger CLI installed for OpenAPI validation

**Kickoff Meeting**: Monday, Nov 25, 8:30 AM (30 minutes before first stakeholder meeting)

---

**Status Legend**:
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- ⚠️ Blocked
- ❌ Cancelled

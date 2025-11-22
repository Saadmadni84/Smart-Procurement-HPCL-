# HPCL Procurement System - Sprint 1 Implementation

## 🎯 Overview

This is the Sprint 1 implementation of the HPCL Procurement Automation System, a comprehensive procurement management platform built with Spring Boot 3.2.2 backend and React 18 frontend.

## 📋 Sprint 1 Deliverables

### Backend Components ✅

#### Domain Models
- **PurchaseRequest** - Main PR entity with workflow tracking
- **PurchaseRequestItem** - Line items for PRs
- **Rule** - Business rule definitions
- **Approval** - Approval workflow tracking
- **ExceptionRecord** - Exception handling and tracking
- **AuditLog** - Comprehensive audit trail

#### Repositories
- `PurchaseRequestRepository`
- `PurchaseRequestItemRepository`
- `RuleRepository`
- `ApprovalRepository`
- `ExceptionRecordRepository`
- `AuditLogRepository`

#### Services
- **PurchaseRequestService** - PR CRUD and business logic
- **RuleService** - Rule evaluation engine
- **ApprovalService** - Multi-level approval workflow
- **ExceptionService** - Exception management
- **AuditService** - Audit logging

#### REST Controllers
- **PurchaseRequestController** - `/api/pr/*`
- **RuleController** - `/api/rules/*`
- **ApprovalController** - `/api/approvals/*`
- **ExceptionController** - `/api/exceptions/*`
- **DashboardController** - `/api/dashboard/*`

#### Integration Stubs
- **SAPAdapter** - SAP ERP integration (stub)
- **GeMAdapter** - Government e-Marketplace integration (stub)
- **CPPPAdapter** - Central Public Procurement Portal integration (stub)

#### Database
- **Flyway Migrations**:
  - `V1__init.sql` - Initial schema
  - `V2__extend_pr_records.sql` - Extended PR fields
  - `V3__complete_schema.sql` - Complete Sprint 1 schema with sample data
- **H2 Database** - Development (in-memory)
- **MySQL Support** - Production profile ready

### Frontend Components ✅

#### Pages
- **Dashboard** - Real-time metrics and overview
- **Purchase Requests** - PR listing and creation
- **Approvals** - Multi-level approval inbox
- **Rules** - Business rule management
- **Exceptions** - Exception tracking and resolution
- **Reports** - Analytics (stub)

#### Styling
- **HPCL Theme** - Corporate branding with navy (#00205B) and red (#ED1C24)
- **Responsive Design** - Card-based layout
- **Component Library** - Reusable UI components

#### API Integration
- Axios-based API client with proxy configuration
- Real-time data fetching from backend
- Error handling and loading states

## 🚀 Getting Started

### Prerequisites

- **Java 17+** (tested with Java 25)
- **Node.js 18+**
- **Maven 3.8+**
- **MySQL 8.0+** (optional for production)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Build the project**
   ```bash
   mvn clean install
   ```

3. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

   Backend will start on `http://localhost:8080`

4. **Verify Health**
   ```bash
   curl http://localhost:8080/api/health
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will start on `http://localhost:3000`

### Quick Start (Both Servers)

Use the automated startup script:

```bash
./start-servers.sh
```

This will:
- Kill existing processes on ports 8080 and 3000
- Start backend in background
- Wait for backend health check
- Start frontend in background
- Provide PIDs and log locations

## 📊 Database Schema

### Core Tables

- **pr_records** - Purchase requests
- **pr_items** - PR line items
- **procurement_rules** - Business rules
- **approvals** - Approval workflow
- **exception_records** - Exceptions
- **audit_logs** - Audit trail

### Sample Data

V3 migration includes:
- 4 sample procurement rules
- 1 sample PR with items
- Indexed for performance

## 🔧 Configuration

### Backend Configuration

**Development Profile** (`application.yaml`):
```yaml
spring:
  profiles:
    active: dev
  datasource:
    url: jdbc:h2:mem:hpcl_procurement
    driver-class-name: org.h2.Driver
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
```

**Production Profile** (`application-prod.yaml`):
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/hpcl_procurement
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

### Frontend Configuration

**Vite Proxy** (`vite.config.js`):
```javascript
server: {
  proxy: {
    '/api': 'http://localhost:8080'
  }
}
```

## 📡 API Endpoints

### Purchase Requests

- `GET /api/pr` - List all PRs
- `POST /api/pr` - Create PR
- `GET /api/pr/{prId}` - Get PR by ID
- `POST /api/pr/{prId}/approve` - Approve PR
- `POST /api/pr/{prId}/reject` - Reject PR

### Rules

- `GET /api/rules` - List all rules
- `GET /api/rules/active` - Get active rules
- `GET /api/rules/category/{category}` - Get rules by category
- `POST /api/rules` - Create rule
- `PUT /api/rules/{id}` - Update rule
- `DELETE /api/rules/{id}` - Delete rule

### Approvals

- `GET /api/approvals` - List all approvals
- `GET /api/approvals/pending` - Get pending approvals
- `GET /api/approvals/inbox/{approverId}` - Get approval inbox
- `GET /api/approvals/pr/{prId}` - Get approvals for PR
- `POST /api/approvals/{id}/approve` - Approve
- `POST /api/approvals/{id}/reject` - Reject

### Exceptions

- `GET /api/exceptions` - List all exceptions
- `GET /api/exceptions/open` - Get open exceptions
- `GET /api/exceptions/pr/{prId}` - Get exceptions by PR
- `GET /api/exceptions/severity/{severity}` - Get by severity
- `POST /api/exceptions/{exceptionId}/resolve` - Resolve exception
- `POST /api/exceptions/{exceptionId}/escalate` - Escalate exception

### Dashboard

- `GET /api/dashboard/summary` - Get dashboard metrics

## 🎨 HPCL Branding

### Colors
- **Primary Navy**: `#00205B`
- **Accent Red**: `#ED1C24`
- **Light Background**: `#F4F7FB`
- **White**: `#FFFFFF`

### Typography
- **Font Family**: Segoe UI, Roboto, Helvetica Neue
- **Font Sizes**: 12px - 24px scale

### Components
- Cards with shadow and hover effects
- Status badges (success, warning, danger, info)
- Responsive button styles
- Table with zebra striping

## 🧪 Testing

### Backend Testing

```bash
cd backend
mvn test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] Create a new PR
- [ ] View PR list
- [ ] Approve/Reject PR
- [ ] Create business rule
- [ ] View rule evaluation
- [ ] Check approval workflow
- [ ] Resolve exception
- [ ] View dashboard metrics
- [ ] Check audit logs

## 📝 Rule Engine

The custom rule engine evaluates business rules against PRs:

**Example Rules:**
- `estimatedValueInr >= 1000000` → Requires CFO approval
- `requiredByDate < CURRENT_DATE+7` → Urgent flag
- `category == "Services" AND estimatedValueInr >= 5000000` → Board approval

**Supported Operators:**
- Numeric: `>=`, `>`, `<=`, `<`, `==`
- Date comparisons with `CURRENT_DATE` expressions
- Category matching

**Severity Levels:**
- LOW, MEDIUM, HIGH, CRITICAL

**Actions:**
- REQUIRE_APPROVAL
- FLAG
- REQUIRE_DOCUMENTATION
- BLOCK

## 🔐 Security Notes

⚠️ **Sprint 1 uses basic authentication placeholders**

For Production:
- Implement Spring Security with JWT
- Add user authentication and authorization
- Secure all endpoints with role-based access control
- Enable HTTPS
- Add input validation and sanitization
- Implement rate limiting

## 🚧 Known Limitations (Sprint 1)

- **No Workflow Engine**: Camunda/Flowable integration pending
- **Stub Integrations**: SAP, GeM, CPPP are stubs only
- **Basic Rule Engine**: Custom implementation, not using MVEL
- **No Authentication**: Security deferred to Sprint 2
- **H2 Database**: Production requires MySQL migration
- **Mock Data**: Some UI components use fallback mock data

## 📦 Dependencies

### Backend
- Spring Boot 3.2.2
- Spring Data JPA
- Flyway 9.22.3
- H2 Database 2.2.224
- MySQL Connector (optional)
- Spring Validation

### Frontend
- React 18
- Vite 5.4.21
- React Router DOM
- Axios
- CSS Modules

## 🔄 Next Steps (Sprint 2)

1. **Workflow Engine Integration**
   - Integrate Camunda 8 or Flowable
   - Create BPMN process definitions
   - Implement service tasks

2. **Advanced Rule Engine**
   - Integrate MVEL or Drools
   - Complex rule expressions
   - Rule versioning

3. **Real Integrations**
   - SAP ERP API integration
   - GeM portal integration
   - CPPP compliance checks

4. **Security**
   - JWT authentication
   - Role-based authorization
   - Audit trail enhancements

5. **Testing**
   - Unit tests (80%+ coverage)
   - Integration tests
   - E2E tests with Cypress

6. **DevOps**
   - Docker containerization
   - CI/CD pipeline
   - Kubernetes deployment

## 📞 Support

For questions or issues:
- Check backend logs: `/tmp/procurement-backend.log`
- Check frontend logs: `/tmp/procurement-frontend.log`
- Review H2 console: `http://localhost:8080/h2-console`

## 📄 License

HPCL Internal Use Only - Proprietary

---

**Built with ❤️ for HPCL Procurement Team**

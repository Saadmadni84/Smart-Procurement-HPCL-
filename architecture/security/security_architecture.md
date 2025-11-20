# Security Architecture
## HPCL Procurement Automation System

**Document Version**: 1.0  
**Last Updated**: 2025-11-21  
**Owner**: Security Officer  
**Status**: Draft  

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Defense in Depth Strategy](#defense-in-depth-strategy)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Security](#api-security)
5. [Network Security](#network-security)
6. [Data Encryption](#data-encryption)
7. [Secrets Management](#secrets-management)
8. [OWASP Top 10 Mitigations](#owasp-top-10-mitigations)
9. [Security Monitoring](#security-monitoring)
10. [Compliance & Audit](#compliance--audit)

---

## Security Overview

### Security Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| **Zero Security Breaches** | 0 incidents/year | Security incident count |
| **Authentication Strength** | 100% MFA for admin | MFA enrollment rate |
| **Data Encryption** | 100% at rest & in transit | Encryption coverage |
| **Audit Coverage** | 100% actions logged | Audit log completeness |
| **Vulnerability Remediation** | < 7 days for critical | Mean time to remediate |

### Security Principles

1. **Least Privilege**: Users/services granted minimum required permissions
2. **Defense in Depth**: Multiple security layers (network, app, data)
3. **Zero Trust**: Verify every request, never trust by default
4. **Fail Secure**: System defaults to deny access on error
5. **Audit Everything**: Comprehensive logging for forensics

---

## Defense in Depth Strategy

### Layer 1: Perimeter Security

**Components**:
- **Web Application Firewall (WAF)**: AWS WAF / Cloudflare
- **DDoS Protection**: Rate limiting, IP blocking
- **DNS Security**: DNSSEC, DNS filtering

**Controls**:
- Block malicious IPs (GeoIP, reputation databases)
- SQL injection / XSS pattern detection
- Rate limit: 1000 requests/min per IP

---

### Layer 2: Network Security

**Components**:
- **Virtual Private Cloud (VPC)**: Isolated network
- **Security Groups**: Firewall rules for instances
- **Network ACLs**: Subnet-level traffic control
- **Private Subnets**: Database, Kafka in private subnets

**Architecture**:
```
Internet
    ↓
[Load Balancer] (Public Subnet)
    ↓
[Application Tier] (Private Subnet)
    ↓
[Data Tier] (Private Subnet - No Internet)
```

**Rules**:
- Public subnet: Ingress 443 (HTTPS), Egress all
- App subnet: Ingress from LB only, Egress to DB/Kafka
- DB subnet: Ingress from App only, No internet access

---

### Layer 3: Application Security

**Components**:
- **API Gateway**: Kong / AWS API Gateway
- **Authentication**: Keycloak (SSO)
- **Authorization**: Spring Security (RBAC)
- **Input Validation**: Bean Validation, sanitization

**Controls**:
- JWT token validation (RS256, 1-hour expiry)
- Role-based access control (REQUESTOR, APPROVER_L1, APPROVER_L2, ADMIN)
- Input sanitization (SQL injection, XSS prevention)
- CORS policy (whitelist: procurement.hpcl.com)

---

### Layer 4: Data Security

**Components**:
- **Encryption at Rest**: AES-256 (KMS-managed keys)
- **Encryption in Transit**: TLS 1.3
- **Database Encryption**: MySQL Transparent Data Encryption (TDE)
- **Document Encryption**: S3 Server-Side Encryption (SSE-KMS)

**Controls**:
- All data encrypted with unique keys
- Key rotation every 90 days
- Encrypted backups stored in Glacier

---

### Layer 5: Endpoint Security

**Components**:
- **Antivirus**: File upload scanning (ClamAV)
- **Malware Detection**: S3 Object Lambda for scanning
- **Device Management**: MDM for mobile access

**Controls**:
- Scan all uploaded files (PDFs, Excel, images)
- Block executable files (.exe, .bat, .sh)
- Quarantine suspicious files for manual review

---

### Layer 6: Physical Security

**Components**:
- **Data Center**: ISO 27001 certified facility
- **Access Control**: Biometric authentication
- **Surveillance**: 24/7 CCTV monitoring

**Controls** (for on-premise deployment):
- Badge access to server room
- Mantrap entry for critical areas
- Hardware decommissioning with disk destruction

---

## Authentication & Authorization

### Single Sign-On (SSO) with Keycloak

**Configuration**:
- **Protocol**: SAML 2.0 / OpenID Connect (OIDC)
- **Identity Provider**: Active Directory (LDAP)
- **Session Timeout**: 30 minutes inactivity
- **Token Expiry**: 1 hour (access token), 24 hours (refresh token)

**User Flow**:
```
User → Frontend → Keycloak Login → LDAP Auth → JWT Token → Frontend
Frontend → API (with JWT) → Spring Security validates → Allow/Deny
```

**Keycloak Realm Configuration**:
```json
{
  "realm": "hpcl-procurement",
  "accessTokenLifespan": 3600,
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "roles": {
    "realm": [
      {
        "name": "REQUESTOR",
        "description": "Can create PRs"
      },
      {
        "name": "APPROVER_L1",
        "description": "Can approve PRs up to 5L"
      },
      {
        "name": "APPROVER_L2",
        "description": "Can approve PRs above 5L"
      },
      {
        "name": "ADMIN",
        "description": "Full system access"
      }
    ]
  }
}
```

---

### Multi-Factor Authentication (2FA)

**Requirement**:
- **Mandatory** for ADMIN role
- **Optional** for other roles (encouraged)

**Methods**:
- **TOTP**: Google Authenticator, Microsoft Authenticator
- **SMS OTP**: For non-smartphone users
- **Hardware Token**: YubiKey for high-security users

**Spring Security Configuration**:
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/pr/**").hasAnyRole("REQUESTOR", "APPROVER_L1", "APPROVER_L2")
                .requestMatchers("/api/pr/*/approve").hasAnyRole("APPROVER_L1", "APPROVER_L2")
                .requestMatchers("/api/rules/**").hasRole("ADMIN")
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .csrf(csrf -> csrf.disable()); // Use CSRF tokens for session-based auth
        
        return http.build();
    }
    
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
        grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");
        
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }
}
```

---

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **REQUESTOR** | Create PR, View own PRs, Upload attachments |
| **APPROVER_L1** | View PRs, Approve PRs (< 5L), Reject PRs |
| **APPROVER_L2** | View PRs, Approve PRs (>= 5L), Reject PRs |
| **ADMIN** | All CRUD operations, Manage rules, View audit logs |
| **AUDITOR** | Read-only access to all data, Download reports |

**Permission Matrix**:
```
| Action              | REQUESTOR | APPROVER_L1 | APPROVER_L2 | ADMIN | AUDITOR |
|---------------------|-----------|-------------|-------------|-------|---------|
| Create PR           | ✅        | ❌          | ❌          | ✅    | ❌      |
| View Own PRs        | ✅        | ✅          | ✅          | ✅    | ✅      |
| View All PRs        | ❌        | ✅          | ✅          | ✅    | ✅      |
| Approve PR (< 5L)   | ❌        | ✅          | ✅          | ✅    | ❌      |
| Approve PR (>= 5L)  | ❌        | ❌          | ✅          | ✅    | ❌      |
| Reject PR           | ❌        | ✅          | ✅          | ✅    | ❌      |
| Manage Rules        | ❌        | ❌          | ❌          | ✅    | ❌      |
| View Audit Logs     | ❌        | ❌          | ❌          | ✅    | ✅      |
```

---

## API Security

### API Gateway (Kong)

**Features**:
- **Rate Limiting**: 1000 req/min per user, 10000 req/min per IP
- **JWT Validation**: Verify RS256 signature, check expiry
- **IP Whitelisting**: Restrict admin endpoints to corporate IPs
- **Request/Response Transformation**: Strip sensitive headers
- **Circuit Breaker**: Prevent cascade failures

**Kong Configuration**:
```yaml
services:
  - name: procurement-api
    url: http://procurement-api-service:8080
    routes:
      - name: pr-routes
        paths:
          - /api/pr
        methods:
          - GET
          - POST
          - PUT
        plugins:
          - name: jwt
            config:
              key_claim_name: kid
              secret_is_base64: false
          - name: rate-limiting
            config:
              minute: 1000
              policy: local
          - name: cors
            config:
              origins:
                - https://procurement.hpcl.com
              methods:
                - GET
                - POST
                - PUT
                - DELETE
              credentials: true
```

---

### Input Validation

**Validation Rules**:
- **SQL Injection**: Parameterized queries only (JPA, Hibernate)
- **XSS Prevention**: Sanitize HTML (OWASP Java Encoder)
- **File Upload**: Max 10MB, allowed types (PDF, Excel, images)
- **Email Validation**: RFC 5322 compliant
- **Amount Validation**: Positive numbers, max 2 decimal places

**Spring Boot Validation**:
```java
@RestController
@RequestMapping("/api/pr")
@Validated
public class PRController {
    
    @PostMapping
    public ResponseEntity<PRResponse> createPR(
        @Valid @RequestBody PRCreateRequest request
    ) {
        // Validation happens automatically via @Valid
        PRResponse response = prService.createPR(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

// DTO with validation annotations
public class PRCreateRequest {
    
    @NotBlank(message = "Description is required")
    @Size(max = 200, message = "Description must be <= 200 characters")
    private String description;
    
    @NotNull(message = "Estimated budget is required")
    @DecimalMin(value = "0.01", message = "Budget must be positive")
    @Digits(integer = 13, fraction = 2, message = "Budget format invalid")
    private BigDecimal estimatedBudget;
    
    @NotNull(message = "Required date is required")
    @Future(message = "Required date must be in the future")
    private LocalDate requiredDate;
    
    @Email(message = "Invalid email format")
    private String contactEmail;
}
```

---

### CORS Policy

**Allowed Origins**:
- `https://procurement.hpcl.com` (Production)
- `https://staging-procurement.hpcl.com` (Staging)
- `http://localhost:3000` (Local development)

**Spring Boot CORS Configuration**:
```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "https://procurement.hpcl.com",
                "https://staging-procurement.hpcl.com",
                "http://localhost:3000"
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

---

## Network Security

### VPC Architecture

**Subnets**:
1. **Public Subnet** (DMZ): Load Balancer, Bastion Host
2. **Private Subnet (App Tier)**: API servers, Workflow engine
3. **Private Subnet (Data Tier)**: MySQL, Kafka, S3 gateway

**Security Groups**:
```hcl
# Load Balancer Security Group
resource "aws_security_group" "lb_sg" {
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["10.0.1.0/24"] # App subnet
  }
}

# Application Security Group
resource "aws_security_group" "app_sg" {
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.lb_sg.id]
  }
  
  egress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["10.0.2.0/24"] # DB subnet
  }
}

# Database Security Group
resource "aws_security_group" "db_sg" {
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

---

### TLS/SSL Configuration

**Certificate Management**:
- **Provider**: Let's Encrypt (cert-manager in K8s) or AWS ACM
- **Algorithm**: RSA 2048-bit or ECDSA P-256
- **Auto-Renewal**: 30 days before expiry

**TLS Settings**:
- **Minimum Version**: TLS 1.3
- **Cipher Suites**: `TLS_AES_128_GCM_SHA256`, `TLS_AES_256_GCM_SHA384`
- **HSTS**: Enabled (max-age=31536000)

**Nginx Configuration**:
```nginx
server {
    listen 443 ssl http2;
    server_name procurement.hpcl.com;
    
    ssl_certificate /etc/nginx/certs/procurement.crt;
    ssl_certificate_key /etc/nginx/certs/procurement.key;
    
    ssl_protocols TLSv1.3;
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384';
    ssl_prefer_server_ciphers on;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## Data Encryption

### Encryption at Rest

**Database** (MySQL):
- **Method**: Transparent Data Encryption (TDE)
- **Key**: AWS KMS (Customer Managed Key)
- **Rotation**: Every 90 days (automatic)

**Object Storage** (S3):
- **Method**: Server-Side Encryption (SSE-KMS)
- **Key**: Unique key per object
- **Bucket Policy**: Deny unencrypted uploads

**S3 Bucket Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyUnencryptedObjectUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::hpcl-procurement-documents/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "aws:kms"
        }
      }
    }
  ]
}
```

---

### Encryption in Transit

**Internal Services** (mTLS):
- **Service Mesh**: Istio / Linkerd
- **Certificate Authority**: Internal CA (cert-manager)
- **Rotation**: Every 30 days

**External APIs**:
- **TLS 1.3**: All external calls (SAP, GeM, eMudhra)
- **Certificate Pinning**: Pin eMudhra certificates

---

## Secrets Management

### HashiCorp Vault

**Architecture**:
```
Application → Vault Agent → Vault Server → Encrypted Storage
```

**Secret Types**:
- **Database Credentials**: Auto-rotated every 90 days
- **API Keys**: SAP, GeM, eMudhra
- **JWT Signing Keys**: RS256 private key
- **Encryption Keys**: AES-256 master key

**Vault Configuration**:
```hcl
# Enable database secrets engine
vault secrets enable database

# Configure MySQL connection
vault write database/config/mysql \
    plugin_name=mysql-database-plugin \
    connection_url="{{username}}:{{password}}@tcp(mysql:3306)/" \
    allowed_roles="procurement-api" \
    username="vault_admin" \
    password="VAULT_ADMIN_PASSWORD"

# Create role with dynamic credentials
vault write database/roles/procurement-api \
    db_name=mysql \
    creation_statements="CREATE USER '{{name}}'@'%' IDENTIFIED BY '{{password}}'; GRANT SELECT,INSERT,UPDATE,DELETE ON hpcl_procurement.* TO '{{name}}'@'%';" \
    default_ttl="1h" \
    max_ttl="24h"
```

**Spring Boot Integration**:
```yaml
# application.yml
spring:
  cloud:
    vault:
      host: vault.hpcl.com
      port: 8200
      scheme: https
      authentication: KUBERNETES
      kubernetes:
        role: procurement-api
        service-account-token-file: /var/run/secrets/kubernetes.io/serviceaccount/token
      database:
        enabled: true
        role: procurement-api
        backend: database
```

---

## OWASP Top 10 Mitigations

### A01: Broken Access Control
**Mitigation**:
- Spring Security RBAC enforcement
- JWT with role claims
- Method-level security (`@PreAuthorize("hasRole('ADMIN')")`)

### A02: Cryptographic Failures
**Mitigation**:
- TLS 1.3 for all traffic
- AES-256 encryption at rest
- No hardcoded secrets (Vault)

### A03: Injection
**Mitigation**:
- Parameterized queries (JPA)
- Input validation (@Valid annotations)
- OWASP Java Encoder for output

### A04: Insecure Design
**Mitigation**:
- Threat modeling (STRIDE)
- Security design reviews
- Principle of least privilege

### A05: Security Misconfiguration
**Mitigation**:
- Disable default accounts
- Remove unused endpoints
- Security headers (HSTS, CSP)

### A06: Vulnerable Components
**Mitigation**:
- OWASP Dependency Check in CI
- Automated Snyk scans
- Regular updates (quarterly)

### A07: Authentication Failures
**Mitigation**:
- SSO with Keycloak
- 2FA for admins
- Account lockout (5 failed attempts)

### A08: Software and Data Integrity
**Mitigation**:
- Code signing (GPG)
- Checksum verification (SHA-256)
- Signed Docker images

### A09: Security Logging Failures
**Mitigation**:
- Comprehensive audit logs
- Centralized logging (ELK)
- Real-time alerts (Prometheus)

### A10: Server-Side Request Forgery (SSRF)
**Mitigation**:
- Whitelist allowed hosts
- Network segmentation
- Input validation for URLs

---

## Security Monitoring

### SIEM Integration

**Tool**: Splunk / ELK Stack

**Log Sources**:
- Application logs (Spring Boot)
- Audit logs (database)
- WAF logs (AWS WAF)
- K8s logs (container logs)

**Use Cases**:
- Detect brute force attacks (>5 failed logins/min)
- Anomalous API usage (sudden spike in requests)
- Unauthorized access attempts (403 errors)
- Data exfiltration (large downloads)

---

### Vulnerability Scanning

**Tools**:
- **SAST**: SonarQube (code analysis)
- **DAST**: OWASP ZAP (runtime testing)
- **Container Scanning**: Trivy, Snyk
- **Dependency Scanning**: OWASP Dependency Check

**Schedule**:
- **Daily**: Container image scans
- **Weekly**: SAST scans
- **Monthly**: Penetration testing
- **Quarterly**: Third-party security audit

---

## Compliance & Audit

### CVC Guidelines Compliance

| CVC Requirement | Implementation |
|-----------------|----------------|
| Transparent Procurement | Public tender notifications (GeM, CPPP) |
| Fair Vendor Selection | ML-based scoring, automated rule engine |
| Audit Trail | Append-only audit log, 7-year retention |
| Digital Signatures | DSC signing for approvals and POs |

### Audit Log Specification

**Schema**:
```sql
CREATE TABLE audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id BIGINT,
    user_id VARCHAR(200) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signature_hash VARCHAR(64), -- SHA-256 hash for tamper detection
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;
```

**Immutability**:
- Triggers prevent UPDATE/DELETE on audit_log
- Hash chain: `signature_hash = SHA256(prev_hash || current_record)`
- WORM storage (S3 Object Lock)

---

## Acceptance Criteria

- [ ] SSO with Keycloak operational (SAML/OIDC)
- [ ] 2FA enabled for admin users
- [ ] RBAC enforced in Spring Security
- [ ] JWT validation working (RS256, 1-hour expiry)
- [ ] API Gateway rate limiting configured (1000 req/min)
- [ ] TLS 1.3 enabled on all endpoints
- [ ] Database encrypted with TDE (KMS-managed keys)
- [ ] S3 encryption enabled (SSE-KMS)
- [ ] Vault integration for secrets management
- [ ] OWASP Dependency Check in CI pipeline
- [ ] Audit logs capture all actions (100% coverage)
- [ ] Security headers configured (HSTS, CSP, X-Frame-Options)
- [ ] SIEM integration operational (ELK Stack)
- [ ] Penetration test completed with no critical findings

---

**Version History**:
- v1.0 (2025-11-21): Initial draft

**Reviewers**:
- [ ] CISO
- [ ] Security Officer
- [ ] Solution Architect
- [ ] Compliance Team

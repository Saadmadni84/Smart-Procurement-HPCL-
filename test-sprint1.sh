#!/bin/bash

# HPCL Procurement System - Sprint 1 Testing Script
# This script tests all major API endpoints

BASE_URL="http://localhost:8080/api"

echo "========================================="
echo "HPCL Procurement System - Sprint 1 Tests"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -e "${YELLOW}Testing: $name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        echo "$body" | python3 -m json.tool | head -20
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "$body"
    fi
    echo ""
}

# Test 1: Health Check
test_endpoint "Health Check" "GET" "/health"

# Test 2: Dashboard Summary
test_endpoint "Dashboard Summary" "GET" "/dashboard/summary"

# Test 3: Get All Purchase Requests
test_endpoint "List All PRs" "GET" "/pr"

# Test 4: Get All Rules
test_endpoint "List All Rules" "GET" "/rules"

# Test 5: Get Active Rules
test_endpoint "List Active Rules" "GET" "/rules/active"

# Test 6: Get Pending Approvals
test_endpoint "List Pending Approvals" "GET" "/approvals/pending"

# Test 7: Get Open Exceptions
test_endpoint "List Open Exceptions" "GET" "/exceptions/open"

# Test 8: Create a New PR
echo -e "${YELLOW}Testing: Create New Purchase Request${NC}"
pr_data='{
  "description": "HP Printers and Scanners",
  "category": "IT Hardware",
  "department": "Administration",
  "estimatedValueInr": 250000,
  "currency": "INR",
  "requiredByDate": "2025-12-31",
  "justification": "Replacing old equipment in admin department"
}'
test_endpoint "Create PR" "POST" "/pr" "$pr_data"

# Test 9: Create a New Rule
echo -e "${YELLOW}Testing: Create New Business Rule${NC}"
rule_data='{
  "category": "Capital Equipment",
  "fieldName": "estimatedValueInr",
  "operator": ">=",
  "ruleValue": "10000000",
  "description": "Capital expenditure above 10 Cr requires Board approval",
  "action": "REQUIRE_APPROVAL",
  "severity": "CRITICAL",
  "automatable": false,
  "createdBy": "admin@hpcl.co.in",
  "active": true
}'
test_endpoint "Create Rule" "POST" "/rules" "$rule_data"

# Test 10: Get PRs by Category
test_endpoint "Get IT Hardware PRs" "GET" "/pr?category=IT%20Hardware"

echo ""
echo "========================================="
echo -e "${GREEN}Sprint 1 API Testing Complete!${NC}"
echo "========================================="
echo ""
echo "Frontend URL: http://localhost:3000"
echo "Backend URL: http://localhost:8080"
echo "H2 Console: http://localhost:8080/h2-console"
echo ""
echo "Logs:"
echo "  Backend: /tmp/procurement-backend.log"
echo "  Frontend: /tmp/procurement-frontend.log"
echo ""
